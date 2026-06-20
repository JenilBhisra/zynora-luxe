const { PrismaClient } = require("@prisma/client");

async function main() {
    const url = "postgresql://neondb_owner:npg_1DZP6OnBxSpk@ep-sparkling-surf-ao6bogzf.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    console.log("Testing DIRECT_URL (no pooler)...");
    const prisma = new PrismaClient({
        datasources: {
            db: { url }
        }
    });
    try {
        const count = await prisma.user.count();
        console.log("SUCCESS! User count:", count);
    } catch (err) {
        console.log("FAILED with error:");
        console.log(err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
