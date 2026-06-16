import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { AnimatedSection } from "@/components/AnimatedSection";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { ChevronLeft } from "lucide-react";
import { ProductListClient } from "./components/ProductListClient";

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

    const INITIAL_LIMIT = 8;

    const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
            where: { category: { slug: categorySlug } },
            orderBy: { createdAt: "desc" },
            take: INITIAL_LIMIT,
        }),
        prisma.product.count({
            where: { category: { slug: categorySlug } }
        })
    ]);

    // Serialize decimal/float field price if needed, or pass directly
    const formattedProducts = products.map(p => ({
        ...p,
        price: Number(p.price)
    }));

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
                            {totalCount} Items
                        </div>
                    </div>
                </div>
            </AnimatedSection>
 
            <div className="container-custom section-pad-lg">
                <section className="flex-1">
                    {totalCount === 0 ? (
                        <div className="text-center py-24 luxury-panel rounded-[22px]">
                            <p className="text-white/60 tracking-widest uppercase font-medium text-sm mb-6">
                                We are currently curating this collection.
                            </p>
                            <Link href="/shop">
                                <Button variant="outline">Explore Other Collections</Button>
                            </Link>
                        </div>
                    ) : (
                        <ProductListClient
                            initialProducts={formattedProducts}
                            totalCount={totalCount}
                            categorySlug={categorySlug}
                            limit={INITIAL_LIMIT}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
