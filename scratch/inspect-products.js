const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.siteAsset.findMany({
    select: {
      key: true
    }
  });
  console.log("DB_ASSET_KEYS:" + JSON.stringify(assets.map(a => a.key)));
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
