"use client";

import Link from "next/link";
import { SmartImage } from "./SmartImage";

interface HeroSliderProps {
    customSlides?: Record<string, string>;
    customText?: Record<string, string>;
}

export function HeroSlider({ customSlides = {}, customText = {} }: HeroSliderProps) {
    const heroImage = customSlides["hero-slide-1"] || "/products/ring-2.jpg";

    return (
        <section 
            className="relative w-full overflow-hidden bg-white flex items-center"
            style={{ height: "calc(100vh - var(--header-height, 120px))" }}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-[#FAF8F4] w-full h-full">
                <SmartImage 
                    src={heroImage} 
                    alt="Zynora Luxe Fine Jewelry"
                    fill 
                    fallbackType="jewelry" 
                    className="object-cover object-center w-full h-full" 
                    priority
                    sizes="100vw"
                    {...({ fetchPriority: "high" } as any)}
                />
                {/* Subtle luxury overlay only if needed */}
                <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            </div>

            {/* Content Overlay - Positioned near the bottom-left corner */}
            <div className="absolute left-[16px] right-[16px] bottom-[90px] md:left-[32px] md:right-auto md:bottom-[130px] md:w-auto z-10 flex flex-col md:flex-row gap-[16px]">
                <Link 
                    href="/customizer/step-1-diamond" 
                    className="inline-flex items-center justify-center w-full md:w-auto uppercase font-semibold bg-[#C9A14A] text-white hover:bg-[#B58F3B] transition-all duration-300 shadow-[0_8px_24px_rgba(201,161,74,0.15)] relative group text-center"
                    style={{
                        padding: "14px 28px",
                        fontSize: "13px",
                        letterSpacing: "0.12em"
                    }}
                >
                    <span className="relative z-10 text-white-force">Begin Custom Design</span>
                    <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                </Link>
                <Link 
                    href="/shop" 
                    className="inline-flex items-center justify-center w-full md:w-auto uppercase font-semibold bg-white border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative group text-center"
                    style={{
                        padding: "14px 28px",
                        fontSize: "13px",
                        letterSpacing: "0.12em"
                    }}
                >
                    <span className="relative z-10">Explore Collection</span>
                    <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                </Link>
            </div>
        </section>
    );
}
