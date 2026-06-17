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
            <p className="mb-3 sm:mb-5 text-[9px] sm:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] font-semibold">{frame.kicker}</p>
            <h2 className="text-[22px] xs:text-[28px] sm:text-[42px] md:text-[56px] leading-[1.02] text-[#1A1A1A] mb-3 sm:mb-5 font-heading font-semibold">{frame.title}</h2>
            <p className="text-[#666666] text-[13px] sm:text-[15px] md:text-[18px] leading-[1.6] sm:leading-[1.8] max-w-[52ch] mb-4 sm:mb-6">{frame.body}</p>
            <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-[#EAEAEA] bg-[#EAF5FF] px-3 py-1.5 sm:px-4 sm:py-2">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#C9A14A]" />
                <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-[#1A1A1A]">{frame.trust}</span>
            </div>
            {frame.scarcity ? <p className="mt-4 sm:mt-5 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C9A14A]">{frame.scarcity}</p> : null}
        </div>
    );
}

export function ScrollScene({ images, nextSectionSelector, customImages = {}, isAdmin = false, customText = {} }: ScrollSceneProps) {
    const rootRef = useRef<HTMLElement | null>(null);
    const bgLayerRef = useRef<HTMLDivElement | null>(null);
    const productLayerRef = useRef<HTMLDivElement | null>(null);
    const textLayerRef = useRef<HTMLDivElement | null>(null);

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

        const ctx = gsap.context(() => {
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
                    isMobile: media.matches,
                });
            }
        }, rootRef);

        return () => {
            ctx.revert();
        };
    }, [nextSectionSelector]);

    return (
        <section ref={rootRef} className="relative bg-white min-h-screen">
            <div className="scroll-section-sticky overflow-hidden">
                <div
                    ref={bgLayerRef}
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 26%, rgba(201,161,74,0.08) 0%, rgba(201,161,74,0.03) 26%, rgba(234,245,255,0.8) 68%), linear-gradient(180deg, #EAF5FF 0%, #FFFFFF 52%, #EAF5FF 100%)",
                    }}
                />

                <div className="container-custom relative z-10 h-screen py-6 lg:py-16 flex flex-col justify-center">
                    <div className="grid h-full max-h-[90vh] items-center gap-6 lg:gap-10 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                        {/* Image Panel */}
                        <div ref={productLayerRef} className="relative order-1 lg:order-1 h-[35vh] sm:h-[45vh] lg:h-[70vh] max-h-[760px] will-change-transform w-full">
                            <div className="absolute inset-0 luxury-shell rounded-[20px] lg:rounded-[28px] border border-[#C9A14A]/20" />
                            {timelineImages.map((item, index) => (
                                <div key={`${item.src}-${index}`} className="scene-image absolute inset-1.5 lg:inset-2 rounded-[16px] lg:rounded-[24px] overflow-hidden opacity-0 scale-[0.95] will-change-transform">
                                    <div className="relative h-full w-full">
                                        <SmartImage src={item.src} alt={item.alt} fill fallbackType="jewelry" className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
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

                        {/* Text Panel */}
                        <div ref={textLayerRef} className="order-2 lg:order-2 relative will-change-transform">
                            <div className="w-full max-w-[560px] mx-auto lg:ml-auto">
                                <div className="mb-4 sm:mb-7 flex items-center justify-between">
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A]">Scroll Storytelling</span>
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#666666]">Scene Flow</span>
                                </div>

                                <div className="relative min-h-[220px] sm:min-h-[312px] lg:min-h-[332px]">
                                    {mergedFrames.map((frame) => (
                                        <SceneText key={frame.id} frame={frame} />
                                    ))}
                                </div>

                                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 text-[11.5px] sm:text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold bg-[#C9A14A] text-white btn-gold-hover hover:bg-[#B58F3B] transition-all duration-600 relative group text-center rounded-sm">
                                        <span className="relative z-10 text-white-force">Start Custom Ring</span>
                                        <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-35 duration-600" />
                                    </Link>
                                    <Link href="/diamonds" className="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 text-[11.5px] sm:text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-600 relative group text-center rounded-sm">
                                        <span className="relative z-10">View Certified Diamonds</span>
                                        <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
