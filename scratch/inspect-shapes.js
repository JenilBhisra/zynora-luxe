const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const shapes = await prisma.shape.findMany();
  console.log("Total shapes:", shapes.length);
  for (const s of shapes) {
    console.log(`- Shape: ${s.name} (${s.slug})`);
    console.log(`  isActive: ${s.isActive}`);
    console.log(`  imageUrl length: ${s.imageUrl?.length || 0}`);
    console.log(`  thumbnailImageUrl length: ${s.thumbnailImageUrl?.length || 0}`);
    console.log(`  previewImageUrl length: ${s.previewImageUrl?.length || 0}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
