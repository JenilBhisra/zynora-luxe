const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function generateKeywords(name, categoryName, metalType) {
    const keywords = new Set();
    const normalizedName = name.toLowerCase();
    const normalizedCat = categoryName.toLowerCase();
    keywords.add(normalizedCat);
    const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
    nameWords.forEach(w => keywords.add(w));
    const shapes = ["round", "oval", "princess", "emerald", "cushion", "marquise", "pear", "radiant", "asscher", "heart"];
    shapes.forEach(s => {
        if (normalizedName.includes(s)) {
            keywords.add(s);
            keywords.add(`${s} ring`);
            keywords.add(`${s} diamond ring`);
        }
    });
    if (metalType) {
        const mt = metalType.toLowerCase();
        keywords.add(mt);
        if (mt.includes("gold")) {
            keywords.add("gold ring");
            keywords.add("gold jewelry");
        } else if (mt.includes("platinum")) {
            keywords.add("platinum ring");
            keywords.add("platinum jewelry");
        }
    }
    if (normalizedName.includes("lab grown") || normalizedName.includes("lab-grown")) {
        keywords.add("lab grown");
        keywords.add("lab grown diamond");
        keywords.add("lab grown diamond ring");
    } else if (normalizedName.includes("natural")) {
        keywords.add("natural diamond");
        keywords.add("natural diamond ring");
    }
    if (normalizedCat.includes("ring")) {
        keywords.add("ring");
        if (normalizedCat.includes("engagement")) {
            keywords.add("engagement ring");
            keywords.add("proposal ring");
            keywords.add("bridal ring");
            keywords.add("wedding ring");
        }
    } else if (normalizedCat.includes("pendant")) {
        keywords.add("pendant");
        keywords.add("necklace");
        keywords.add("diamond pendant");
    } else if (normalizedCat.includes("bracelet")) {
        keywords.add("bracelet");
        keywords.add("bangle");
    } else if (normalizedCat.includes("earring")) {
        keywords.add("earring");
        keywords.add("studs");
        keywords.add("diamond earrings");
    } else if (normalizedCat.includes("necklace")) {
        keywords.add("necklace");
        keywords.add("diamond necklace");
    }
    return Array.from(keywords);
}

async function main() {
    console.log("Starting SEO and keywords backfill...");
    const products = await prisma.product.findMany({
        include: { category: true }
    });

    console.log(`Found ${products.length} products to process.`);

    for (const product of products) {
        console.log(`Processing product: ${product.name} (${product.id})`);
        
        // Generate unique slug
        const slug = product.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-') + '-' + product.id.slice(-4);

        // Generate keywords
        const autoKeywords = generateKeywords(product.name, product.category.name, product.metalType);
        const extraKeywordsArray = product.extraKeywords
            ? product.extraKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)
            : [];
        const mergedKeywords = Array.from(new Set([...autoKeywords, ...extraKeywordsArray]));
        const searchKeywordsString = mergedKeywords.join(", ");

        const updated = await prisma.product.update({
            where: { id: product.id },
            data: {
                slug: slug,
                tags: product.tags || "",
                extraKeywords: product.extraKeywords || "",
                searchKeywords: searchKeywordsString,
                seoTitle: product.seoTitle || `${product.name} | Zynora Luxe`,
                seoDescription: product.seoDescription || product.description.substring(0, 160)
            }
        });

        console.log(`Updated product: ${updated.name} with slug: ${updated.slug}`);
    }

    console.log("Backfill completed successfully.");
}

main()
    .catch((e) => {
        console.error("Error during backfill:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
