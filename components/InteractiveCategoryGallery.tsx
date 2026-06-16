"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const CATEGORIES = [
    {
        id: "rings",
        title: "Rings",
        href: "/shop?category=rings",
        assetKey: "category-rings",
        defaultImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80"
    },
    {
        id: "earrings",
        title: "Earrings",
        href: "/shop?category=earrings",
        assetKey: "category-earrings",
        defaultImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80"
    },
    {
        id: "necklaces",
        title: "Necklaces",
        href: "/shop?category=necklaces",
        assetKey: "category-necklaces",
        defaultImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=80"
    },
    {
        id: "diamonds",
        title: "Diamonds",
        href: "/diamonds",
        assetKey: "category-diamonds",
        defaultImage: "/products/loose-diamond.jpg"
    }
];

interface InteractiveCategoryGalleryProps {
    customImages?: Record<string, string>;
    isAdmin?: boolean;
}

export function InteractiveCategoryGallery({ customImages = {}, isAdmin = false }: InteractiveCategoryGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // latest goes from 0 to 1 over the full height of the container
        // Total scrollable distance is based on (CATEGORIES.length - 1) * 100vh
        const scrollPosition = latest * (CATEGORIES.length - 1);
        const current = Math.round(scrollPosition);
        setActiveIndex(current);
    });

    return (
        <section className="relative w-full bg-[#0B0B0C] text-white" ref={containerRef}>
            <div className="flex flex-col md:flex-row w-full relative">
                
                {/* Left Column: Sticky Navigation */}
                <div className="hidden md:flex w-1/3 sticky top-16 md:top-20 h-[calc(100svh-4rem)] md:h-[calc(100svh-5rem)] flex-col justify-center pl-10 lg:pl-20 py-20 z-10">
                    <div className="flex flex-col -space-y-2">
                        {CATEGORIES.map((cat, index) => (
                            <motion.div 
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ 
                                    opacity: index <= activeIndex ? 1 : 0,
                                    y: index <= activeIndex ? 0 : 20
                                }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <Link 
                                    href={cat.href}
                                    className="font-serif font-light tracking-wide text-[52px] lg:text-[84px] leading-none text-white transition-all duration-500 ease-out inline-block hover:opacity-70"
                                    style={{
                                        pointerEvents: index <= activeIndex ? "auto" : "none"
                                    }}
                                >
                                    {cat.title}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Stacking/Parallax Images */}
                <div className="w-full md:w-2/3">
                    {CATEGORIES.map((cat, index) => {
                        const activeImage = customImages[cat.assetKey] || cat.defaultImage;
                        return (
                            <div 
                                key={`img-${cat.id}`}
                                className="w-full sticky overflow-hidden"
                                style={{ 
                                    zIndex: index,
                                    top: `${index * 72}px`,
                                    height: `calc(100svh - ${index * 72}px)`
                                }}
                            >
                                {/* Mobile Title overlay since left nav is hidden */}
                                <div className="md:hidden absolute z-20 inset-0 flex items-center justify-center pointer-events-none">
                                    <h2 className="text-white text-[44px] font-serif drop-shadow-lg">{cat.title}</h2>
                                </div>

                                {/* Admin visual edit button overlay */}
                                {isAdmin && (
                                    <div className="absolute top-4 left-4 z-30">
                                        <VisualEditButton type="homepage" assetKey={cat.assetKey} />
                                    </div>
                                )}

                                <Link href={cat.href} className="block w-full h-full cursor-pointer relative group">
                                    <SmartImage 
                                        src={activeImage} 
                                        alt={cat.title} 
                                        fill 
                                        fallbackType="jewelry" 
                                        className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                                    />
                                    {/* Dark overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10 z-10" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700 ease-out z-10" />
                                    
                                    {/* Premium "Shop [Category]" text overlay */}
                                    <div className="absolute z-20 inset-0 flex items-end justify-between pointer-events-none p-6 md:p-10">
                                        <div className="overflow-hidden max-w-xl">
                                            <span className="block font-serif font-light text-[40px] lg:text-[64px] text-white tracking-widest opacity-100 translate-y-0 transition-all duration-700 ease-out drop-shadow-xl">
                                                {cat.title}
                                            </span>
                                            <span className="block mt-3 text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-white/70">
                                                Explore the collection
                                            </span>
                                        </div>
                                        <span className="hidden md:inline-flex items-center justify-center h-12 px-5 border border-white/18 bg-white/5 text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm transition-colors duration-500 group-hover:bg-white/10">
                                            View
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

