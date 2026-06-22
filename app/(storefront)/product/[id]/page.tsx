import { PrismaClient } from "@prisma/client";
import dynamic from "next/dynamic";
import { Metadata } from "next";

const ProductClient = dynamic(() => import("./ProductClient"), {
    loading: () => <div className="py-32 flex justify-center text-[#111111]">Loading Details...</div>
});

const prisma = new PrismaClient();
const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;

function getFirstImageFromMedia(images: string | null | undefined) {
    if (!images) return "";
    try {
        const parsed = JSON.parse(images);
        if (!Array.isArray(parsed)) return "";
        const firstImage = parsed.find((src) => typeof src === "string" && !VIDEO_EXT_REGEX.test(src));
        return typeof firstImage === "string" ? firstImage : "";
    } catch {
        return "";
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const decodedSlug = decodeURIComponent(id);
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: decodedSlug },
                { id: decodedSlug }
            ]
        }
    });

    if (!product) return { title: "Product Not Found | Zynora Luxe" };

    const firstImage = getFirstImageFromMedia(product.images);
    const title = product.seoTitle || `${product.name} | Zynora Luxe`;
    const description = product.seoDescription || product.description.substring(0, 160);
    const productUrl = `https://zynoraluxe.com/product/${product.slug || product.id}`;

    return {
        title,
        description,
        keywords: product.tags 
            ? product.tags.split(",").map(t => t.trim()) 
            : [product.name, "diamond jewelry", "luxury ring", product.metalType],
        alternates: {
            canonical: productUrl,
        },
        openGraph: {
            title,
            description,
            url: productUrl,
            images: firstImage ? [firstImage] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: firstImage ? [firstImage] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Treat params.id as slug or ID
    const { id } = await params;
    const decodedSlug = decodeURIComponent(id);
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: decodedSlug },
                { id: decodedSlug }
            ]
        },
        include: { diamond: true, category: true }
    });

    if (!product) {
        return <div className="py-32 text-center text-2xl text-text-dark font-heading">Product Not Found</div>;
    }

    const firstImage = getFirstImageFromMedia(product.images);
    
    // Auto-generate keywords
    const keywordsList = product.searchKeywords 
        ? product.searchKeywords.split(",").map(k => k.trim())
        : [product.name];

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.seoDescription || product.description,
        image: firstImage ? [firstImage] : [],
        category: product.category?.name || "Jewelry",
        keywords: keywordsList.join(", "),
        brand: {
            "@type": "Brand",
            name: "Zynora Luxe",
        },
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: Number(product.price).toFixed(2),
            url: `https://zynoraluxe.com/product/${product.slug || product.id}`,
            availability: product.stockCount > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <ProductClient product={product} />
        </>
    );
}
