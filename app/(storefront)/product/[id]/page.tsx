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
    const product = await prisma.product.findUnique({
        where: { slug: decodedSlug }
    });

    if (!product) return { title: "Product Not Found | ZYNORA LUXE" };

    const firstImage = getFirstImageFromMedia(product.images);

    return {
        title: `${product.name} | ZYNORA LUXE`,
        description: product.description.substring(0, 160),
        keywords: [
            product.name,
            "diamond jewelry",
            "luxury ring",
            product.metalType,
            product.categoryId,
        ],
        openGraph: {
            title: product.name,
            description: product.description.substring(0, 160),
            images: firstImage ? [firstImage] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: product.name,
            description: product.description.substring(0, 160),
            images: firstImage ? [firstImage] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Treat params.id as slug according to link structure
    const { id } = await params;
    const decodedSlug = decodeURIComponent(id);
    const product = await prisma.product.findUnique({
        where: { slug: decodedSlug },
        include: { diamond: true, category: true }
    });

    if (!product) {
        return <div className="py-32 text-center text-2xl text-text-dark font-heading">Product Not Found</div>;
    }

    const firstImage = getFirstImageFromMedia(product.images);
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: [firstImage],
        brand: {
            "@type": "Brand",
            name: "ZYNORA LUXE",
        },
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: Number(product.price).toFixed(2),
            availability: product.stockCount > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
