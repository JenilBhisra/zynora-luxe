/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Box, ArrowLeft, Check } from "lucide-react";
import { useCustomizerStore } from "@/lib/customizer-store";
import type { MetalType } from "@/lib/customizer-store";
import dynamic from "next/dynamic";

const ModelCanvas = dynamic(() => import("./ModelViewer3D"), {
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

const METAL_OPTIONS: { label: MetalType; color: string; ring: string; priceAdjustment: number }[] = [
    { label: "18K White Gold", color: "#E8E8E8", ring: "#ccc", priceAdjustment: 0 },
    { label: "18K Yellow Gold", color: "#D4AF37", ring: "#b89a2a", priceAdjustment: 0 },
    { label: "18K Rose Gold", color: "#C28080", ring: "#a56060", priceAdjustment: 0 },
    { label: "Platinum", color: "#DDE1E4", ring: "#9fa5ab", priceAdjustment: 35000 },
];

export default function SettingDetailClient({ setting }: { setting: any }) {
    const router = useRouter();
    const setSetting = useCustomizerStore((s) => s.setSetting);
    const setMetalType = useCustomizerStore((s) => s.setMetalType);
    const selectedSetting = useCustomizerStore((s) => s.config.setting);
    const currentMetal = useCustomizerStore((s) => s.config.metalType);
    const isSelected = selectedSetting?.id === setting.id;

    // Parse size prices from the setting — nested format: { karat: { size: price } }
    const RING_SIZES = ["2","2 1/4","2 1/2","2 3/4","3","3 1/4","3 1/2","3 3/4","4","4 1/4","4 1/2","4 3/4","5","5 1/4","5 1/2","5 3/4","6","6 1/4","6 1/2","6 3/4","7","7 1/4","7 1/2","7 3/4","8","8 1/4","8 1/2","8 3/4","9","9 1/4","9 1/2","9 3/4","10","10 1/4","10 1/2","10 3/4","11","11 1/4","11 1/2","11 3/4","12"];
    const ALL_KARATS = ["9K", "14K", "18K", "22K"] as const;

    // Parse nested sizePrices — this is the source of truth for karat options
    const sizePricesNested: Record<string, Record<string, number>> = (() => {
        try { return JSON.parse(setting.sizePrices || "{}"); } catch { return {}; }
    })();

    // Also parse legacy karatPrices (may be empty for newly-created settings)
    const karatPricesMap: Record<string, number> = (() => {
        try { return JSON.parse(setting.karatPrices || "{}"); } catch { return {}; }
    })();

    // Derive available karats from nested sizePrices keys (primary) or legacy karatPrices (fallback)
    const availableKarats = ALL_KARATS.filter(k => {
        const hasNestedSizes = sizePricesNested[k] && Object.keys(sizePricesNested[k]).length > 0;
        const hasLegacyPrice = karatPricesMap[k] !== undefined;
        return hasNestedSizes || hasLegacyPrice;
    });
    const [selectedKarat, setSelectedKarat] = useState<string>(availableKarats[0] ?? "");

    // Sizes available for the currently selected karat
    const sizePricesForKarat: Record<string, number> = selectedKarat
        ? (sizePricesNested[selectedKarat] || {})
        : {};
    const availableSizes = RING_SIZES.filter(s => sizePricesForKarat[s] !== undefined);
    const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] ?? "");

    // Display price: use nested size price if available, else legacy karatPrices, else base
    const karatBase = selectedKarat && karatPricesMap[selectedKarat] !== undefined
        ? karatPricesMap[selectedKarat]
        : setting.price;
    const sizeAddon = selectedSize && sizePricesForKarat[selectedSize] !== undefined
        ? sizePricesForKarat[selectedSize]
        : 0;
    // If nested pricing exists for this karat, the size price IS the full price
    const hasNestedPricing = selectedKarat && sizePricesNested[selectedKarat] && Object.keys(sizePricesNested[selectedKarat]).length > 0;
    const displayPrice = hasNestedPricing
        ? sizeAddon  // size price is the complete price for this karat+size
        : karatBase + (availableSizes.length > 0 ? sizeAddon : 0);

    // When karat changes, update selectedSize to first available size for that karat
    const handleKaratChange = (newKarat: string) => {
        setSelectedKarat(newKarat);
        const newSizePrices = sizePricesNested[newKarat] || {};
        const newAvailableSizes = RING_SIZES.filter(s => newSizePrices[s] !== undefined);
        if (!newAvailableSizes.includes(selectedSize)) {
            setSelectedSize(newAvailableSizes[0] ?? "");
        }
    };

    const images: string[] = useMemo(() => {
        try {
            const parsed = JSON.parse(setting.images || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { /* ignore */ }
        return setting.imageUrl ? [setting.imageUrl] : [];
    }, [setting]);

    const videoUrl: string | null = setting.videoUrl || null;
    const modelUrl: string | null = setting.modelUrl || null;

    type MediaItem =
        | { type: "photo"; src: string }
        | { type: "video" }
        | { type: "3d" };

    const mediaItems: MediaItem[] = useMemo(() => {
        const items: MediaItem[] = [];
        if (modelUrl) items.push({ type: "3d" });
        images.forEach(src => items.push({ type: "photo", src }));
        if (videoUrl) items.push({ type: "video" });
        return items;
    }, [images, videoUrl, modelUrl]);

    const [activeIdx, setActiveIdx] = useState(0);
    const [selectedMetal, setSelectedMetal] = useState<MetalType>(currentMetal);
    const activeItem = mediaItems[activeIdx] ?? null;

    const prev = useCallback(() => setActiveIdx(i => (i - 1 + mediaItems.length) % mediaItems.length), [mediaItems.length]);
    const next = useCallback(() => setActiveIdx(i => (i + 1) % mediaItems.length), [mediaItems.length]);

    const handleChoose = () => {
        const metalOption = METAL_OPTIONS.find(m => m.label === selectedMetal) ?? METAL_OPTIONS[0];
        setMetalType(metalOption.label, metalOption.priceAdjustment);
        setSetting(setting);
        router.push("/customizer/step-3-review");
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white">

            {/* ── Top nav ──────────────────────────────────────── */}
            <div className="border-b border-white/8 bg-[#0d0d0f]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
                    <Link
                        href="/customizer/step-2-setting"
                        className="flex items-center gap-2 text-white/40 hover:text-[#D6B25E] text-[11px] uppercase tracking-[0.2em] font-bold transition-colors"
                    >
                        <ArrowLeft size={13} />
                        All Settings
                    </Link>
                    {/* Breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                        <span>Customizer</span>
                        <ChevronRight size={10} className="text-white/20" />
                        <span>Choose Setting</span>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[#D6B25E]">{setting.name}</span>
                    </div>
                    {/* Step indicators */}
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                        <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-[9px]">1</span>
                        <span>Diamond</span>
                        <ChevronRight size={10} className="text-white/15" />
                        <span className="bg-[#D6B25E] text-[#0B0B0C] w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                        <span className="text-[#D6B25E]">Setting</span>
                        <ChevronRight size={10} className="text-white/15" />
                        <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-[9px]">3</span>
                        <span className="hidden sm:inline">Complete</span>
                    </div>
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
                                    <Image src={(item as any).src} alt="" fill className="object-cover" unoptimized />
                                )}
                                {item.type === "video" && (
                                    <div className="flex flex-col items-center gap-1 bg-black/60 inset-0 absolute justify-center">
                                        <Play size={16} className="text-[#D6B25E]" />
                                        <span className="text-[7px] uppercase tracking-widest text-white/50 font-bold">Video</span>
                                    </div>
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
                                <Image
                                    key={activeIdx}
                                    src={(activeItem as any).src}
                                    alt={setting.name}
                                    fill
                                    className="object-contain p-8 transition-opacity duration-300"
                                    unoptimized
                                />
                            )}
                            {activeItem?.type === "video" && videoUrl && (
                                <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
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
                                    {item.type === "photo" && <Image src={(item as any).src} alt="" fill className="object-cover" unoptimized />}
                                    {item.type === "video" && <Play size={14} className="text-[#D6B25E]" />}
                                    {item.type === "3d" && <Box size={14} className="text-[#D6B25E]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Col 3: Details ──────────────────────── */}
                    <div className="flex flex-col gap-6 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D6B25E]/70">{setting.category} Setting</p>
                        <h1 className="text-3xl font-medium text-white leading-tight tracking-wide">{setting.name}</h1>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">{fmt(displayPrice)}</span>
                            <span className="text-sm text-white/35">(Setting Only)</span>
                        </div>

                        <div className="border-t border-white/8" />

                        {/* Karat Selector — shown when karat data exists */}
                        {availableKarats.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                                    Gold Karat: <span className="text-[#D6B25E]">{selectedKarat}</span>
                                </p>
                                <div className="relative">
                                    <select
                                        value={selectedKarat}
                                        onChange={e => handleKaratChange(e.target.value)}
                                        className="w-full appearance-none bg-white/6 border border-white/12 text-white text-[13px] font-medium px-4 py-3 pr-10 rounded-none focus:outline-none focus:border-[#D6B25E] transition-colors cursor-pointer hover:border-white/25"
                                    >
                                        {availableKarats.map(k => (
                                            <option key={k} value={k} className="bg-[#111] text-white">
                                                {k} Gold
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-4 gap-1.5">
                                    {availableKarats.map(k => (
                                        <button
                                            key={k}
                                            onClick={() => handleKaratChange(k)}
                                            className={`py-2 px-1 text-center text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border rounded-none ${
                                                selectedKarat === k
                                                    ? "bg-[#D6B25E] text-[#0B0B0C] border-[#D6B25E]"
                                                    : "bg-white/4 text-white/60 border-white/10 hover:border-[#D6B25E]/40 hover:text-white"
                                            }`}
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ring Size Selector — prices depend on selected karat */}
                        {availableSizes.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                                    Ring Size (US): <span className="text-[#D6B25E]">{selectedSize}</span>
                                    {selectedSize && sizePricesForKarat[selectedSize] !== undefined && (
                                        <span className="ml-2 text-white/30">+{fmt(sizePricesForKarat[selectedSize])}</span>
                                    )}
                                </p>
                                <div className="relative mb-2">
                                    <select
                                        value={selectedSize}
                                        onChange={e => setSelectedSize(e.target.value)}
                                        className="w-full appearance-none bg-white/6 border border-white/12 text-white text-[13px] font-medium px-4 py-3 pr-10 rounded-none focus:outline-none focus:border-[#D6B25E] transition-colors cursor-pointer hover:border-white/25"
                                    >
                                        {availableSizes.map(s => (
                                            <option key={s} value={s} className="bg-[#111] text-white">
                                                Size {s} US — ₹{sizePricesForKarat[s].toLocaleString("en-IN")}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                                    {availableSizes.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSize(s)}
                                            className={`py-1.5 px-1 text-center text-[10px] font-bold transition-all duration-200 border rounded-none ${
                                                selectedSize === s
                                                    ? "bg-[#D6B25E] text-[#0B0B0C] border-[#D6B25E]"
                                                    : "bg-white/4 text-white/55 border-white/10 hover:border-[#D6B25E]/40 hover:text-white"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                                Metal: <span className="text-white">{selectedMetal}</span>
                            </p>
                            <div className="flex gap-3">
                                {METAL_OPTIONS.map((m) => (
                                    <button
                                        key={m.label}
                                        title={m.label}
                                        onClick={() => setSelectedMetal(m.label)}
                                        className={`w-9 h-9 rounded-full transition-all duration-200 ${
                                            selectedMetal === m.label
                                                ? "scale-110 ring-2 ring-[#D6B25E] ring-offset-2 ring-offset-[#0B0B0C]"
                                                : "opacity-60 hover:opacity-100 hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: m.color, boxShadow: `0 0 0 1px ${m.ring}` }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Description</p>
                            <p className="text-sm text-white/60 leading-relaxed">{setting.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {images.length > 0 && (
                                <span className="px-3 py-1 bg-white/6 rounded-full text-[9px] text-white/40 uppercase tracking-widest font-bold">
                                    {images.length} Photo{images.length > 1 ? "s" : ""}
                                </span>
                            )}
                            {videoUrl && (
                                <span className="px-3 py-1 bg-white/6 rounded-full text-[9px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1">
                                    <Play size={8} /> Video
                                </span>
                            )}
                            {modelUrl ? (
                                <span className="px-3 py-1 bg-[#D6B25E]/10 border border-[#D6B25E]/20 rounded-full text-[9px] text-[#D6B25E] uppercase tracking-widest font-bold flex items-center gap-1">
                                    <Box size={8} /> 3D Model
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-white/4 rounded-full text-[9px] text-white/25 uppercase tracking-widest font-bold">No 3D Model</span>
                            )}
                        </div>

                        <div className="border-t border-white/8" />

                        <button
                            onClick={handleChoose}
                            className={`w-full py-4 text-sm uppercase tracking-[0.18em] font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                                isSelected
                                    ? "bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C]"
                                    : "bg-white text-[#0B0B0C] hover:bg-[#D6B25E]"
                            }`}
                        >
                            {isSelected && <Check size={15} />}
                            {isSelected ? "Selected — Continue to Review" : "Choose This Setting"}
                        </button>

                        <Link href="/customizer/step-2-setting" className="text-center text-[11px] uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors font-bold">
                            ← View All Settings
                        </Link>

                        <div className="border border-white/6 rounded-xl p-4 flex flex-col gap-2.5 text-[11px] text-white/35">
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> Free shipping &amp; returns</div>
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> Lifetime craftsmanship warranty</div>
                            <div className="flex items-center gap-2"><span className="text-[#D6B25E]">✓</span> Certified conflict-free diamonds</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
