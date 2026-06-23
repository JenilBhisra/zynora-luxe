const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.siteAsset.findMany();
  console.log("Total site assets:", assets.length);
  let totalLength = 0;
  for (const asset of assets) {
    console.log(`- Key: ${asset.key}, URL length: ${asset.url.length}`);
    totalLength += asset.url.length;
    if (asset.url.length > 1000) {
      console.log(`  First 100 chars: ${asset.url.substring(0, 100)}`);
      console.log(`  Last 100 chars: ${asset.url.substring(asset.url.length - 100)}`);
    }
  }
  console.log("Total site assets url characters size:", totalLength);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
