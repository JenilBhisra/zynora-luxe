import { DiamondSearchClient } from "./DiamondSearchClient";
import { Metadata } from "next";
import { AnimatedSection } from "@/components/AnimatedSection";

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

export default function DiamondsPage() {
    return (
        <main className="min-h-screen pb-32 bg-[#0B0B0C] text-white">
            <AnimatedSection className="py-20 md:py-28 bg-[#0B0B0C]">
                <div className="container-custom flex flex-col items-center text-center max-w-4xl mx-auto">
                    <span className="text-[10px] md:text-[11px] tracking-[0.34em] font-medium text-[#D6B25E] uppercase mb-4 block">Diamonds</span>
                    <h1 className="mb-6 max-w-[720px] mx-auto text-white">
                        Find Your Perfect Diamond
                    </h1>
                    <p className="text-white/70 font-normal max-w-[560px] mx-auto text-[16px] md:text-[18px] leading-[1.9]">
                        Certified loose diamonds selected for brilliance and balance. Search by carat, cut, color, clarity, and certification in a refined, premium layout.
                    </p>
                </div>
            </AnimatedSection>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <DiamondSearchClient />
            </div>
        </main>
    );
}
