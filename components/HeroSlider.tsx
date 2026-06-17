"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "./SmartImage";
import { motion, AnimatePresence } from "framer-motion";

interface HeroSliderProps {
    customSlides?: Record<string, string>;
    customText?: Record<string, string>;
}

export function HeroSlider({ customSlides = {}, customText = {} }: HeroSliderProps) {
    const slides = [
        customSlides["hero-slide-1"] || "/products/ring-2.jpg",
        customSlides["hero-slide-2"] || "/products/earrings-1.jpg",
        customSlides["hero-slide-3"] || "/products/loose-diamond.jpg",
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    // Auto-advance slides every 6 seconds
    useEffect(() => {
        const timer = setInterval(nextSlide, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section 
            className="relative w-full overflow-hidden bg-white flex items-center"
            style={{ height: "calc(100vh - var(--header-height, 120px))" }}
        >
            {/* Background Images with AnimatePresence */}
            <div className="absolute inset-0 z-0 bg-[#FAF8F4] w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <SmartImage 
                            src={slides[currentSlide]} 
                            alt={`Zynora Luxe Fine Jewelry Slide ${currentSlide + 1}`}
                            fill 
                            fallbackType="jewelry" 
                            className="object-cover object-center w-full h-full" 
                            priority={currentSlide === 0}
                            sizes="100vw"
                            {...({ fetchPriority: currentSlide === 0 ? "high" : "low" } as any)}
                        />
                        {/* Subtle luxury overlay only if needed */}
                        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-y-0 left-0 w-full z-10 flex items-center">
                <div className="w-full px-6 md:px-12 lg:pl-[12%] lg:pr-6 flex justify-center lg:justify-start">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
                        <Link 
                            href="/customizer/step-1-diamond" 
                            className="inline-flex items-center justify-center w-full sm:w-auto px-[28px] py-[14px] text-[13px] uppercase tracking-[0.12em] font-semibold bg-[#C9A14A] text-white hover:bg-[#B58F3B] transition-all duration-300 shadow-[0_8px_24px_rgba(201,161,74,0.15)] relative group text-center"
                        >
                            <span className="relative z-10 text-white-force">Begin Custom Design</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                        </Link>
                        <Link 
                            href="/shop" 
                            className="inline-flex items-center justify-center w-full sm:w-auto px-[28px] py-[14px] text-[13px] uppercase tracking-[0.12em] font-semibold bg-white border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative group text-center"
                        >
                            <span className="relative z-10">Explore Collection</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows at Left and Right corners */}
            <button
                onClick={prevSlide}
                className="absolute left-4 z-20 w-10 h-10 rounded-full border border-[#EAEAEA] bg-white/60 hover:bg-white text-[#1A1A1A] hover:text-[#C9A14A] backdrop-blur-sm flex items-center justify-center transition-all duration-300 focus:outline-none"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 z-20 w-10 h-10 rounded-full border border-[#EAEAEA] bg-white/60 hover:bg-white text-[#1A1A1A] hover:text-[#C9A14A] backdrop-blur-sm flex items-center justify-center transition-all duration-300 focus:outline-none"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </section>
    );
}
