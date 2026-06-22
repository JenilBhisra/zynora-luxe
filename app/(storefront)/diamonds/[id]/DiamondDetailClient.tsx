/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Box, ArrowLeft, Check, ShoppingBag, ShieldCheck, Truck, Award, HelpCircle, Eye, Sparkles } from "lucide-react";
import { useCustomizerStore } from "@/lib/customizer-store";
import { useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { SmartImage } from "@/components/SmartImage";
import { selectCardImage } from "@/lib/image-utils";
import { CustomizerProgressBar } from "@/components/CustomizerProgressBar";
import {
    ZYNORA_FAQ,
    ZYNORA_WARRANTY,
    ZYNORA_SHIPPING,
    ZYNORA_CERTIFICATION,
    ZYNORA_SUSTAINABILITY,
    ZYNORA_SIZE_GUIDE,
    ZYNORA_EDUCATION
} from "@/lib/detail-content";

const ModelCanvas = dynamic(() => import("@/app/(storefront)/setting/[id]/ModelViewer3D"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#C9A14A]/30 border-t-[#C9A14A] animate-spin" />
                <p className="text-[#C9A14A] text-[9px] uppercase tracking-[0.25em] font-semibold">Loading 3D Model…</p>
            </div>
        </div>
    ),
});

const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

export default function DiamondDetailClient({ diamond }: { diamond: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const isCustomizerMode = mode === "customizer";

    const setDiamond = useCustomizerStore((s) => s.setDiamond);
    const selectedDiamond = useCustomizerStore((s) => s.config.diamond);
    const isSelected = selectedDiamond?.id === diamond.id;

    const { addToCart } = useCart();

    const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);
    const normalBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowStickyBottomBar(!entry.isIntersecting);
            },
            { threshold: 0.05 }
        );
        if (normalBtnRef.current) {
            observer.observe(normalBtnRef.current);
        }
        return () => observer.disconnect();
    }, []);

    const usedImages = new Set<string>();
    const imageSrc = selectCardImage(
        diamond.imageUrl || "", 
        usedImages, 
        "diamond", 
        0, 
        diamond.id, 
        `${diamond.shape}-${diamond.caratWeight}`
    );

    const modelUrl: string | null = diamond.modelUrl || null;

    type MediaItem =
        | { type: "photo"; src: string }
        | { type: "3d" };

    const mediaItems: MediaItem[] = useMemo(() => {
        const items: MediaItem[] = [];
        if (modelUrl || diamond.shape) items.push({ type: "3d" });
        items.push({ type: "photo", src: imageSrc });
        return items;
    }, [imageSrc, modelUrl, diamond.shape]);

    const [activeIdx, setActiveIdx] = useState(0);
    const activeItem = mediaItems[activeIdx] ?? null;

    const prev = useCallback(() => setActiveIdx(i => (i - 1 + mediaItems.length) % mediaItems.length), [mediaItems.length]);
    const next = useCallback(() => setActiveIdx(i => (i + 1) % mediaItems.length), [mediaItems.length]);

    // Accordion active sections below fold
    const [openAccordion, setOpenAccordion] = useState<string | null>("specs");

    const toggleAccordion = (sec: string) => {
        setOpenAccordion(openAccordion === sec ? null : sec);
    };

    const handleAction = () => {
        if (isCustomizerMode) {
            setDiamond(diamond);
            router.push("/customizer/step-2-setting");
        } else {
            addToCart({
                id: diamond.id,
                name: `${diamond.caratWeight} Carat ${diamond.shape} Diamond`,
                price: diamond.price,
                image: imageSrc,
                quantity: 1,
            });
            toast.success("Diamond added to cart!");
            const btn = document.querySelector('[data-cart-drawer-trigger]') as HTMLButtonElement;
            if (btn) btn.click();
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-32 bg-white text-zinc-900 font-sans">
            
            {/* ── Top nav ──────────────────────────────────────── */}
            <div className="border-b border-zinc-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
                    <Link
                        href={isCustomizerMode ? "/customizer/step-1-diamond" : "/diamonds"}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#C9A14A] text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
                    >
                        <ArrowLeft size={13} />
                        {isCustomizerMode ? "All Diamonds" : "Back to Search"}
                    </Link>
                    {/* Breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                        <span>{isCustomizerMode ? "Customizer" : "Shop"}</span>
                        <ChevronRight size={10} className="text-zinc-300" />
                        <span>Diamond</span>
                        <ChevronRight size={10} className="text-zinc-300" />
                        <span className="text-[#C9A14A] font-bold">{diamond.caratWeight} Carat {diamond.shape}</span>
                    </div>
                    {/* Zynora branding / space balance */}
                    <span className="text-xs font-serif italic tracking-[0.2em] text-[#C9A14A] font-bold">Zynora Luxe</span>
                </div>
            </div>

            {/* Customizer Progress Bar at the top (if in customizer mode) */}
            {isCustomizerMode && <CustomizerProgressBar currentStep={1} />}

            {/* ── Main Detail Content Grid ───────────────────── */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {/* Left: Gallery (Brilliant Earth 2-column Grid / Mobile viewport + thumbs) */}
                    <div className="w-full lg:w-[68%] flex flex-col gap-4">
                        {/* Desktop Grid Layout */}
                        <div className="hidden md:grid grid-cols-2 gap-4 w-full">
                            {mediaItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`relative aspect-[4/5] w-full overflow-hidden flex items-center justify-center p-2 group ${
                                        mediaItems.length === 1 || (mediaItems.length % 2 !== 0 && idx === 0) ? "md:col-span-2" : ""
                                    }`}
                                >
                                    {item.type === "photo" && (
                                        <SmartImage
                                            src={(item as any).src}
                                            alt={`${diamond.shape} Diamond`}
                                            fill
                                            fallbackType="diamond"
                                            imageKey={`grid-${diamond.id}-${idx}`}
                                            className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                        />
                                    )}
                                    {item.type === "3d" && (
                                        <div className="relative w-full h-full">
                                            <ModelCanvas url={diamond.modelUrl} shape={diamond.shape} />
                                            <p className="absolute bottom-3 left-3 right-3 text-center text-[8px] text-zinc-400 uppercase tracking-widest pointer-events-none">
                                                Drag to rotate · Scroll to zoom
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mobile Viewport + Thumbs selection */}
                        <div className="block md:hidden w-full">
                            <div className="relative aspect-[4/5] w-full overflow-hidden flex items-center justify-center p-2 rounded-none">
                                {mediaItems.length > 0 ? (
                                    mediaItems[activeIdx]?.type === "photo" ? (
                                        <SmartImage
                                            src={(mediaItems[activeIdx] as any).src}
                                            alt={`${diamond.shape} Diamond`}
                                            fill
                                            fallbackType="diamond"
                                            imageKey={`mobile-main-${diamond.id}`}
                                            className="object-contain p-4"
                                        />
                                    ) : mediaItems[activeIdx]?.type === "3d" ? (
                                        <div className="relative w-full h-full">
                                            <ModelCanvas url={diamond.modelUrl} shape={diamond.shape} />
                                            <p className="absolute bottom-3 left-3 right-3 text-center text-[8px] text-zinc-400 uppercase tracking-widest pointer-events-none">
                                                Drag to rotate · Scroll to zoom
                                            </p>
                                        </div>
                                    ) : null
                                ) : (
                                    <div className="text-zinc-300 text-xs uppercase tracking-widest">No Media</div>
                                )}
                            </div>

                            {/* Mobile thumbnails scroll bar */}
                            {mediaItems.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto py-3 px-1 mt-2 scrollbar-none">
                                    {mediaItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIdx(idx)}
                                            className={`relative w-16 h-12 flex-shrink-0 bg-[#FAF8F4] overflow-hidden border transition-all ${
                                                activeIdx === idx
                                                    ? "border-[#C9A14A] ring-1 ring-[#C9A14A]/25"
                                                    : "border-zinc-200"
                                            } rounded-none`}
                                        >
                                            {item.type === "photo" ? (
                                                <SmartImage
                                                    src={(item as any).src}
                                                    alt={`Thumbnail ${idx}`}
                                                    fill
                                                    fallbackType="diamond"
                                                    imageKey={`mobile-thumb-${diamond.id}-${idx}`}
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[9px] text-zinc-500 font-bold uppercase">
                                                    3D
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Details Panel */}
                    <div className="w-full lg:w-[32%] flex flex-col gap-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A14A] mb-1">
                                <Sparkles size={11} /> Conflict-Free Certified
                            </p>
                            <h1 className="text-[22px] md:text-3xl font-serif font-medium text-zinc-900 tracking-wide mb-1.5">
                                {diamond.caratWeight.toFixed(2)} Carat {diamond.shape} Diamond
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide">
                                Cut: {diamond.cut} · Color: {diamond.color} · Clarity: {diamond.clarity}
                            </p>
                        </div>

                        <div className="py-4 border-t border-b border-zinc-100">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[18px] md:text-2xl font-medium text-zinc-900 tracking-tight">{fmt(diamond.price)}</span>
                                <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">(Includes GST)</span>
                            </div>
                            <p className="text-[10px] text-[#C9A14A] mt-1.5 font-medium">✓ Secure luxury shipping included</p>
                        </div>

                        {/* Stock status indicator */}
                        {diamond.stockStatus === "SOLD" && (
                            <div className="p-4 rounded-none md:rounded-[4px] bg-red-50 border border-red-100 text-center">
                                <span className="text-red-700 font-bold uppercase tracking-widest text-xs">DIAMOND SOLD OUT</span>
                                <p className="text-[10px] text-red-500 mt-1">This specific stone is no longer available. Contact our concierge to find a similar certified diamond.</p>
                            </div>
                        )}

                        {/* Main Call to Action Button */}
                        <div ref={normalBtnRef}>
                            <button
                                onClick={handleAction}
                                disabled={diamond.stockStatus === "SOLD"}
                                className={`w-full py-4 text-[13px] md:text-[14px] font-bold uppercase tracking-[0.2em] rounded-none md:rounded-[4px] transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
                                    diamond.stockStatus === "SOLD"
                                        ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                        : isSelected && isCustomizerMode
                                        ? "bg-zinc-900 text-white border-zinc-900 hover:bg-[#C9A14A] hover:border-[#C9A14A] hover:-translate-y-0.5 active:translate-y-0"
                                        : "bg-[#C9A14A] text-white border-[#C9A14A] hover:bg-black hover:border-black hover:-translate-y-0.5 active:translate-y-0"
                                }`}
                            >
                                {diamond.stockStatus === "SOLD" ? (
                                    "Unavailable"
                                ) : isCustomizerMode ? (
                                    <>
                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                        {isSelected ? "Selected — Next: Choose Setting" : "Choose Center Stone"}
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag size={14} />
                                        Add to Cart
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Value highlights */}
                        <div className="grid grid-cols-3 gap-2 py-2 text-center border-t border-b border-zinc-100">
                            <div className="flex flex-col items-center p-2">
                                <Truck size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">Free Insured</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Overnight Delivery</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <ShieldCheck size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">30-Day</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Easy Returns</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <Award size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">Lifetime</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Craft Warranty</span>
                            </div>
                        </div>

                        {/* Specs overview list */}
                        <div className="flex flex-col gap-3.5 bg-zinc-50 p-5 rounded-none md:rounded-[4px] border border-zinc-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200/60 pb-2">Diamond Details</h3>
                            <div className="grid grid-cols-2 gap-y-3 text-xs">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-medium">Stock Code</span>
                                    <span className="font-semibold text-zinc-800 mt-0.5">{diamond.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-medium">Grading Report</span>
                                    <span className="font-semibold text-[#C9A14A] underline mt-0.5 flex items-center gap-1 cursor-pointer">
                                        {diamond.certification} <Award size={10} />
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-medium">Carat Weight</span>
                                    <span className="font-semibold text-zinc-800 mt-0.5">{diamond.caratWeight.toFixed(2)} Carats</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-medium">Shape / Cut</span>
                                    <span className="font-semibold text-zinc-800 mt-0.5">{diamond.shape} / {diamond.cut}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Below Fold Content Sections ───────────────── */}
                <div className="mt-16 lg:mt-24 max-w-4xl border-t border-zinc-100 pt-10 lg:pt-12">
                    <h2 className="text-lg md:text-xl font-serif text-zinc-900 tracking-wide mb-6 font-medium">Premium Diamond Specifications &amp; Assurances</h2>

                    <div className="flex flex-col border-0 md:border border-zinc-100 rounded-none md:rounded-[4px] overflow-hidden bg-white shadow-none md:shadow-sm">
                        
                        {/* Section 1: Detailed Specifications Table */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("specs")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Award size={15} className="text-[#C9A14A]" /> Complete Diamond Specifications
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "specs" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "specs" && (
                                <div className="p-6 bg-zinc-50/50 transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {[
                                            { label: "Carat Weight", val: `${diamond.caratWeight.toFixed(2)} Carat` },
                                            { label: "Shape", val: diamond.shape },
                                            { label: "Color Grade", val: diamond.color },
                                            { label: "Clarity Grade", val: diamond.clarity },
                                            { label: "Cut Grade", val: diamond.cut },
                                            { label: "Lab Certification", val: diamond.certification },
                                            { label: "Measurements", val: `${(diamond.caratWeight * 5.2).toFixed(1)} x ${(diamond.caratWeight * 4.8).toFixed(1)} x ${(diamond.caratWeight * 3.1).toFixed(1)} mm` },
                                            { label: "Conflict Free", val: "Guaranteed Ethical Sourcing" },
                                            { label: "Origin", val: "Conflict-Free Natural / Lab-Grown Sourced" },
                                            { label: "Clarity Characteristics", val: "Crystal, Feather, Pinpoint" },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex justify-between py-2 border-b border-zinc-200/50 text-xs">
                                                <span className="text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">{item.label}</span>
                                                <span className="font-semibold text-zinc-800">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Carat Size Visual comparison */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("size")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Eye size={15} className="text-[#C9A14A]" /> Carat Size Comparison Guide
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "size" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "size" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 space-y-4">
                                    <p className="text-xs leading-relaxed">
                                        Understanding how diamond carat weights correspond to visual size on a finger is essential. Here is a visual reference for round cut diamonds:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                        {ZYNORA_SIZE_GUIDE.carats.map((c, idx) => (
                                            <div key={idx} className="flex flex-col items-center bg-white p-3 rounded-none md:rounded-[4px] border border-zinc-100 text-center">
                                                <div className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center font-bold text-[10px] text-zinc-800 mb-2">
                                                    {c.size.split(" ")[0]}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-800 tracking-wider">{c.size}</span>
                                                <span className="text-[9px] text-zinc-400 mt-0.5">{c.mm}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-[#FAF8F4] p-4 rounded-none md:rounded-[4px] border border-[#C9A14A]/10 mt-4">
                                        <p className="text-[10px] uppercase font-bold text-[#C9A14A] tracking-widest mb-1.5">Expert Tips:</p>
                                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-500">
                                            {ZYNORA_SIZE_GUIDE.tips.map((tip, idx) => (
                                                <li key={idx}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Certification & Trust */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("cert")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Award size={15} className="text-[#C9A14A]" /> {ZYNORA_CERTIFICATION.title}
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "cert" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "cert" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 text-xs leading-relaxed space-y-3">
                                    <p>{ZYNORA_CERTIFICATION.description}</p>
                                    <p className="font-bold text-[#C9A14A]">{ZYNORA_CERTIFICATION.guarantee}</p>
                                </div>
                            )}
                        </div>

                        {/* Section 4: Lifetime Warranty */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("warranty")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <ShieldCheck size={15} className="text-[#C9A14A]" /> {ZYNORA_WARRANTY.title}
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "warranty" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "warranty" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 text-xs leading-relaxed space-y-4">
                                    <p>{ZYNORA_WARRANTY.description}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {ZYNORA_WARRANTY.highlights.map((h, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-zinc-500">
                                                <span className="text-[#C9A14A] font-bold">✓</span> {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 5: Shipping & Returns */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("shipping")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Truck size={15} className="text-[#C9A14A]" /> {ZYNORA_SHIPPING.title}
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "shipping" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "shipping" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 text-xs leading-relaxed space-y-3">
                                    <p>{ZYNORA_SHIPPING.description}</p>
                                    <p className="font-bold text-zinc-800">{ZYNORA_SHIPPING.returns}</p>
                                </div>
                            )}
                        </div>

                        {/* Section 6: Sustainability */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("eco")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Sparkles size={15} className="text-[#C9A14A]" /> {ZYNORA_SUSTAINABILITY.title}
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "eco" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "eco" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 text-xs leading-relaxed space-y-3">
                                    <p>{ZYNORA_SUSTAINABILITY.description}</p>
                                    <p className="font-semibold text-zinc-500 italic">{ZYNORA_SUSTAINABILITY.carbonNeutral}</p>
                                </div>
                            )}
                        </div>

                        {/* Section 7: FAQs */}
                        <div>
                            <button
                                onClick={() => toggleAccordion("faq")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <HelpCircle size={15} className="text-[#C9A14A]" /> Frequently Asked Questions
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "faq" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "faq" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 space-y-5">
                                    {ZYNORA_FAQ.map((faq, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <h4 className="font-bold text-zinc-800 text-xs tracking-wide">Q: {faq.question}</h4>
                                            <p className="text-zinc-500 text-xs leading-relaxed pl-3 border-l-2 border-zinc-200">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Related Education Content ───────────────── */}
                <div className="mt-16 lg:mt-24 border-t border-zinc-100 pt-10 lg:pt-12">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C9A14A] block mb-1.5">Education Guides</span>
                    <h2 className="text-lg md:text-xl font-serif text-zinc-900 tracking-wide mb-6 font-medium">Zynora Luxe Diamond Education</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ZYNORA_EDUCATION.map((edu, idx) => (
                            <Link key={idx} href={edu.link} className="group bg-zinc-50 p-6 rounded-none md:rounded-[4px] border border-zinc-100 flex flex-col justify-between hover:bg-white hover:border-[#C9A14A]/25 transition-all duration-300">
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-[#C9A14A] font-bold block mb-2">{edu.readTime}</span>
                                    <h3 className="font-bold text-sm text-zinc-800 group-hover:text-[#C9A14A] transition-colors mb-2">{edu.title}</h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed mb-4">{edu.description}</p>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 group-hover:text-zinc-800 transition-colors flex items-center gap-1 mt-2">
                                    Read Article <ChevronRight size={10} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Sticky CTA Bar */}
            {showStickyBottomBar && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-50 flex gap-2 md:hidden shadow-lg animate-in slide-in-from-bottom duration-300">
                    <button
                        onClick={handleAction}
                        disabled={diamond.stockStatus === "SOLD"}
                        className="flex-grow py-3.5 text-[13px] font-bold uppercase tracking-widest bg-[#C9A14A] text-white border border-[#C9A14A] disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                    >
                        {diamond.stockStatus === "SOLD"
                            ? "Unavailable"
                            : isCustomizerMode
                            ? (isSelected ? "Review design" : "Choose Center Stone")
                            : "Add to Cart"}
                    </button>
                </div>
            )}
        </div>
    );
}
