"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { SmartImage } from "@/components/SmartImage";

type TimelineImage = {
    src: string;
    alt: string;
};

type Frame = {
    id: string;
    kicker: string;
    title: string;
    body: string;
    trust: string;
    urgency?: string;
};

type ScrollTimelineExperienceProps = {
    images: TimelineImage[];
};

const FRAMES: Frame[] = [
    {
        id: "intro",
        kicker: "Private Journey",
        title: "A ring should feel chosen, not rushed",
        body: "Move at your pace through an elegant, guided experience designed for confidence.",
        trust: "Crafted with certified standards",
        urgency: "Limited seasonal collection",
    },
    {
        id: "product",
        kicker: "Step 01",
        title: "Your signature piece appears",
        body: "Each silhouette is balanced for brilliance, comfort, and long-term wear.",
        trust: "Hand-finished by specialist artisans",
    },
    {
        id: "detail",
        kicker: "Step 02",
        title: "Every detail reveals intention",
        body: "Inspect proportions, stone placement, and polish like an in-store consultation.",
        trust: "GIA and IGI aligned sourcing",
    },
    {
        id: "highlight",
        kicker: "Step 03",
        title: "Craftsmanship becomes the focus",
        body: "Premium metals, precision setting, and enduring structure in one refined design.",
        trust: "Insured delivery and personal assistance",
        urgency: "Exclusive design release",
    },
    {
        id: "cta",
        kicker: "Final Step",
        title: "Begin your custom ring today",
        body: "You are one step away from a private jewelry experience built around your preferences.",
        trust: "Trusted by discerning luxury buyers",
    },
];

function clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
}

function blendVisibility(progress: number, index: number, total: number) {
    if (total <= 1) {
        return 1;
    }

    const center = index / (total - 1);
    const span = 1 / (total - 1);
    const distance = Math.abs(progress - center);
    return clamp01(1 - distance / (span * 0.78));
}

export function ScrollTimelineExperience({ images }: ScrollTimelineExperienceProps) {
    const sectionRef = useRef<HTMLElement | null>(null);
    const prefersReducedMotion = useReducedMotion();
    const [progress, setProgress] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);

    const timelineImages = useMemo(() => {
        const fallback: TimelineImage = { src: "/products/ring-2.jpg", alt: "Krishna Diamonds ring" };
        const source = images.length ? images : [fallback];
        return Array.from({ length: FRAMES.length }, (_, idx) => source[idx % source.length] || fallback);
    }, [images]);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 140,
        damping: 30,
        mass: 0.25,
    });

    useMotionValueEvent(smoothProgress, "change", (value) => {
        const nextProgress = clamp01(value);
        setProgress(nextProgress);

        const nextIndex = Math.min(FRAMES.length - 1, Math.floor(nextProgress * FRAMES.length));
        setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    });

    const bgTranslate = prefersReducedMotion ? 0 : (progress - 0.5) * -36;
    const productTranslate = prefersReducedMotion ? 0 : (progress - 0.5) * -64;
    const productScale = prefersReducedMotion ? 1 : 0.9 + progress * 0.15;
    const textTranslate = prefersReducedMotion ? 0 : (progress - 0.5) * -88;

    return (
        <section ref={sectionRef} className="relative h-[260vh] bg-[#09090A]">
            <div className="scroll-section-sticky overflow-hidden">
                <motion.div
                    className="absolute inset-0"
                    style={{
                        y: bgTranslate,
                        background:
                            "radial-gradient(circle at 50% 28%, rgba(214,178,94,0.18) 0%, rgba(214,178,94,0.06) 25%, rgba(9,9,10,0.98) 68%), linear-gradient(180deg, #09090A 0%, #0E0E10 52%, #09090A 100%)",
                    }}
                />

                <div className="container-custom relative z-10 h-screen py-12 md:py-16">
                    <div className="grid h-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                        <motion.div
                            className="relative order-2 lg:order-1 h-[52vh] sm:h-[58vh] lg:h-[70vh] max-h-[760px]"
                            style={{ y: productTranslate, scale: productScale }}
                        >
                            <div className="absolute inset-0 luxury-shell rounded-[28px] border border-[#D6B25E]/20" />
                            {timelineImages.map((item, index) => {
                                const visibility = blendVisibility(progress, index, timelineImages.length);
                                const scale = 0.96 + visibility * 0.05;

                                return (
                                    <motion.div
                                        key={`${item.src}-${index}`}
                                        className="absolute inset-2 rounded-[24px] overflow-hidden"
                                        style={{ opacity: visibility, scale }}
                                    >
                                        <div className="relative h-full w-full">
                                            <SmartImage
                                                src={item.src}
                                                alt={item.alt}
                                                fill
                                                fallbackType="jewelry"
                                                className="object-cover"
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        <motion.div className="order-1 lg:order-2 relative" style={{ y: textTranslate }}>
                            <div className="w-full max-w-[560px] ml-auto">
                                <div className="mb-7 flex items-center justify-between">
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E]">Scroll Timeline</span>
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-white/55">
                                        {Math.round(progress * 100)}%
                                    </span>
                                </div>

                                <div className="relative min-h-[300px] sm:min-h-[320px]">
                                    {FRAMES.map((frame, index) => {
                                        const visibility = blendVisibility(progress, index, FRAMES.length);
                                        return (
                                            <motion.div
                                                key={frame.id}
                                                className="absolute inset-0"
                                                style={{
                                                    opacity: visibility,
                                                    y: (1 - visibility) * 20,
                                                    pointerEvents: visibility > 0.55 ? "auto" : "none",
                                                }}
                                            >
                                                <p className="mb-5 text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E]">
                                                    {frame.kicker}
                                                </p>
                                                <h2 className="text-[34px] sm:text-[42px] md:text-[56px] leading-[1.02] text-white mb-5">
                                                    {frame.title}
                                                </h2>
                                                <p className="text-white/72 text-[15px] md:text-[18px] leading-[1.8] max-w-[52ch] mb-6">
                                                    {frame.body}
                                                </p>
                                                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                                                    <span className="h-2 w-2 rounded-full bg-[#D6B25E]" />
                                                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/72">{frame.trust}</span>
                                                </div>
                                                {frame.urgency ? (
                                                    <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-[#D6B25E]">{frame.urgency}</p>
                                                ) : null}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 h-[2px] rounded bg-white/10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gold-gradient"
                                        style={{ width: `${Math.max(4, progress * 100)}%` }}
                                    />
                                </div>

                                <motion.div
                                    className="mt-8 flex flex-col sm:flex-row gap-4"
                                    style={{ opacity: activeIndex >= FRAMES.length - 1 ? 1 : 0.45 }}
                                >
                                    <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold bg-[#D6B25E] text-[#0B0B0C] btn-gold-hover hover:bg-[#E3C67C] transition-all duration-600 relative group">
                                        <span className="relative z-10">Start Custom Ring</span>
                                        <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-35 duration-600" />
                                    </Link>
                                    <Link href="/diamonds" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold border border-white/14 text-white premium-hover-lift hover:bg-white/6 hover:border-[#D6B25E]/50 transition-all duration-600 relative group">
                                        <span className="relative z-10">View Certified Diamonds</span>
                                        <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
