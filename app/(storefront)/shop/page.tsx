import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FadeIn } from "@/components/FadeIn";
import { selectCardImage } from "@/lib/image-utils";

const prisma = new PrismaClient();

const categoriesList = [
    { name: "Engagement Ring", slug: "engagement-ring", fallback: "ring-2.jpg" },
    { name: "Pendant", slug: "pendant", fallback: "pendant.jpg" },
    { name: "Bracelet and Watch", slug: "bracelet-and-watch", fallback: "bracelet.jpg" },
    { name: "Earrings", slug: "earrings", fallback: "earrings-1.jpg" },
    { name: "Necklace", slug: "necklace", fallback: "necklace.jpg" }
];

export const dynamic = "force-dynamic";

export default async function ShopCategoryPage() {
    // We want to fetch one latest product for each category to act as its poster image
    // If no product exists for that category, we will use the fallback image.
    
    // Create an array of promises to fetch the latest product for each category
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

    const categoriesWithProducts = await Promise.all(categoryPromises);

    return (
        <div className="min-h-screen pb-24 bg-white text-zinc-900">
            <AnimatedSection className="pt-20 pb-8 md:pt-24 md:pb-12 bg-[#FAF8F4] border-b border-zinc-100">
                <div className="container-custom">
                    <div className="max-w-[720px] text-center mx-auto">
                        <span className="text-[9px] md:text-[10px] tracking-[0.34em] font-medium text-[#C9A14A] uppercase mb-3 block">Collections</span>
                        <h1 className="mb-3 text-[24px] md:text-[32px] text-zinc-900 font-serif font-normal">Discover the Signatures</h1>
                        <p className="text-zinc-500 font-normal text-[13px] md:text-[14px] leading-relaxed">
                            Explore our meticulously curated categories, featuring unparalleled craftsmanship and ethically sourced diamonds.
                        </p>
                    </div>
                </div>
            </AnimatedSection>

            <div className="container-custom pt-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {categoriesWithProducts.map((cat, i) => {
                        let imageUrl = `/products/${cat.fallback}`;
                        if (cat.product && cat.product.images) {
                            imageUrl = selectCardImage(cat.product.images, new Set(), "jewelry", 0, cat.product.id, cat.product.name);
                        }

                        return (
                            <FadeIn key={cat.slug} delay={i * 0.1}>
                                <Link href={`/shop/${cat.slug}`} className="block group relative luxury-shell overflow-hidden rounded-[24px] aspect-[4/5] md:aspect-square lg:aspect-[4/5] premium-hover-lift">
                                    <SmartImage 
                                        src={imageUrl} 
                                        alt={cat.name} 
                                        fill 
                                        sizeType="thumbnail"
                                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.08] filter group-hover:brightness-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-700 opacity-90 group-hover:opacity-100" />
                                    
                                    <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-center text-center">
                                        <h3 className="text-3xl md:text-4xl font-heading !text-[#FFF8EA] mb-3 group-hover:!text-[#C9A14A] transition-colors duration-500" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>{cat.name}</h3>
                                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold !text-[#D6B45A] group-hover:!text-white transition-colors flex items-center gap-2" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>
                                            Explore <span className="text-[#C9A14A]">→</span>
                                        </span>
                                    </div>
                                </Link>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
