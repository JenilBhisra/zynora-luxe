import { PrismaClient } from "@prisma/client";
import { selectCardImage } from "@/lib/image-utils";
import ShopClient from "./ShopClient";

import { unstable_cache } from "next/cache";

const prisma = new PrismaClient();

const categoriesList = [
    { name: "Engagement Ring", slug: "engagement-ring", fallback: "ring-2.jpg" },
    { name: "Pendant", slug: "pendant", fallback: "pendant.jpg" },
    { name: "Bracelet and Watch", slug: "bracelet-and-watch", fallback: "bracelet.jpg" },
    { name: "Earrings", slug: "earrings", fallback: "earrings-1.jpg" },
    { name: "Necklace", slug: "necklace", fallback: "necklace.jpg" }
];

export const revalidate = 300;

const getCachedCategoriesWithProducts = unstable_cache(
    async () => {
        const categoryPromises = categoriesList.map(async (cat) => {
            const product = await prisma.product.findFirst({
                where: { category: { slug: cat.slug } },
                orderBy: { createdAt: "desc" },
                select: { images: true, id: true, slug: true, name: true }
            });
            
            return {
                ...cat,
                product
            };
        });
        return Promise.all(categoryPromises);
    },
    ["shop-categories-list"],
    { revalidate: 300, tags: ["shop-categories-list"] }
);

export default async function ShopCategoryPage() {
    const categoriesWithProducts = await getCachedCategoriesWithProducts();

    // Fetch custom category images from SiteAsset
    const siteAssets = await prisma.siteAsset.findMany({
        where: {
            key: {
                in: [
                    "category-engagement-ring",
                    "category-pendant",
                    "category-bracelet-and-watch",
                    "category-earrings",
                    "category-necklace"
                ]
            }
        }
    });

    const assetsMap = siteAssets.reduce((acc: Record<string, string>, asset) => {
        acc[asset.key] = asset.url;
        return acc;
    }, {});

    const resolvedCategories = categoriesWithProducts.map(cat => {
        const assetKey = `category-${cat.slug}`;
        let imageUrl = assetsMap[assetKey] || `/products/${cat.fallback}`;
        if (!assetsMap[assetKey] && cat.product && cat.product.images) {
            imageUrl = selectCardImage(cat.product.images, new Set(), "jewelry", 0, cat.product.id, cat.product.name);
        }

        return {
            name: cat.name,
            slug: cat.slug,
            fallback: cat.fallback,
            imageUrl
        };
    });

    return <ShopClient initialCategories={resolvedCategories} />;
}
