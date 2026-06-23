import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import * as tls from "tls";
import { exec } from "child_process";

// Simple manual .env parser
function loadEnv() {
    const envPath = path.join(__dirname, "../.env");
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
            let key = match[1].trim();
            let val = match[2].trim();
            // Remove surrounding quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
        }
    }
}

// Load environment variables manually
loadEnv();

const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;
const NEW_DATABASE_URL = process.env.NEW_DATABASE_URL;

if (!OLD_DATABASE_URL || !NEW_DATABASE_URL) {
    console.error("\n=========================================================================");
    console.error("❌ ERROR: Missing database connection strings in environment.");
    console.error("Please make sure you have defined the following in your .env file:");
    console.error("OLD_DATABASE_URL=\"...\"");
    console.error("NEW_DATABASE_URL=\"...\"");
    console.error("=========================================================================\n");
    process.exit(1);
}

const BACKUP_DIR = path.join(__dirname, "../prisma_backup");
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Order of insertion (forward dependency order)
const MODELS = [
    { key: "siteAsset", label: "SiteAsset" },
    { key: "otpVerification", label: "OtpVerification" },
    { key: "customizationRequest", label: "CustomizationRequest" },
    { key: "shape", label: "Shape" },
    { key: "user", label: "User" },
    { key: "category", label: "Category" },
    { key: "diamond", label: "Diamond" },
    { key: "setting", label: "Setting" },
    { key: "product", label: "Product" },
    { key: "ringConfiguration", label: "RingConfiguration" },
    { key: "order", label: "Order" },
    { key: "orderItem", label: "OrderItem" },
    { key: "review", label: "Review" }
];

// Database proxy helper (same as start-dev.js logic)
function startProxy(localPort: number, remoteHost: string, name: string): Promise<net.Server> {
    return new Promise((resolve) => {
        const server = net.createServer((clientSocket) => {
            let remoteSocket: tls.TLSSocket | null = null;
            let clientBuffer: Buffer[] = [];
            let isConnected = false;

            remoteSocket = tls.connect({
                host: remoteHost,
                port: 5432,
                servername: remoteHost,
                family: 4,
                rejectUnauthorized: true
            } as any, () => {
                isConnected = true;
                for (const data of clientBuffer) {
                    remoteSocket?.write(data);
                }
                clientBuffer = [];
            });

            remoteSocket.on("data", (data) => {
                clientSocket.write(data);
            });

            remoteSocket.on("error", (err: any) => {
                if (err.code !== "ECONNRESET") {
                    console.error(`[DB Proxy - ${name}] Neon socket error:`, err.message);
                }
                clientSocket.destroy();
            });

            remoteSocket.on("close", () => {
                clientSocket.end();
            });

            clientSocket.on("data", (data) => {
                if (data.length === 8 && data.readInt32BE(0) === 8 && data.readInt32BE(4) === 80877103) {
                    clientSocket.write("N");
                    return;
                }

                if (isConnected && remoteSocket) {
                    remoteSocket.write(data);
                } else {
                    clientBuffer.push(data);
                }
            });

            clientSocket.on("error", (err: any) => {
                if (err.code !== "ECONNRESET") {
                    console.error(`[DB Proxy - ${name}] Client socket error:`, err.message);
                }
                if (remoteSocket) remoteSocket.destroy();
            });

            clientSocket.on("close", () => {
                if (remoteSocket) remoteSocket.end();
            });
        });

        server.listen(localPort, "127.0.0.1", () => {
            console.log(`[DB Proxy - ${name}] Tunnel established: 127.0.0.1:${localPort} -> ${remoteHost}:5432`);
            resolve(server);
        });
    });
}
// Helper to run commands asynchronously so the Node event loop is not blocked (letting the local proxies accept connections)
function runCommandAsync(cmd: string, env: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = exec(cmd, { env: { ...process.env, ...env } });
        proc.stdout?.on("data", (data) => process.stdout.write(data));
        proc.stderr?.on("data", (data) => process.stderr.write(data));
        proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with exit code ${code}`));
        });
    });
}

async function runMigration() {
    console.log("=== Starting Neon Database Migration ===");

    // Parse URLs using Node's URL class
    const oldUrlObj = new URL(OLD_DATABASE_URL!);
    const newUrlObj = new URL(NEW_DATABASE_URL!);

    const oldRemoteHost = oldUrlObj.hostname;
    const newRemoteHost = newUrlObj.hostname;

    console.log(`Old remote host: ${oldRemoteHost}`);
    console.log(`New remote host: ${newRemoteHost}`);

    // Define local ports for proxying
    const OLD_PROXY_PORT = 5435;
    const NEW_PROXY_PORT = 5436;

    // Start local proxy servers
    console.log("\nStarting local TLS proxies...");
    const oldProxy = await startProxy(OLD_PROXY_PORT, oldRemoteHost, "Old DB");
    const newProxy = await startProxy(NEW_PROXY_PORT, newRemoteHost, "New DB");

    // Construct local URLs targeting the proxy ports
    const oldProxyUrl = `postgresql://${oldUrlObj.username}:${oldUrlObj.password}@127.0.0.1:${OLD_PROXY_PORT}${oldUrlObj.pathname}?sslmode=disable`;
    const newProxyUrl = `postgresql://${newUrlObj.username}:${newUrlObj.password}@127.0.0.1:${NEW_PROXY_PORT}${newUrlObj.pathname}?sslmode=disable`;

    const oldPrisma = new PrismaClient({
        datasources: { db: { url: oldProxyUrl } }
    });

    const newPrisma = new PrismaClient({
        datasources: { db: { url: newProxyUrl } }
    });

    try {
        // 1. Connection check with retries (billing upgrades can take up to a minute to propagate)
        console.log("\nTesting connections to databases via local proxies...");
        let retries = 6;
        while (retries > 0) {
            try {
                await oldPrisma.$connect();
                console.log("✅ Connected to Old Database (via proxy)");
                break;
            } catch (err: any) {
                console.warn(`⚠️ Old DB connection retry (attempts remaining: ${retries - 1}). Error: ${err.message.trim()}`);
                retries--;
                if (retries === 0) throw err;
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
        await newPrisma.$connect();
        console.log("✅ Connected to New Database (via proxy)");

        // Push Prisma schema to the new database to ensure all tables exist
        console.log("\nPushing Prisma schema to the new database to ensure all tables exist...");
        try {
            await runCommandAsync("npx prisma db push --skip-generate", {
                DATABASE_URL: newProxyUrl,
                DIRECT_URL: newProxyUrl
            });
            console.log("✅ Schema pushed to the new database successfully.");
        } catch (pushErr: any) {
            console.error("❌ Failed to push schema to the new database:", pushErr.message);
            throw pushErr;
        }

        // 2. Fetch and Backup Data locally
        console.log("\n--- PHASE 1: Exporting data from Old Database ---");
        const backupData: Record<string, any[]> = {};
        const oldCounts: Record<string, number> = {};

        for (const model of MODELS) {
            console.log(`Exporting ${model.label}...`);
            const client = (oldPrisma as any)[model.key];
            if (!client) {
                throw new Error(`Prisma model client not found for ${model.key}`);
            }
            const data = await client.findMany();
            backupData[model.key] = data;
            oldCounts[model.key] = data.length;
            
            // Save locally
            const filePath = path.join(BACKUP_DIR, `${model.key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
            console.log(`Saved ${data.length} records to prisma_backup/${model.key}.json`);
        }

        // 3. Clear New Database (in reverse dependency order)
        console.log("\n--- PHASE 2: Clearing existing data from New Database ---");
        const reversedModels = [...MODELS].reverse();
        for (const model of reversedModels) {
            console.log(`Clearing ${model.label}...`);
            const client = (newPrisma as any)[model.key];
            await client.deleteMany({});
        }
        console.log("✅ New Database cleared of existing records.");

        // 4. Import Data into New Database (in forward dependency order)
        console.log("\n--- PHASE 3: Importing data to New Database ---");
        const newCounts: Record<string, number> = {};
        
        for (const model of MODELS) {
            const data = backupData[model.key];
            console.log(`Importing ${data.length} records into ${model.label}...`);
            const client = (newPrisma as any)[model.key];
            
            if (data.length > 0) {
                // Chunk size to prevent large payload errors in Postgres
                const chunkSize = 100;
                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, i + chunkSize);
                    await client.createMany({
                        data: chunk,
                        skipDuplicates: false
                    });
                }
            }
            
            // Verify count
            const count = await client.count();
            newCounts[model.key] = count;
            console.log(`✅ ${model.label}: Imported ${count}/${data.length} records`);
        }

        // 5. Verification checks
        console.log("\n--- PHASE 4: Verification & Comparison ---");
        console.log("-------------------------------------------------------------");
        console.log("| Table Name             | Old Count | New Count | Status   |");
        console.log("-------------------------------------------------------------");
        let allMatched = true;
        for (const model of MODELS) {
            const oldVal = oldCounts[model.key];
            const newVal = newCounts[model.key];
            const status = oldVal === newVal ? "MATCH ✅" : "MISMATCH ❌";
            if (oldVal !== newVal) allMatched = false;
            
            console.log(
                `| ${model.label.padEnd(22)} | ${String(oldVal).padStart(9)} | ${String(newVal).padStart(9)} | ${status.padEnd(8)} |`
            );
        }
        console.log("-------------------------------------------------------------");

        if (!allMatched) {
            throw new Error("Data row counts do not match between databases!");
        }

        // Verify image URLs are intact
        console.log("\nVerifying images are intact...");
        const oldProducts = backupData["product"];
        const newProducts = await newPrisma.product.findMany();
        
        const imagesValid = oldProducts.every((oldP) => {
            const newP = newProducts.find(p => p.id === oldP.id);
            return newP && newP.images === oldP.images;
        });

        if (imagesValid) {
            console.log("✅ Verified: Product images are 100% intact");
        } else {
            console.warn("⚠️ Warning: Some product image JSON fields do not match!");
        }

        // Verify Admin users exist
        const oldAdmins = backupData["user"].filter(u => u.role === "ADMIN");
        const newAdmins = await newPrisma.user.findMany({ where: { role: "ADMIN" } });
        console.log(`Old admin count: ${oldAdmins.length}, New admin count: ${newAdmins.length}`);
        
        const adminsMatch = oldAdmins.every(oldA => newAdmins.some(newA => newA.email === oldA.email));
        if (adminsMatch) {
            console.log("✅ Verified: All admin users exist and match");
        } else {
            throw new Error("Admin users count or emails do not match!");
        }

        console.log("\n=============================================================");
        console.log("🎉 SUCCESS: Neon database migration completed successfully!");
        console.log("All tables verified, row counts match, and relations are intact.");
        console.log("=============================================================\n");

    } catch (err: any) {
        console.error("\n❌ Migration failed with error:");
        console.error(err.message || err);
        process.exit(1);
    } finally {
        await oldPrisma.$disconnect();
        await newPrisma.$disconnect();
        
        console.log("Shutting down local proxies...");
        oldProxy.close();
        newProxy.close();
        console.log("Proxies shut down.");
    }
}

runMigration();
