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
        <section className="relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden bg-white flex items-center">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-[#EAF5FF]">
                <SmartImage 
                    src={heroImage} 
                    alt="Zynora Luxe Fine Jewelry"
                    fill 
                    fallbackType="jewelry" 
                    className="object-cover object-center" 
                    priority
                />
                {/* Subtle luxury overlay only if needed */}
                <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 w-full flex items-center h-full">
                <div className="container-custom w-full flex items-center justify-center lg:justify-start">
                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center w-full">
                        <Link 
                            href="/customizer/step-1-diamond" 
                            className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-5 text-[12px] md:text-[13px] uppercase tracking-[0.2em] font-semibold bg-[#C9A14A] text-white hover:bg-[#B58F3B] transition-all duration-300 shadow-[0_8px_24px_rgba(201,161,74,0.25)] relative group text-center"
                        >
                            <span className="relative z-10 text-white-force">Begin Custom Design</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                        </Link>
                        <Link 
                            href="/shop" 
                            className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-5 text-[12px] md:text-[13px] uppercase tracking-[0.2em] font-semibold bg-white border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative group text-center"
                        >
                            <span className="relative z-10">Explore Collection</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
