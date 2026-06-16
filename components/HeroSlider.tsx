"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "./SmartImage";

const HERO_SLIDES = [
    {
        id: 1,
        image: "/products/ring-2.jpg",
        alt: "Fine Jewelry Model"
    },
    {
        id: 2,
        image: "/products/earrings-1.jpg",
        alt: "Diamond Ring Close-up"
    },
    {
        id: 3,
        image: "/uploads/diamonds/diamond-1774253879693-464841660.webp",
        alt: "Luxury Necklace"
    }
];

interface HeroSliderProps {
    customSlides?: Record<string, string>;
    customText?: Record<string, string>;
}

export function HeroSlider({ customSlides = {}, customText = {} }: HeroSliderProps) {
    const slides = [
        {
            id: 1,
            image: customSlides["hero-slide-1"] || "/products/ring-2.jpg",
            alt: "Fine Jewelry Model"
        },
        {
            id: 2,
            image: customSlides["hero-slide-2"] || "/products/earrings-1.jpg",
            alt: "Diamond Ring Close-up"
        },
        {
            id: 3,
            image: customSlides["hero-slide-3"] || "/uploads/diamonds/diamond-1774253879693-464841660.webp",
            alt: "Luxury Necklace"
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [parallaxOffset, setParallaxOffset] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [enableParallax, setEnableParallax] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const heroRef = useRef<HTMLElement>(null);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const headlineLines = [
        customText["text:hero-headline-1"] || "Crafted for",
        customText["text:hero-headline-2"] || "the rarest moments",
    ];
    const heroBadge = customText["text:hero-badge"] || "Certified diamonds \u2022 Bespoke rings \u2022 Hand-finished in India";
    const heroSubheadline = customText["text:hero-subheadline"] || "An understated luxury experience for custom rings, certified diamonds, and heirloom jewelry with cinematic presentation and meticulous detail.";

    useEffect(() => {
        if (prefersReducedMotion) return;

        const timer = setInterval(() => {
            if (document.hidden) return;
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(timer);
    }, [prefersReducedMotion]);

    useEffect(() => {
        const mobileQuery = window.matchMedia("(max-width: 767px)");
        const desktopQuery = window.matchMedia("(min-width: 768px)");

        const applyViewportSettings = () => {
            const mobile = mobileQuery.matches;
            setIsMobile(mobile);
            setEnableParallax(!mobile && !prefersReducedMotion);
        };

        applyViewportSettings();
        mobileQuery.addEventListener("change", applyViewportSettings);
        desktopQuery.addEventListener("change", applyViewportSettings);

        return () => {
            mobileQuery.removeEventListener("change", applyViewportSettings);
            desktopQuery.removeEventListener("change", applyViewportSettings);
        };
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (!enableParallax) return;

        let frame = 0;
        const updateParallax = () => {
            frame = 0;
            if (!heroRef.current) return;

            const rect = heroRef.current.getBoundingClientRect();
            const sectionTop = rect.top;
            const sectionHeight = rect.height;

            if (sectionTop > window.innerHeight || sectionTop + sectionHeight < 0) {
                return;
            }

            const offset = Math.round(window.scrollY * 0.4);
            setParallaxOffset(offset);
        };

        const onScroll = () => {
            if (frame !== 0) return;
            frame = window.requestAnimationFrame(updateParallax);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame !== 0) window.cancelAnimationFrame(frame);
        };
    }, [enableParallax]);

    return (
        <motion.section
            ref={heroRef}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full min-h-[100svh] overflow-hidden bg-[#0B0B0C]"
        >
            {/* Background Image Slider */}
            <div className="absolute inset-0 z-0 bg-[#faf9f6]">
                <AnimatePresence>
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <motion.div
                            initial={prefersReducedMotion ? { scale: 1 } : { scale: 1.0 }}
                            animate={prefersReducedMotion ? { scale: 1 } : { scale: 1.1 }}
                            transition={{ duration: prefersReducedMotion ? 0 : 10, ease: "linear" }}
                            className="w-full h-full will-change-transform"
                            style={{ transform: `translateY(${enableParallax ? parallaxOffset : 0}px) translateZ(0)` }}
                        >
                            <SmartImage 
                                src={slides[currentSlide].image} 
                                alt={slides[currentSlide].alt}
                                fill 
                                fallbackType="jewelry" 
                                className="object-cover object-center" 
                                priority={currentSlide === 0}
                            />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/65" />
                    </motion.div>
                </AnimatePresence>

                <div
                    className="absolute inset-0 pointer-events-none will-change-transform"
                    style={{ transform: `translateY(${enableParallax ? Math.round(parallaxOffset * 0.2) : 0}px) translateZ(0)` }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.1),transparent_48%)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />
                </div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 min-h-[100svh] flex items-end">
                <div className="container-custom w-full pb-10 sm:pb-12 md:pb-16 lg:pb-20">
                    <motion.div className="max-w-4xl text-center md:text-left">
                        <div className="inline-flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 rounded-full border border-white/12 bg-white/5 px-3 md:px-4 py-2 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.24em] md:tracking-[0.34em] text-white/75 backdrop-blur-md mb-5 md:mb-6 max-w-full">
                            {heroBadge}
                        </div>

                        <h1 className="text-white text-[34px] sm:text-[42px] md:text-[78px] lg:text-[108px] leading-[0.96] md:leading-[0.92] font-serif uppercase mb-4 md:mb-5 drop-shadow-lg max-w-[11ch] [text-wrap:balance] mx-auto md:mx-0 relative">
                            {headlineLines.map((line, index) => (
                                <motion.span
                                    key={line}
                                    initial={{ opacity: 0, y: isMobile ? 22 : 40, filter: "blur(8px)", scale: 1.02, letterSpacing: "0.14em" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1, letterSpacing: "0.08em" }}
                                    transition={{
                                        duration: prefersReducedMotion ? 0.2 : 1,
                                        delay: prefersReducedMotion ? 0 : 0.22 + index * 0.2,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="block will-change-transform relative"
                                    style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                                >
                                    {line}
                                    {index === 0 && (
                                        <motion.span
                                            className="absolute inset-0 shimmer-gold rounded-sm pointer-events-none"
                                            style={{ opacity: 0.3 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.3 }}
                                            transition={{ delay: 1.2, duration: 0.8 }}
                                        />
                                    )}
                                </motion.span>
                            ))}
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: isMobile ? 14 : 24, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: prefersReducedMotion ? 0.2 : 0.9, delay: prefersReducedMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
                            className="text-white/82 text-[14px] sm:text-[15px] md:text-[18px] lg:text-[19px] max-w-2xl mb-7 md:mb-8 leading-relaxed mx-auto md:mx-0"
                        >
                            {heroSubheadline}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: isMobile ? 12 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: prefersReducedMotion ? 0.2 : 0.85, delay: prefersReducedMotion ? 0 : 0.96, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start"
                        >
                            <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center w-full sm:w-auto px-7 md:px-8 py-3.5 md:py-4 text-[11px] md:text-[13px] uppercase tracking-[0.16em] md:tracking-[0.18em] bg-[#D6B25E] text-[#0B0B0C] font-semibold btn-gold-hover hover:bg-[#E3C67C] shadow-[0_14px_28px_rgba(214,178,94,0.18)] relative group">
                                <span className="relative z-10">Begin Custom Design</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 rounded transition-opacity duration-600" />
                            </Link>
                            <Link href="/shop" className="inline-flex items-center justify-center w-full sm:w-auto px-7 md:px-8 py-3.5 md:py-4 text-[11px] md:text-[13px] uppercase tracking-[0.16em] md:tracking-[0.18em] border border-white/18 text-white font-semibold premium-hover-lift hover:bg-white/8 hover:border-[#D6B25E]/60 hover:shadow-[0_10px_22px_rgba(214,178,94,0.16)] backdrop-blur-sm relative group">
                                <span className="relative z-10">Explore Collection</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 rounded transition-opacity duration-600" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Left/Right Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-white/10 bg-black/20 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-[#D6B25E] hover:border-[#D6B25E]/60 transition-all duration-300 focus:outline-none"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-white/10 bg-black/20 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-[#D6B25E] hover:border-[#D6B25E]/60 transition-all duration-300 focus:outline-none"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Slide Indicators - Hidden on Mobile */}
            <div className="hidden sm:flex absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 gap-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1 rounded-full border-none p-0 m-0 outline-none cursor-pointer transition-all duration-300 ${
                            index === currentSlide ? "w-10 bg-[#D6B25E]" : "w-4 bg-white/35 hover:bg-white/60"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </motion.section>
    );
}
