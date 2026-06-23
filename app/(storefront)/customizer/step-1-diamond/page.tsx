import { DiamondSearchClient } from "@/app/(storefront)/diamonds/DiamondSearchClient";
import { AnimatedSection } from "@/components/AnimatedSection";

export const revalidate = 300;

export default async function Step1DiamondPage() {
    return (
        <div className="animate-in fade-in duration-700 text-zinc-900">
            <AnimatedSection className="text-center mb-6 block md:hidden">
                <h2 className="text-xl font-medium text-zinc-900 mb-2">Choose Your Diamond</h2>
                <p className="text-sm text-zinc-500 font-normal max-w-[560px] mx-auto">Select the perfect center stone to begin your custom ring journey.</p>
            </AnimatedSection>

            <AnimatedSection as="div" className="w-full" delay={0.08}>
                <DiamondSearchClient customizerMode={true} shapeImages={{}} />
            </AnimatedSection>
        </div>
    );
}
