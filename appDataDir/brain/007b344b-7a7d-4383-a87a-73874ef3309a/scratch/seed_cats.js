const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = [
        { name: "Engagement Rings", slug: "engagement-rings" },
        { name: "Necklaces", slug: "necklaces" },
        { name: "Earrings", slug: "earrings" },
        { name: "Pendants", slug: "pendants" },
        { name: "Bracelets", slug: "bracelets" },
        { name: "Wedding Bands", slug: "wedding-bands" }
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        });
    }
    console.log("Categories seeded successfully.");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
