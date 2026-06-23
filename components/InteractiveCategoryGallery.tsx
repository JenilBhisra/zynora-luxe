"use client";

import Link from "next/link";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";

const CATEGORIES = [
    {
        id: "engagement-ring",
        title: "Engagement Ring",
        href: "/shop/engagement-ring",
        assetKey: "category-engagement-ring",
        defaultImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pendant",
        title: "Pendant",
        href: "/shop/pendant",
        assetKey: "category-pendant",
        defaultImage: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "bracelet-and-watch",
        title: "Bracelet and Watch",
        href: "/shop/bracelet-and-watch",
        assetKey: "category-bracelet-and-watch",
        defaultImage: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "earrings",
        title: "Earrings",
        href: "/shop/earrings",
        assetKey: "category-earrings",
        defaultImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "necklace",
        title: "Necklace",
        href: "/shop/necklace",
        assetKey: "category-necklace",
        defaultImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"
    }
];

interface InteractiveCategoryGalleryProps {
    customImages?: Record<string, string>;
    isAdmin?: boolean;
}

export function InteractiveCategoryGallery({ customImages = {}, isAdmin = false }: InteractiveCategoryGalleryProps) {
    return (
        <section className="w-full bg-[#FFFFFF] py-24 md:py-32">
            <div className="mx-auto max-w-[1440px] px-6 md:px-12">
                {/* Heading & Subheading */}
                <div className="mb-12 md:mb-16 text-center md:text-left">
                    <h2 className="text-[24px] md:text-[32px] font-serif text-[#1A1A1A] mb-4 font-normal tracking-wide">
                        Shop Jewelry by Category
                     </h2>
                    <p className="text-[#666666] text-[15px] md:text-[17px] font-light max-w-2xl">
                        Thoughtfully designed collections for life's most meaningful moments.
                    </p>
                </div>

                {/* Desktop Category Row: Single horizontal row of 5 categories */}
                <div className="hidden md:grid grid-cols-5 gap-6">
                    {CATEGORIES.map((cat) => {
                        const activeImage = customImages[cat.assetKey] || cat.defaultImage;
                        return (
                            <Link 
                                href={cat.href} 
                                key={cat.id} 
                                className="group block relative"
                            >
                                <div className="relative bg-white rounded-[16px] overflow-hidden border border-[#EAEAEA] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] group-hover:border-[#C9A14A]/40">
                                    {/* Image Container with 4:5 Aspect Ratio */}
                                    <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF8F4]">
                                        <SmartImage 
                                            src={activeImage} 
                                            alt={cat.title} 
                                            fill 
                                            fallbackType="jewelry" 
                                            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                                        />
                                        {/* Subtle gold line hover overlay */}
                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#C9A14A] rounded-[16px] transition-colors duration-500 pointer-events-none" />
                                        
                                        <div className="absolute top-2 left-2 z-20">
                                            <VisualEditButton type="homepage" assetKey={cat.assetKey} />
                                        </div>
                                    </div>
                                </div>
                                {/* Title below image */}
                                <div className="mt-4 text-center">
                                    <h3 className="text-[14px] md:text-[16px] font-medium text-[#1A1A1A] group-hover:text-[#C9A14A] transition-colors duration-300 font-sans tracking-wide">
                                        {cat.title}
                                    </h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile Category Slider: horizontal swipe-scroll */}
                <div className="md:hidden -mx-6 px-6">
                    <div
                        className="overflow-x-auto pb-4"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        <style>{`.cat-slider::-webkit-scrollbar{display:none}`}</style>
                        <div
                            className="cat-slider flex gap-4"
                            style={{ width: "max-content", paddingRight: "24px" }}
                        >
                            {CATEGORIES.map((cat) => {
                                const activeImage = customImages[cat.assetKey] || cat.defaultImage;
                                return (
                                    <Link
                                        href={cat.href}
                                        key={cat.id}
                                        className="group block flex-shrink-0"
                                        style={{ width: "140px" }}
                                    >
                                        <div className="relative bg-white rounded-[12px] overflow-hidden border border-[#EAEAEA] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                            <div className="relative overflow-hidden bg-[#FAF8F4]" style={{ aspectRatio: "4/5" }}>
                                                <SmartImage
                                                    src={activeImage}
                                                    alt={cat.title}
                                                    fill
                                                    fallbackType="jewelry"
                                                    className="object-cover"
                                                />
                                                    <div className="absolute top-2 left-2 z-20">
                                                        <VisualEditButton type="homepage" assetKey={cat.assetKey} />
                                                    </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <h3 className="text-[13px] leading-[1.25] font-medium text-[#1A1A1A] font-sans tracking-wide group-hover:text-[#C9A14A] transition-colors duration-300">
                                                {cat.title}
                                            </h3>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
