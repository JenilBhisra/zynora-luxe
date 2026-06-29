"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FadeIn } from "@/components/FadeIn";
import { VisualEditButton } from "@/components/VisualEditButton";
import { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";

const AdminStudio = nextDynamic(() => import("@/components/AdminStudio").then(mod => mod.AdminStudio), { ssr: false });

interface ShopCategoryItem {
    name: string;
    slug: string;
    fallback: string;
    imageUrl: string;
}

export default function ShopClient({ initialCategories }: { initialCategories: ShopCategoryItem[] }) {
    const [fetchedAssets, setFetchedAssets] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const res = await fetch("/api/admin/homepage");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.assets) {
                        setFetchedAssets(data.assets);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch category overrides dynamically:", err);
            }
        };
        loadAssets();
    }, []);

    // Listen for real-time asset updates from AdminStudio
    useEffect(() => {
        const handleAssetSaved = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.key) {
                setFetchedAssets(prev => ({
                    ...prev,
                    [customEvent.detail.key]: customEvent.detail.url
                }));
            }
        };
        window.addEventListener("zynora-asset-saved", handleAssetSaved);
        return () => window.removeEventListener("zynora-asset-saved", handleAssetSaved);
    }, []);

    return (
        <div className="min-h-screen pb-24 bg-white text-zinc-900">
            <AnimatedSection className="pt-20 pb-8 md:pt-24 md:pb-12 bg-[#FAF8F4] border-b border-zinc-100">
                <div className="container-custom">
                    <div className="max-w-[720px] text-center mx-auto">
                        <span className="text-[9px] md:text-[10px] tracking-[0.34em] font-medium text-[#C9A14A] uppercase mb-3 block">Collections</span>
                        <h1 className="mb-3 text-[24px] md:text-[32px] text-zinc-900 font-serif font-normal">Discover the Signatures</h1>
                        <p className="text-zinc-500 font-normal text-[13px] md:text-[14px] leading-relaxed">
                            Explore our meticulously curated categories, featuring unparalleled craftsmanship and ethically sourced diamonds.
                        </p>
                    </div>
                </div>
            </AnimatedSection>

            <div className="container-custom pt-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {initialCategories.map((cat, i) => {
                        const assetKey = `category-${cat.slug}`;
                        // Use customized asset URL if configured, otherwise fallback to product or default fallback
                        const activeImage = fetchedAssets[assetKey] || cat.imageUrl;

                        return (
                            <FadeIn key={cat.slug} delay={i * 0.1}>
                                <div className="relative group/card">
                                    <Link href={`/shop/${cat.slug}`} className="block group relative luxury-shell overflow-hidden rounded-[24px] aspect-[4/5] md:aspect-square lg:aspect-[4/5] premium-hover-lift">
                                        <SmartImage 
                                            src={activeImage} 
                                            alt={cat.name} 
                                            fill 
                                            sizeType="thumbnail"
                                            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.08] filter group-hover:brightness-110" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-700 opacity-90 group-hover:opacity-100" />
                                        
                                        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-center text-center">
                                            <h3 className="text-3xl md:text-4xl font-heading !text-[#FFF8EA] mb-3 group-hover:!text-[#C9A14A] transition-colors duration-500" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>{cat.name}</h3>
                                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold !text-[#D6B45A] group-hover:!text-white transition-colors flex items-center gap-2" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>
                                                Explore <span className="text-[#C9A14A]">→</span>
                                            </span>
                                        </div>
                                    </Link>
                                    <div className="absolute top-4 left-4 z-30">
                                        <VisualEditButton type="homepage" assetKey={assetKey} />
                                    </div>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>

            <AdminStudio />
        </div>
    );
}
