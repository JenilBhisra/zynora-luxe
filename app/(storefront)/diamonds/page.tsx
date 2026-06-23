import { Metadata } from "next";
import { AnimatedSection } from "@/components/AnimatedSection";
import nextDynamic from "next/dynamic";

export const revalidate = 300;

const DiamondSearchClient = nextDynamic(() => import("./DiamondSearchClient").then(mod => mod.DiamondSearchClient), {
    loading: () => <div className="py-24 flex items-center justify-center text-white/40 font-serif tracking-[0.2em] text-xs uppercase animate-pulse">Loading Diamond Search...</div>
});

export const metadata: Metadata = {
    title: "Premium Certified Diamonds | ZYNORA LUXE",
    description: "Explore our collection of certified loose diamonds. Filter by carat, cut, color, clarity, and certification to find your perfect diamond.",
    keywords: ["certified diamonds", "loose diamonds", "GIA diamonds", "IGI diamonds", "diamond search"],
    openGraph: {
        title: "Premium Certified Diamonds | ZYNORA LUXE",
        description: "Browse certified loose diamonds with advanced filtering options.",
        images: ["/products/loose-diamond.jpg"],
        type: "website",
    },
};

export default async function DiamondsPage() {
    return (
        <main className="min-h-screen pb-32 bg-white text-zinc-900">
            <AnimatedSection className="py-12 md:py-16 bg-[#FAF8F4] border-b border-zinc-100">
                <div className="container-custom flex flex-col items-center text-center max-w-4xl mx-auto px-4">
                    <span className="text-[9px] md:text-[10px] tracking-[0.34em] font-bold text-[#C9A14A] uppercase mb-3 block">Diamonds</span>
                    <h1 className="mb-4 text-[24px] md:text-[32px] font-serif text-zinc-900 font-normal tracking-wide">
                        Find Your Perfect Diamond
                    </h1>
                    <p className="text-zinc-500 font-normal max-w-[560px] mx-auto text-sm md:text-base leading-relaxed">
                        Certified loose diamonds selected for brilliance and balance. Search by carat, cut, color, clarity, and certification in a refined, premium layout.
                    </p>
                </div>
            </AnimatedSection>
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
                <DiamondSearchClient shapeImages={{}} />
            </div>
        </main>
    );
}
