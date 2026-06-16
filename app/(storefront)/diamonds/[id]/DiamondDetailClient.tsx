/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Box, ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { useCustomizerStore } from "@/lib/customizer-store";
import { useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { SmartImage } from "@/components/SmartImage";
import { selectCardImage } from "@/lib/image-utils";

const ModelCanvas = dynamic(() => import("@/app/(storefront)/setting/[id]/ModelViewer3D"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0d0d10]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#D6B25E]/30 border-t-[#D6B25E] animate-spin" />
                <p className="text-[#D6B25E]/60 text-[10px] uppercase tracking-[0.25em]">Loading 3D Model…</p>
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
        if (modelUrl) items.push({ type: "3d" });
        items.push({ type: "photo", src: imageSrc });
        return items;
    }, [imageSrc, modelUrl]);

    const [activeIdx, setActiveIdx] = useState(0);
    const activeItem = mediaItems[activeIdx] ?? null;

    const prev = useCallback(() => setActiveIdx(i => (i - 1 + mediaItems.length) % mediaItems.length), [mediaItems.length]);
    const next = useCallback(() => setActiveIdx(i => (i + 1) % mediaItems.length), [mediaItems.length]);

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
            // Optionally redirect to cart or open drawer
            const btn = document.querySelector('[data-cart-drawer-trigger]') as HTMLButtonElement;
            if (btn) btn.click();
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white">

            {/* ── Top nav ──────────────────────────────────────── */}
            <div className="border-b border-white/8 bg-[#0d0d0f]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
                    <Link
                        href={isCustomizerMode ? "/customizer/step-1-diamond" : "/diamonds"}
                        className="flex items-center gap-2 text-white/40 hover:text-[#D6B25E] text-[11px] uppercase tracking-[0.2em] font-bold transition-colors"
                    >
                        <ArrowLeft size={13} />
                        {isCustomizerMode ? "All Diamonds" : "Back to Search"}
                    </Link>
                    {/* Breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                        <span>{isCustomizerMode ? "Customizer" : "Shop"}</span>
                        <ChevronRight size={10} className="text-white/20" />
                        <span>Diamond</span>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[#D6B25E]">{diamond.caratWeight} Carat {diamond.shape}</span>
                    </div>
                    {/* Step indicators (only in customizer) */}
                    {isCustomizerMode ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            <span className="bg-[#D6B25E] text-[#0B0B0C] w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                            <span className="text-[#D6B25E]">Diamond</span>
                            <ChevronRight size={10} className="text-white/15" />
                            <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-[9px]">2</span>
                            <span>Setting</span>
                            <ChevronRight size={10} className="text-white/15" />
                            <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-[9px]">3</span>
                            <span className="hidden sm:inline">Complete</span>
                        </div>
                    ) : <div className="w-[100px]"></div> /* Placeholder for balance */}
                </div>
            </div>

            {/* ── Main ────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[68px_1fr_380px] gap-4 lg:gap-8">

                    {/* ── Col 1: Vertical thumbnail strip ─────── */}
                    <div className="hidden lg:flex flex-col gap-2">
                        {mediaItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                className={`relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                                    i === activeIdx
                                        ? "border-[#D6B25E] shadow-[0_0_12px_rgba(214,178,94,0.25)]"
                                        : "border-white/8 hover:border-white/25 bg-white/4"
                                }`}
                            >
                                {item.type === "photo" && (
                                    <SmartImage src={imageSrc} alt="" fill fallbackType="diamond" imageKey={`thumb-${diamond.id}`} className="object-cover" />
                                )}
                                {item.type === "3d" && (
                                    <div className="flex flex-col items-center gap-1 bg-[#0d1a18] inset-0 absolute justify-center">
                                        <Box size={16} className="text-[#D6B25E]" />
                                        <span className="text-[7px] uppercase tracking-widest text-[#D6B25E]/60 font-bold">3D</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Col 2: Main media ───────────────────── */}
                    <div className="flex flex-col gap-3">
                        <div
                            className="relative w-full rounded-2xl overflow-hidden bg-[#0d0d10] border border-white/6"
                            style={{ aspectRatio: "1 / 1" }}
                        >
                            {activeItem?.type === "photo" && (
                                <SmartImage
                                    key={activeIdx}
                                    src={(activeItem as any).src}
                                    alt={`${diamond.shape} Diamond`}
                                    fill
                                    fallbackType="diamond"
                                    imageKey={`main-${diamond.id}`}
                                    className="object-contain p-8 transition-opacity duration-300 mix-blend-screen"
                                />
                            )}
                            {activeItem?.type === "3d" && modelUrl && (
                                <>
                                    <ModelCanvas url={modelUrl} />
                                    <p className="absolute bottom-3 right-4 text-[9px] text-white/20 uppercase tracking-widest pointer-events-none">
                                        Drag to rotate · Scroll to zoom
                                    </p>
                                </>
                            )}
                            {!activeItem && (
                                <div className="flex items-center justify-center h-full text-white/20 text-sm">No media available</div>
                            )}
                            {mediaItems.length > 1 && (
                                <>
                                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors border border-white/10">
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile thumbnail row */}
                        <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
                            {mediaItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIdx(i)}
                                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl border-2 overflow-hidden flex items-center justify-center bg-white/4 transition-all ${
                                        i === activeIdx ? "border-[#D6B25E]" : "border-white/10"
                                    }`}
                                >
                                    {item.type === "photo" && <SmartImage src={imageSrc} alt="" fill fallbackType="diamond" imageKey={`mobile-thumb-${diamond.id}`} className="object-cover" />}
                                    {item.type === "3d" && <Box size={14} className="text-[#D6B25E]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Col 3: Details ──────────────────────── */}
                    <div className="flex flex-col gap-6 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D6B25E]/70">{diamond.shape} Cut Diamond</p>
                        <h1 className="text-3xl font-medium text-white leading-tight tracking-wide">{diamond.caratWeight.toFixed(2)} Carat {diamond.shape}</h1>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">{fmt(diamond.price)}</span>
                        </div>

                        <div className="border-t border-white/8" />

                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Carat Weight</p>
                                <p className="text-sm text-white font-medium">{diamond.caratWeight.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Color</p>
                                <p className="text-sm text-white font-medium">{diamond.color}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Clarity</p>
                                <p className="text-sm text-white font-medium">{diamond.clarity}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Cut</p>
                                <p className="text-sm text-white font-medium">{diamond.cut}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Shape</p>
                                <p className="text-sm text-white font-medium">{diamond.shape}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Certification</p>
                                <p className="text-sm text-white font-medium">{diamond.certification}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {modelUrl ? (
                                <span className="px-3 py-1 bg-[#D6B25E]/10 border border-[#D6B25E]/20 rounded-full text-[9px] text-[#D6B25E] uppercase tracking-widest font-bold flex items-center gap-1">
                                    <Box size={8} /> 3D Model
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-white/4 rounded-full text-[9px] text-white/25 uppercase tracking-widest font-bold">No 3D Model</span>
                            )}
                        </div>

                        <div className="border-t border-white/8" />

                        {diamond.stockStatus === "SOLD" && (
                            <div className="mb-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-xs">SOLD OUT</span>
                            </div>
                        )}

                        <button
                            onClick={handleAction}
                            disabled={diamond.stockStatus === "SOLD"}
                            className={`w-full py-4 text-sm uppercase tracking-[0.18em] font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                                diamond.stockStatus === "SOLD"
                                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                                    : isSelected && isCustomizerMode
                                        ? "bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C]"
                                        : "bg-white text-[#0B0B0C] hover:bg-[#D6B25E]"
                            }`}
                        >
                            {diamond.stockStatus === "SOLD" ? (
                                "DIAMOND SOLD"
                            ) : isCustomizerMode ? (
                                <>
                                    {isSelected && <Check size={15} />}
                                    {isSelected ? "Selected — Continue to Setting" : "Choose This Diamond"}
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={15} />
                                    Add to Cart
                                </>
                            )}
                        </button>

                        <div className="border border-white/6 rounded-xl p-4 flex flex-col gap-2.5 text-[11px] text-white/35">
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> Free shipping &amp; returns</div>
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> 30-day money-back guarantee</div>
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> Certified conflict-free</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
