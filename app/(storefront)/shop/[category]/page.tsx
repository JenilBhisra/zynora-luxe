import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { AnimatedSection } from "@/components/AnimatedSection";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { ChevronLeft } from "lucide-react";
import { ProductListClient } from "./components/ProductListClient";

const prisma = new PrismaClient();

const categoriesList = [
    { name: "Engagement Ring", slug: "engagement-ring" },
    { name: "Pendant", slug: "pendant" },
    { name: "Bracelet and Watch", slug: "bracelet-and-watch" },
    { name: "Earrings", slug: "earrings" },
    { name: "Necklace", slug: "necklace" }
];

export const dynamic = "force-dynamic";

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
        <div className="min-h-screen pb-32 bg-white text-zinc-900">
            <AnimatedSection className="pt-20 pb-8 md:pt-24 md:pb-12 bg-[#FAF8F4] border-b border-zinc-100">
                <div className="container-custom">
                    <div className="mb-8">
                        <Link href="/shop" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group">
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Collections
                        </Link>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6 md:items-end border-b border-zinc-200 pb-8">
                        <div>
                            <span className="text-[10px] md:text-[11px] tracking-[0.34em] font-medium text-[#C9A14A] uppercase mb-4 block">
                                Collection
                            </span>
                            <h1 className="text-zinc-900 text-4xl md:text-5xl font-heading mb-0 font-medium">
                                {categoryDetails.name}
                            </h1>
                        </div>
                        <div className="text-[11px] uppercase tracking-widest text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200 font-semibold">
                            {totalCount} Items
                        </div>
                    </div>
                </div>
            </AnimatedSection>
 
            <div className="container-custom section-pad-lg">
                <section className="flex-1">
                    {totalCount === 0 ? (
                        <div className="text-center py-24 luxury-panel rounded-[22px] bg-white border border-zinc-100 shadow-sm">
                            <p className="text-zinc-500 tracking-widest uppercase font-medium text-xs mb-6">
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
