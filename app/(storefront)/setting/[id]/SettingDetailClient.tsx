/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Box, ArrowLeft, Check, ShoppingBag, ShieldCheck, Truck, Award, HelpCircle, Eye, Sparkles } from "lucide-react";
import { useCustomizerStore } from "@/lib/customizer-store";
import type { MetalType } from "@/lib/customizer-store";
import { useCart } from "@/components/CartProvider";
import { toast } from "sonner";
import dynamic from "next/dynamic";
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

const ModelCanvas = dynamic(() => import("./ModelViewer3D"), {
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

const METAL_OPTIONS: { label: MetalType; color: string; ring: string; priceAdjustment: number }[] = [
    { label: "18K White Gold", color: "#E8E8E8", ring: "#ccc", priceAdjustment: 0 },
    { label: "18K Yellow Gold", color: "#D4AF37", ring: "#b89a2a", priceAdjustment: 0 },
    { label: "18K Rose Gold", color: "#C28080", ring: "#a56060", priceAdjustment: 0 },
    { label: "Platinum", color: "#DDE1E4", ring: "#9fa5ab", priceAdjustment: 35000 },
];

export default function SettingDetailClient({ setting }: { setting: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const isCustomizerMode = mode === "customizer";

    const setSetting = useCustomizerStore((s) => s.setSetting);
    const setMetalType = useCustomizerStore((s) => s.setMetalType);
    const setRingKaratSize = useCustomizerStore((s) => s.setRingKaratSize);
    const selectedSetting = useCustomizerStore((s) => s.config.setting);
    const currentMetal = useCustomizerStore((s) => s.config.metalType);
    const isSelected = selectedSetting?.id === setting.id;

    const { addToCart } = useCart();

    const RING_SIZES = ["2","2 1/4","2 1/2","2 3/4","3","3 1/4","3 1/2","3 3/4","4","4 1/4","4 1/2","4 3/4","5","5 1/4","5 1/2","5 3/4","6","6 1/4","6 1/2","6 3/4","7","7 1/4","7 1/2","7 3/4","8","8 1/4","8 1/2","8 3/4","9","9 1/4","9 1/2","9 3/4","10","10 1/4","10 1/2","10 3/4","11","11 1/4","11 1/2","11 3/4","12"];
    const ALL_KARATS = ["9K", "14K", "18K", "22K"] as const;

    const sizePricesNested: Record<string, Record<string, number>> = (() => {
        try { return JSON.parse(setting.sizePrices || "{}"); } catch { return {}; }
    })();

    const karatPricesMap: Record<string, number> = (() => {
        try { return JSON.parse(setting.karatPrices || "{}"); } catch { return {}; }
    })();

    const availableKarats = ALL_KARATS.filter(k => {
        const hasNestedSizes = sizePricesNested[k] && Object.keys(sizePricesNested[k]).length > 0;
        const hasLegacyPrice = karatPricesMap[k] !== undefined;
        return hasNestedSizes || hasLegacyPrice;
    });
    const [selectedKarat, setSelectedKarat] = useState<string>(availableKarats[0] ?? "");

    const sizePricesForKarat: Record<string, number> = selectedKarat
        ? (sizePricesNested[selectedKarat] || {})
        : {};
    const availableSizes = RING_SIZES.filter(s => sizePricesForKarat[s] !== undefined);
    const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] ?? "");

    const karatBase = selectedKarat && karatPricesMap[selectedKarat] !== undefined
        ? karatPricesMap[selectedKarat]
        : setting.price;
    const sizeAddon = selectedSize && sizePricesForKarat[selectedSize] !== undefined
        ? sizePricesForKarat[selectedSize]
        : 0;
    const hasNestedPricing = selectedKarat && sizePricesNested[selectedKarat] && Object.keys(sizePricesNested[selectedKarat]).length > 0;
    const displayPrice = hasNestedPricing
        ? sizeAddon
        : karatBase + (availableSizes.length > 0 ? sizeAddon : 0);

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
        } catch { }
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
    const [selectedMetal, setSelectedMetal] = useState<MetalType>(currentMetal || "18K White Gold");
    const activeItem = mediaItems[activeIdx] ?? null;

    const prev = useCallback(() => setActiveIdx(i => (i - 1 + mediaItems.length) % mediaItems.length), [mediaItems.length]);
    const next = useCallback(() => setActiveIdx(i => (i + 1) % mediaItems.length), [mediaItems.length]);

    const [openAccordion, setOpenAccordion] = useState<string | null>("specs");

    const toggleAccordion = (sec: string) => {
        setOpenAccordion(openAccordion === sec ? null : sec);
    };

    const currentMetalOption = useMemo(() => {
        return METAL_OPTIONS.find(m => m.label === selectedMetal) ?? METAL_OPTIONS[0];
    }, [selectedMetal]);

    // Customizer Flow CTA Handler
    const handleChoose = () => {
        setMetalType(currentMetalOption.label, currentMetalOption.priceAdjustment);
        setRingKaratSize(selectedKarat, selectedSize, karatBase, sizeAddon);
        setSetting(setting);
        router.push("/customizer/step-3-review");
    };

    // Standalone Add to Cart Handler
    const handleAddToCart = () => {
        const finalPrice = displayPrice + currentMetalOption.priceAdjustment;
        addToCart({
            id: `setting-${setting.id}-${selectedMetal.replace(/\s+/g, '-')}-${selectedKarat}-${selectedSize.replace(/\s+/g, '-')}`,
            name: `${setting.name} Setting (${selectedKarat} ${selectedMetal}, Size ${selectedSize})`,
            price: finalPrice,
            image: images[0] || setting.imageUrl || "/products/setting-1.jpg",
            quantity: 1,
            metalType: selectedMetal,
        });
        toast.success("Setting added to cart!");
        const btn = document.querySelector('[data-cart-drawer-trigger]') as HTMLButtonElement;
        if (btn) btn.click();
    };

    // Standalone Add to Ring Builder Handler
    const handleAddToRing = () => {
        setMetalType(currentMetalOption.label, currentMetalOption.priceAdjustment);
        setRingKaratSize(selectedKarat, selectedSize, karatBase, sizeAddon);
        setSetting(setting);
        toast.success("Setting selected! Now select a center diamond.");
        router.push("/customizer/step-1-diamond");
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans">

            {/* ── Top nav ──────────────────────────────────────── */}
            <div className="border-b border-zinc-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
                    <Link
                        href={isCustomizerMode ? "/customizer/step-2-setting" : "/ring-settings"}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#C9A14A] text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors"
                    >
                        <ArrowLeft size={13} />
                        {isCustomizerMode ? "All Settings" : "Back to Settings"}
                    </Link>
                    {/* Breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                        <span>{isCustomizerMode ? "Customizer" : "Shop"}</span>
                        <ChevronRight size={10} className="text-zinc-300" />
                        <span>Choose Setting</span>
                        <ChevronRight size={10} className="text-zinc-300" />
                        <span className="text-[#C9A14A] font-bold">{setting.name}</span>
                    </div>
                    {/* Zynora branding */}
                    <span className="text-xs font-serif italic tracking-[0.2em] text-[#C9A14A] font-bold">Zynora Luxe</span>
                </div>
            </div>

            {/* Customizer Progress Bar at the top (if in customizer mode) */}
            {isCustomizerMode && <CustomizerProgressBar currentStep={2} />}

            {/* ── Main Detail Content Grid ───────────────────── */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {/* Left: Gallery (Brilliant Earth 2-column Grid) */}
                    <div className="w-full lg:w-[68%] flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {mediaItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`relative aspect-[4/3] w-full overflow-hidden bg-[#FAF8F4] border border-zinc-100 rounded-[14px] flex items-center justify-center p-2 group ${
                                        mediaItems.length === 1 || (mediaItems.length % 2 !== 0 && idx === 0) ? "md:col-span-2" : ""
                                    }`}
                                >
                                    {item.type === "photo" && (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={(item as any).src}
                                                alt={setting.name}
                                                fill
                                                className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    {item.type === "video" && videoUrl && (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <video src={videoUrl} controls className="w-full h-full object-contain p-2" />
                                        </div>
                                    )}
                                    {item.type === "3d" && modelUrl && (
                                        <div className="relative w-full h-full">
                                            <ModelCanvas url={modelUrl} />
                                            <p className="absolute bottom-3 left-3 right-3 text-center text-[8px] text-zinc-400 uppercase tracking-widest pointer-events-none">
                                                Drag to rotate · Scroll to zoom
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Details Panel */}
                    <div className="w-full lg:w-[32%] flex flex-col gap-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A14A] mb-1 flex items-center gap-1.5">
                                <Sparkles size={11} /> Handcrafted setting
                            </p>
                            <h1 className="text-2xl md:text-3xl lg:text-[34px] font-serif font-medium text-zinc-900 tracking-wide mb-1.5">
                                {setting.name}
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
                                Category: {setting.category} setting
                            </p>
                        </div>

                        <div className="py-4 border-t border-b border-zinc-100">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
                                    {fmt(displayPrice + currentMetalOption.priceAdjustment)}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
                                    (Setting Only)
                                </span>
                            </div>
                            {currentMetalOption.priceAdjustment > 0 && (
                                <p className="text-[10px] text-zinc-400 font-medium mt-1">
                                    * Includes {currentMetalOption.label} upgrade (+{fmt(currentMetalOption.priceAdjustment)})
                                </p>
                            )}
                        </div>

                        {/* Metal selector */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                                Precious Metal: <span className="text-zinc-800 font-semibold">{selectedMetal}</span>
                            </p>
                            <div className="flex gap-3">
                                {METAL_OPTIONS.map((m) => (
                                    <button
                                        key={m.label}
                                        title={m.label}
                                        onClick={() => setSelectedMetal(m.label)}
                                        className={`w-9 h-9 rounded-full transition-all duration-200 border-2 ${
                                            selectedMetal === m.label
                                                ? "scale-105 border-[#C9A14A] ring-2 ring-[#C9A14A]/10 ring-offset-1"
                                                : "border-zinc-200 opacity-70 hover:opacity-100 hover:scale-102"
                                        }`}
                                        style={{ backgroundColor: m.color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Karat selector */}
                        {availableKarats.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                                    Karat: <span className="text-zinc-800 font-semibold">{selectedKarat} Gold</span>
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {availableKarats.map(k => (
                                        <button
                                            key={k}
                                            onClick={() => handleKaratChange(k)}
                                            className={`py-2 px-1 text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border rounded-md ${
                                                selectedKarat === k
                                                    ? "bg-zinc-900 text-white border-zinc-900"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C9A14A]/40"
                                            }`}
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ring Size selector */}
                        {availableSizes.length > 0 && (
                            <div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        Ring Size (US): <span className="text-zinc-800 font-semibold">{selectedSize}</span>
                                    </p>
                                    {selectedSize && sizePricesForKarat[selectedSize] !== undefined && (
                                        <span className="text-[9px] font-semibold text-zinc-400 uppercase">+{fmt(sizePricesForKarat[selectedSize])} Size Add-on</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1 border border-zinc-100 rounded-lg">
                                    {availableSizes.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSize(s)}
                                            className={`py-1.5 text-center text-[10px] font-semibold rounded transition-all duration-200 border ${
                                                selectedSize === s
                                                    ? "bg-zinc-900 text-white border-zinc-900"
                                                    : "bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Craftsmanship &amp; Style</p>
                            <p className="text-xs text-zinc-600 leading-relaxed font-normal">{setting.description}</p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-2.5">
                            {isCustomizerMode ? (
                                <button
                                    onClick={handleChoose}
                                    className="w-full py-4 text-[14px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border bg-[#C9A14A] text-white border-[#C9A14A] hover:bg-black hover:border-black hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                                >
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                    {isSelected ? "Selected — Next: Review Design" : "Choose This Setting"}
                                </button>
                            ) : (
                                <>
                                    {/* Standalone Add to Cart */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full py-4 text-[14px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border bg-zinc-900 text-white border-zinc-900 hover:bg-[#C9A14A] hover:border-[#C9A14A] hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                                    >
                                        <ShoppingBag size={14} />
                                        Add Setting to Cart
                                    </button>

                                    {/* Standalone Add to Ring Builder */}
                                    <button
                                        onClick={handleAddToRing}
                                        className="w-full py-4 text-[14px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border bg-white text-zinc-800 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <Sparkles size={14} className="text-[#C9A14A]" />
                                        Design Custom Ring
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Value Highlights strip */}
                        <div className="grid grid-cols-3 gap-2 py-2 text-center border-t border-b border-zinc-100">
                            <div className="flex flex-col items-center p-2">
                                <Truck size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">Free Insured</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Overnight Shipping</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <ShieldCheck size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">30-Day</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Easy Returns</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <Award size={16} className="text-[#C9A14A] mb-1.5" />
                                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-wider leading-tight">Lifetime</span>
                                <span className="text-[8px] text-zinc-400 font-medium">Setting Warranty</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Below Fold Content Sections ───────────────── */}
                <div className="mt-16 lg:mt-24 max-w-4xl border-t border-zinc-100 pt-10 lg:pt-12">
                    <h2 className="text-lg md:text-xl font-serif text-zinc-900 tracking-wide mb-6 font-medium">Premium Setting Specifications &amp; Assurances</h2>

                    <div className="flex flex-col border border-zinc-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        
                        {/* Section 1: Detailed Specifications Table */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("specs")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Award size={15} className="text-[#C9A14A]" /> Complete Setting Specifications
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "specs" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "specs" && (
                                <div className="p-6 bg-zinc-50/50 transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {[
                                            { label: "Setting Style", val: setting.category },
                                            { label: "Metal Selection", val: selectedMetal },
                                            { label: "Selected Karat", val: selectedKarat ? `${selectedKarat} Gold` : "Platinum" },
                                            { label: "Size Selected", val: `Size ${selectedSize} US` },
                                            { label: "Supported Shapes", val: setting.supportedShapes ? JSON.parse(setting.supportedShapes).join(", ") : "All Shapes" },
                                            { label: "Prong Style", val: "Four-Prong Classic" },
                                            { label: "Width", val: "approx. 1.8mm to 2.2mm" },
                                            { label: "Eco-Conscious", val: "100% Recycled Metal Sourced" },
                                            { label: "Handcrafted In", val: "Zynora Artisan Atelier" },
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

                        {/* Section 2: Ring Size Helper Guide */}
                        <div className="border-b border-zinc-100">
                            <button
                                onClick={() => toggleAccordion("size")}
                                className="w-full flex items-center justify-between p-5 text-left font-bold uppercase tracking-wider text-xs text-zinc-800 hover:bg-zinc-50 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Eye size={15} className="text-[#C9A14A]" /> Ring Size Helper &amp; Tips
                                </span>
                                <span className="text-lg font-normal text-zinc-400">{openAccordion === "size" ? "−" : "+"}</span>
                            </button>
                            {openAccordion === "size" && (
                                <div className="p-6 bg-zinc-50/50 text-zinc-600 space-y-4">
                                    <p className="text-xs leading-relaxed">
                                        Choosing the correct size is crucial for comfort and wear. We provide sizes from US 2 to US 12, including quarter and half sizes.
                                    </p>
                                    <div className="bg-[#FAF8F4] p-4 rounded-lg border border-[#C9A14A]/10">
                                        <p className="text-[10px] uppercase font-bold text-[#C9A14A] tracking-widest mb-1.5">Sizing Tips:</p>
                                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-500">
                                            <li>Our hands tend to swell slightly when warm or at the end of the day. Measure your size in the evening for the best fit.</li>
                                            <li>Wide bands (over 4mm) fit tighter than thinner bands. Order a half size up for wider band styles.</li>
                                            <li>If the ring size is a surprise, measure the inner diameter of a ring she currently wears on the correct finger.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Lifetime Warranty */}
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

                        {/* Section 4: Shipping & Returns */}
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

                        {/* Section 5: Sustainability */}
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

                        {/* Section 6: FAQs */}
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
                    <h2 className="text-lg md:text-xl font-serif text-zinc-900 tracking-wide mb-6 font-medium">Zynora Luxe Ring Education</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ZYNORA_EDUCATION.map((edu, idx) => (
                            <Link key={idx} href={edu.link} className="group bg-zinc-50 p-6 rounded-xl border border-zinc-100 flex flex-col justify-between hover:bg-white hover:shadow-md hover:border-[#C9A14A]/25 transition-all duration-300">
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
        </div>
    );
}
