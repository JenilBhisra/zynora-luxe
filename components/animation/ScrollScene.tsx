"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { SmartImage } from "@/components/SmartImage";
import { VisualEditButton } from "@/components/VisualEditButton";
import gsap from "gsap";
import { createDesktopScrollEngine } from "@/components/animation/GsapScrollEngine";

type TimelineImage = {
    src: string;
    alt: string;
};

type ScrollSceneProps = {
    images: TimelineImage[];
    nextSectionSelector?: string;
    customImages?: Record<string, string>;
    isAdmin?: boolean;
    customText?: Record<string, string>;
};

type TimelineFrame = {
    id: string;
    kicker: string;
    title: string;
    body: string;
    trust: string;
    scarcity?: string;
};

const FRAMES: TimelineFrame[] = [
    {
        id: "intro",
        kicker: "Hero Scene",
        title: "Design Your Signature Ring",
        body: "A guided luxury journey that keeps focus on one meaningful choice at a time.",
        trust: "Premium quality",
    },
    {
        id: "product",
        kicker: "Product Reveal",
        title: "Your statement piece takes shape",
        body: "Every silhouette is balanced for brilliance, comfort, and quiet confidence.",
        trust: "Crafted with precision",
    },
    {
        id: "features",
        kicker: "Feature Highlight",
        title: "Every detail is engineered to captivate",
        body: "Close-up craftsmanship reveals premium finishing and proportion-led design.",
        trust: "Trusted craftsmanship",
    },
    {
        id: "zoom",
        kicker: "Detail Zoom",
        title: "Precision meets emotional design",
        body: "Refined metalwork and stone architecture build desire before action.",
        trust: "Exclusive design",
        scarcity: "Limited collection",
    },
    {
        id: "cta",
        kicker: "Action Scene",
        title: "Own the design that feels uniquely yours",
        body: "Continue to customization or certified diamonds with zero friction and immediate clarity.",
        trust: "Insured delivery and personal support",
    },
];

function SceneText({ frame }: { frame: TimelineFrame }) {
    return (
        <div className="scene-text absolute inset-0 opacity-0 translate-y-4">
            <p className="mb-5 text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E]">{frame.kicker}</p>
            <h2 className="text-[34px] sm:text-[42px] md:text-[56px] leading-[1.02] text-white mb-5">{frame.title}</h2>
            <p className="text-white/72 text-[15px] md:text-[18px] leading-[1.8] max-w-[52ch] mb-6">{frame.body}</p>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#D6B25E]" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/72">{frame.trust}</span>
            </div>
            {frame.scarcity ? <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-[#D6B25E]">{frame.scarcity}</p> : null}
        </div>
    );
}

export function ScrollScene({ images, nextSectionSelector, customImages = {}, isAdmin = false, customText = {} }: ScrollSceneProps) {
    const rootRef = useRef<HTMLElement | null>(null);
    const bgLayerRef = useRef<HTMLDivElement | null>(null);
    const productLayerRef = useRef<HTMLDivElement | null>(null);
    const textLayerRef = useRef<HTMLDivElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Merge DB text overrides into each frame
    const mergedFrames = useMemo(() => {
        return FRAMES.map((frame, idx) => ({
            ...frame,
            kicker: customText[`text:scroll-${idx + 1}-kicker`] || frame.kicker,
            title:  customText[`text:scroll-${idx + 1}-title`]  || frame.title,
            body:   customText[`text:scroll-${idx + 1}-body`]   || frame.body,
        }));
    }, [customText]);

    const timelineImages = useMemo(() => {
        const fallback: TimelineImage = { src: "/products/ring-2.jpg", alt: "Krishna Diamonds ring" };
        const source = images.length ? images : [fallback];
        // Build one image per FRAME, then overlay any DB custom overrides
        return Array.from({ length: FRAMES.length }, (_, idx) => {
            const base = source[idx % source.length] || fallback;
            const customKey = `scroll-scene-${idx + 1}`;
            const customUrl = customImages[customKey];
            return customUrl ? { src: customUrl, alt: base.alt } : base;
        });
    }, [images, customImages]);

    useLayoutEffect(() => {
        if (!rootRef.current) return;

        const media = window.matchMedia("(max-width: 1023px)");
        const syncMobile = () => setIsMobile(media.matches);
        syncMobile();
        media.addEventListener("change", syncMobile);

        const ctx = gsap.context(() => {
            if (media.matches) {
                gsap.utils.toArray<HTMLElement>(".mobile-scene").forEach((scene) => {
                    gsap.fromTo(
                        scene,
                        { autoAlpha: 0, y: 24 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.7,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: scene,
                                start: "top 82%",
                                end: "top 40%",
                                scrub: 0.4,
                            },
                        },
                    );
                });

                return;
            }

            const textScenes = gsap.utils.toArray<HTMLElement>(".scene-text");
            const imageScenes = gsap.utils.toArray<HTMLElement>(".scene-image");
            const nextSection = nextSectionSelector ? document.querySelector<HTMLElement>(nextSectionSelector) : null;

            if (
                textScenes.length &&
                imageScenes.length &&
                bgLayerRef.current &&
                productLayerRef.current &&
                textLayerRef.current
            ) {
                createDesktopScrollEngine({
                    root: rootRef.current as HTMLElement,
                    scenes: textScenes,
                    imageLayers: imageScenes,
                    backgroundLayer: bgLayerRef.current,
                    productLayer: productLayerRef.current,
                    textLayer: textLayerRef.current,
                    nextSection,
                });
            }
        }, rootRef);

        return () => {
            media.removeEventListener("change", syncMobile);
            ctx.revert();
        };
    }, [nextSectionSelector]);

    return (
        <section ref={rootRef} className={`relative bg-[#09090A] ${isMobile ? "py-16" : "min-h-screen"}`}>
            <div className={`${isMobile ? "" : "scroll-section-sticky"} overflow-hidden`}>
                <div
                    ref={bgLayerRef}
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 26%, rgba(214,178,94,0.17) 0%, rgba(214,178,94,0.07) 26%, rgba(9,9,10,0.98) 68%), linear-gradient(180deg, #09090A 0%, #0E0E10 52%, #09090A 100%)",
                    }}
                />

                {!isMobile ? (
                    <div className="container-custom relative z-10 h-screen py-12 md:py-16">
                        <div className="grid h-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                            <div ref={productLayerRef} className="relative order-2 lg:order-1 h-[52vh] sm:h-[58vh] lg:h-[70vh] max-h-[760px] will-change-transform">
                                <div className="absolute inset-0 luxury-shell rounded-[28px] border border-[#D6B25E]/20" />
                                {timelineImages.map((item, index) => (
                                    <div key={`${item.src}-${index}`} className="scene-image absolute inset-2 rounded-[24px] overflow-hidden opacity-0 scale-[0.95] will-change-transform">
                                        <div className="relative h-full w-full">
                                            <SmartImage src={item.src} alt={item.alt} fill fallbackType="jewelry" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/12 to-transparent" />
                                            {/* Admin: edit overlay per scroll scene frame */}
                                            {isAdmin && (
                                                <VisualEditButton
                                                    type="homepage"
                                                    assetKey={`scroll-scene-${index + 1}`}
                                                    className="top-3 left-3"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div ref={textLayerRef} className="order-1 lg:order-2 relative will-change-transform">
                                <div className="w-full max-w-[560px] ml-auto">
                                    <div className="mb-7 flex items-center justify-between">
                                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E]">Scroll Storytelling</span>
                                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-white/55">Scene Flow</span>
                                    </div>

                                    <div className="relative min-h-[312px] sm:min-h-[332px]">
                                        {mergedFrames.map((frame) => (
                                            <SceneText key={frame.id} frame={frame} />
                                        ))}
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                        <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold bg-[#D6B25E] text-[#0B0B0C] btn-gold-hover hover:bg-[#E3C67C] transition-all duration-600 relative group">
                                            <span className="relative z-10">Start Custom Ring</span>
                                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-35 duration-600" />
                                        </Link>
                                        <Link href="/diamonds" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold border border-white/14 text-white premium-hover-lift hover:bg-white/6 hover:border-[#D6B25E]/50 transition-all duration-600 relative group">
                                            <span className="relative z-10">View Certified Diamonds</span>
                                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="container-custom relative z-10 pb-12">
                        {/* Mobile storyline — stacked scene cards */}
                        <div className="space-y-10">
                            {mergedFrames.map((frame, index) => (
                                <div key={frame.id} className="mobile-scene">
                                    {/* Image */}
                                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[18px] luxury-shell border border-[#D6B25E]/20 mb-5">
                                        <SmartImage
                                            src={timelineImages[index]?.src || "/products/ring-2.jpg"}
                                            alt={timelineImages[index]?.alt || frame.title}
                                            fill
                                            fallbackType="jewelry"
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                        {/* Kicker overlaid on image */}
                                        <p className="absolute bottom-3 left-4 text-[9px] uppercase tracking-[0.34em] text-[#D6B25E] font-semibold">{frame.kicker}</p>
                                        {/* Admin: edit overlay per mobile scroll scene frame */}
                                        {isAdmin && (
                                            <VisualEditButton
                                                type="homepage"
                                                assetKey={`scroll-scene-${index + 1}`}
                                                className="top-3 left-3"
                                            />
                                        )}
                                    </div>
                                    {/* Text */}
                                    <h2 className="text-[22px] sm:text-[26px] leading-[1.12] text-white mb-3 font-heading">{frame.title}</h2>
                                    <p className="text-white/65 text-[14px] leading-[1.7] mb-3">{frame.body}</p>
                                    <div className="inline-flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#D6B25E]" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">{frame.trust}</span>
                                    </div>
                                    {/* Separator (except last) */}
                                    {index < mergedFrames.length - 1 && (
                                        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-[#D6B25E]/25 to-transparent" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col gap-3 pt-10">
                            <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-6 py-4 text-[12px] uppercase tracking-[0.18em] font-semibold bg-[#D6B25E] text-[#0B0B0C] transition-all duration-300 relative group rounded-sm">
                                <span className="relative z-10">Start Custom Ring</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-35 duration-600" />
                            </Link>
                            <Link href="/shop" className="inline-flex items-center justify-center px-6 py-4 text-[12px] uppercase tracking-[0.18em] font-semibold border border-white/14 text-white hover:bg-white/6 hover:border-[#D6B25E]/50 transition-all duration-300 relative group rounded-sm">
                                <span className="relative z-10">Explore Collection</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
