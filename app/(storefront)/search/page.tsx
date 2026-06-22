import { PrismaClient } from "@prisma/client";
import { SearchClient } from "./SearchClient";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Metadata } from "next";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Search Exquisite Jewelry | Zynora Luxe",
    description: "Search for custom lab grown diamond engagement rings, settings, and bespoke fine jewelry at Zynora Luxe.",
    alternates: {
        canonical: "https://zynoraluxe.com/search",
    }
};

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q = "" } = await searchParams;
    const query = q.trim();

    let initialProducts: any[] = [];
    let totalCount = 0;

    if (query) {
        // Search in database matching title, description, metal, shape, tags, category, and keywords
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { metalType: { contains: query, mode: 'insensitive' } },
                    { tags: { contains: query, mode: 'insensitive' } },
                    { searchKeywords: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { diamond: {
                        OR: [
                            { shape: { contains: query, mode: 'insensitive' } },
                            { cut: { contains: query, mode: 'insensitive' } },
                            { clarity: { contains: query, mode: 'insensitive' } },
                            { color: { contains: query, mode: 'insensitive' } }
                        ]
                    }}
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { category: true }
        });

        totalCount = await prisma.product.count({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { metalType: { contains: query, mode: 'insensitive' } },
                    { tags: { contains: query, mode: 'insensitive' } },
                    { searchKeywords: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } },
                    { diamond: {
                        OR: [
                            { shape: { contains: query, mode: 'insensitive' } },
                            { cut: { contains: query, mode: 'insensitive' } },
                            { clarity: { contains: query, mode: 'insensitive' } },
                            { color: { contains: query, mode: 'insensitive' } }
                        ]
                    }}
                ]
            }
        });

        initialProducts = products.map(p => ({
            ...p,
            price: Number(p.price)
        }));
    }

    return (
        <div className="min-h-screen pb-32 bg-white text-zinc-900">
            <AnimatedSection className="pt-20 pb-8 md:pt-24 md:pb-12 bg-[#FAF8F4] border-b border-zinc-100">
                <div className="container-custom">
                    <div className="max-w-[720px] text-center mx-auto">
                        <span className="text-[9px] md:text-[10px] tracking-[0.34em] font-medium text-[#C9A14A] uppercase mb-3 block">
                            Store Search
                        </span>
                        <h1 className="mb-3 text-[24px] md:text-[32px] text-zinc-900 font-serif font-normal">
                            Intelligent Search
                        </h1>
                        <p className="text-zinc-500 font-normal text-[13px] md:text-[14px] leading-relaxed">
                            Search our exquisite collection of lab grown diamond engagement rings, settings, and fine jewelry.
                        </p>
                    </div>
                </div>
            </AnimatedSection>
            
            <SearchClient query={query} initialProducts={initialProducts} initialCount={totalCount} />
        </div>
    );
}
