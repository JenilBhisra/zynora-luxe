const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const featured = await prisma.product.findMany({
    where: { isFeatured: true },
    select: {
      id: true,
      name: true,
      images: true,
    }
  });

  console.log("Featured products found:", featured.length);
  for (const prod of featured) {
    console.log(`- ID: ${prod.id}, Name: ${prod.name}, Images length in chars: ${prod.images.length}`);
    if (prod.images.length > 1000) {
      console.log(`  First 200 chars: ${prod.images.substring(0, 200)}`);
      console.log(`  Last 200 chars: ${prod.images.substring(prod.images.length - 200)}`);
    }
  }

  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      images: true,
    }
  });
  console.log("\nAll products sizes:");
  for (const prod of allProducts) {
    if (prod.images.length > 100000) {
      console.log(`⚠️ LARGE - ID: ${prod.id}, Name: ${prod.name}, Images length: ${prod.images.length}`);
    }
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
