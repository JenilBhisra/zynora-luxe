const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const assets = await prisma.siteAsset.findMany();
  console.log(`Loaded ${assets.length} assets from DB.`);

  const htmlPath = path.join(__dirname, "../.next/server/app/index.html");
  if (!fs.existsSync(htmlPath)) {
    console.log("HTML not found.");
    await prisma.$disconnect();
    return;
  }

  const html = fs.readFileSync(htmlPath, "utf-8");

  // Extract all base64-like matches from HTML
  const matches = html.match(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g) || [];
  console.log(`Found ${matches.length} base64 strings in HTML.`);

  const matchedKeys = new Set();
  for (const match of matches) {
    // Check which asset has this URL or matches a prefix
    let found = false;
    for (const asset of assets) {
      if (asset.url === match || asset.url.substring(0, 100) === match.substring(0, 100)) {
        matchedKeys.add(asset.key);
        found = true;
      }
    }
    if (!found) {
      console.log(`Unmatched base64 string start: ${match.substring(0, 50)}... length: ${match.length}`);
    }
  }

  console.log("\nSerialized Assets in HTML:");
  for (const key of matchedKeys) {
    const asset = assets.find(a => a.key === key);
    console.log(`- ${key}: ${(asset.url.length / 1024).toFixed(2)} KB`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
