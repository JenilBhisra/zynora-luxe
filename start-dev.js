const net = require("net");
const tls = require("tls");
const { spawn } = require("child_process");

const PROXIES = [
    {
        localPort: 5433,
        remoteHost: "ep-shy-field-aoiidbou-pooler.c-2.ap-southeast-1.aws.neon.tech",
        name: "Pooler Connection"
    },
    {
        localPort: 5434,
        remoteHost: "ep-shy-field-aoiidbou.c-2.ap-southeast-1.aws.neon.tech",
        name: "Direct Connection"
    }
];

const servers = [];

function startProxy({ localPort, remoteHost, name }) {
    const server = net.createServer((clientSocket) => {
        let remoteSocket = null;
        let clientBuffer = [];
        let isConnected = false;

        remoteSocket = tls.connect({
            host: remoteHost,
            port: 5432,
            servername: remoteHost,
            family: 4,
            rejectUnauthorized: true
        }, () => {
            isConnected = true;
            for (const data of clientBuffer) {
                remoteSocket.write(data);
            }
            clientBuffer = [];
        });

        remoteSocket.on("data", (data) => {
            clientSocket.write(data);
        });

        remoteSocket.on("error", (err) => {
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

            if (isConnected) {
                remoteSocket.write(data);
            } else {
                clientBuffer.push(data);
            }
        });

        clientSocket.on("error", (err) => {
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
        console.log(`[DB Proxy - ${name}] Listening on 127.0.0.1:${localPort} -> ${remoteHost}:5432 (forced IPv4)`);
    });

    servers.push(server);
}

// Start all proxies
console.log("[DB Proxy] Starting database connection proxies...");
PROXIES.forEach(startProxy);

// Start Next.js dev server (forwarding arguments)
const nextArgs = process.argv.slice(2);
const args = ["next", "dev", ...nextArgs];
console.log(`[DB Proxy] Running command: npx ${args.join(" ")}`);

const nextProcess = spawn("npx", args, {
    stdio: "inherit",
    shell: true
});

function cleanup() {
    console.log("\n[DB Proxy] Shutting down proxies...");
    servers.forEach(server => server.close());
    process.exit();
}

nextProcess.on("exit", (code) => {
    console.log(`[DB Proxy] Next.js process exited with code ${code}`);
    cleanup();
});

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
