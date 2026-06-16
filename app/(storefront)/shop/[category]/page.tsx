import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FadeIn } from "@/components/FadeIn";
import { selectCardImage } from "@/lib/image-utils";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { ChevronLeft } from "lucide-react";

const prisma = new PrismaClient();

const categoriesList = [
    { name: "Engagement Rings", slug: "engagement-rings" },
    { name: "Necklaces", slug: "necklaces" },
    { name: "Earrings", slug: "earrings" },
    { name: "Pendants", slug: "pendants" },
    { name: "Bracelets", slug: "bracelets" },
    { name: "Wedding Bands", slug: "wedding-bands" }
];

export const revalidate = 60;

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
    const params = await props.params;
    const categorySlug = params.category;
    const categoryDetails = categoriesList.find(c => c.slug === categorySlug);

    if (!categoryDetails) {
        notFound();
    }

    const products = await prisma.product.findMany({
        where: { category: { slug: categorySlug } },
        orderBy: { createdAt: "desc" },
    });

    const usedProductImages = new Set<string>();

    return (
        <div className="min-h-screen pb-32 bg-[#0B0B0C] text-white">
            <AnimatedSection className="pt-24 pb-16 md:pt-32 md:pb-20 bg-[#0B0B0C]">
                <div className="container-custom">
                    <div className="mb-8">
                        <Link href="/shop" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50 hover:text-white transition-colors group">
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Collections
                        </Link>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6 md:items-end border-b border-white/10 pb-8">
                        <div>
                            <span className="text-[10px] md:text-[11px] tracking-[0.34em] font-medium text-[#D6B25E] uppercase mb-4 block">
                                Collection
                            </span>
                            <h1 className="text-white text-4xl md:text-5xl font-heading mb-0">
                                {categoryDetails.name}
                            </h1>
                        </div>
                        <div className="text-[11px] uppercase tracking-widest text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            {products.length} Items
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            <div className="container-custom section-pad-lg">
                <section className="flex-1">
                    {products.length === 0 ? (
                        <div className="text-center py-24 luxury-panel rounded-[22px]">
                            <p className="text-white/60 tracking-widest uppercase font-medium text-sm mb-6">
                                We are currently curating this collection.
                            </p>
                            <Link href="/shop">
                                <Button variant="outline">Explore Other Collections</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                            {products.map((product, i) => {
                                const image = selectCardImage(product.images, usedProductImages, "jewelry", i, product.id, product.slug || product.name);

                                // Determine display price: show lowest karat price if set
                                let displayPrice = product.price;
                                let showFrom = false;
                                try {
                                    const kp: Record<string, number> = JSON.parse(product.karatPrices || "{}");
                                    const values = Object.values(kp).filter((v): v is number => typeof v === "number" && v > 0);
                                    if (values.length > 0) {
                                        displayPrice = Math.min(...values);
                                        showFrom = true;
                                    }
                                } catch {}

                                return (
                                    <FadeIn key={product.id} delay={(i % 8) * 0.05} className="group cursor-pointer">
                                        <Link href={`/product/${product.slug}`} className="block h-full">
                                            <div className="h-full flex flex-col luxury-shell premium-hover-lift rounded-[22px] overflow-hidden">
                                                <div className="relative aspect-[4/5] overflow-hidden bg-[#0F0F11] mb-5">
                                                    <SmartImage
                                                        src={image}
                                                        alt={product.name}
                                                        fill
                                                        fallbackType="jewelry"
                                                        className="object-cover image-zoom-reveal transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-50" />
                                                    <span className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.24em] font-bold text-[#D6B25E] opacity-0 group-hover:opacity-100 transition-opacity duration-500">View Details</span>
                                                </div>
                                                <div className="text-center pb-5 px-4">
                                                    <h3 className="text-[16px] md:text-[17px] font-medium text-white mb-2 line-clamp-1 group-hover:text-[#D6B25E] transition-colors duration-500">{product.name}</h3>
                                                    <p className="text-[14px] text-white/70">
                                                        {showFrom && <span className="text-[10px] text-white/40 uppercase tracking-widest mr-1">From</span>}
                                                        ₹{displayPrice.toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
