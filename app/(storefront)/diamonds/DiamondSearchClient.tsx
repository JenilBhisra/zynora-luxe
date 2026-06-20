"use client";

import React, { useState, useEffect } from "react";
import { DualRangeSlider } from "@/components/DualRangeSlider";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import type { Diamond } from "@prisma/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomizerStore } from "@/lib/customizer-store";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { selectCardImage } from "@/lib/image-utils";
import Link from "next/link";
import { SlidersHorizontal, X as XIcon } from "lucide-react";

// Formatter for ₹ Currency
const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export function DiamondSearchClient({ customizerMode = false }: { customizerMode?: boolean }) {
    const router = useRouter();
    const setDiamondStore = useCustomizerStore((state) => state.setDiamond);

    // Data States
    const [diamonds, setDiamonds] = useState<Diamond[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);    // Filter States
    const [priceRange, setPriceRange] = useState<[number, number]>([10000, 2000000]);
    const [caratRange, setCaratRange] = useState<[number, number]>([0.2, 10]);

    const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
    const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
    const [selectedClarities, setSelectedClarities] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
    const [selectedOrigin, setSelectedOrigin] = useState<"Natural" | "Lab Grown">("Natural");

    // Filter Options
    const shapes = ['Round', 'Oval', 'Princess', 'Emerald', 'Cushion', 'Pear', 'Radiant'];
    const cuts = ['Excellent', 'Very Good', 'Good'];
    const clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
    const colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const certs = ['GIA', 'IGI'];
    const usedDiamondImages = new Set<string>();

    useEffect(() => {
        const fetchDiamonds = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '12', // 3 columns * 4 rows fits nicely
                    minPrice: priceRange[0].toString(),
                    maxPrice: priceRange[1].toString(),
                    minCarat: caratRange[0].toString(),
                    maxCarat: caratRange[1].toString(),
                });

                if (selectedShapes.length > 0) params.append('shapes', selectedShapes.join(','));
                if (selectedCuts.length > 0) params.append('cuts', selectedCuts.join(','));
                if (selectedClarities.length > 0) params.append('clarities', selectedClarities.join(','));
                if (selectedColors.length > 0) params.append('colors', selectedColors.join(','));
                
                // Smart mapping for origin to certs
                const queryCerts = [...selectedCerts];
                if (queryCerts.length === 0) {
                    if (selectedOrigin === "Natural") {
                        queryCerts.push("GIA");
                    } else {
                        queryCerts.push("IGI");
                    }
                }
                if (queryCerts.length > 0) params.append('certs', queryCerts.join(','));

                const response = await fetch(`/api/diamonds?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setDiamonds(data.diamonds);
                    setTotalCount(data.totalCount);
                    setTotalPages(data.totalPages);
                }
            } catch (error) {
                console.error("Failed to fetch diamonds", error);
            } finally {
                setIsLoading(false);
            }
        };

        const handler = setTimeout(() => {
            fetchDiamonds();
        }, 300); // 300ms debounce
        return () => clearTimeout(handler);
    }, [priceRange, caratRange, selectedShapes, selectedCuts, selectedClarities, selectedColors, selectedCerts, selectedOrigin, page]);

    const handleSelectDiamond = (diamond: Diamond) => {
        sessionStorage.setItem('selectedDiamond', JSON.stringify(diamond));

        if (customizerMode) {
            setDiamondStore(diamond);
            toast.success("Diamond Selected! Now choose your ring setting.");
            router.push('/customizer/step-2-setting');
        } else {
            router.push('/ring-settings');
        }
    };

    const toggleFilter = (stateSetter: React.Dispatch<React.SetStateAction<string[]>>, options: string[], value: string) => {
        stateSetter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
    };

    const resetFilters = () => {
        setPriceRange([10000, 2000000]);
        setCaratRange([0.2, 10]);
        setSelectedShapes([]);
        setSelectedCuts([]);
        setSelectedClarities([]);
        setSelectedColors([]);
        setSelectedCerts([]);
        setSelectedOrigin("Natural");
        setPage(1);
    };

    const activeFilterCount = selectedShapes.length + selectedCuts.length + selectedClarities.length + selectedColors.length + selectedCerts.length;

    // Build active filter chips
    const activeChips = [];
    if (selectedShapes.length > 0) {
        selectedShapes.forEach(shape => activeChips.push({ type: 'shape', value: shape, label: shape }));
    }
    if (caratRange[0] !== 0.2 || caratRange[1] !== 10) {
        activeChips.push({ type: 'carat', value: caratRange, label: `${caratRange[0]} - ${caratRange[1]} CT` });
    }
    if (priceRange[0] !== 10000 || priceRange[1] !== 2000000) {
        activeChips.push({ type: 'price', value: priceRange, label: `₹${priceRange[0].toLocaleString('en-IN')} - ₹${priceRange[1].toLocaleString('en-IN')}` });
    }
    if (selectedColors.length > 0) {
        selectedColors.forEach(color => activeChips.push({ type: 'color', value: color, label: `Color ${color}` }));
    }
    if (selectedClarities.length > 0) {
        selectedClarities.forEach(clarity => activeChips.push({ type: 'clarity', value: clarity, label: `Clarity ${clarity}` }));
    }
    if (selectedCerts.length > 0) {
        selectedCerts.forEach(cert => activeChips.push({ type: 'cert', value: cert, label: cert }));
    }

    const removeChip = (chip: any) => {
        if (chip.type === 'shape') {
            setSelectedShapes(prev => prev.filter(s => s !== chip.value));
        } else if (chip.type === 'carat') {
            setCaratRange([0.2, 10]);
        } else if (chip.type === 'price') {
            setPriceRange([10000, 2000000]);
        } else if (chip.type === 'color') {
            setSelectedColors(prev => prev.filter(c => c !== chip.value));
        } else if (chip.type === 'clarity') {
            setSelectedClarities(prev => prev.filter(c => c !== chip.value));
        } else if (chip.type === 'cert') {
            setSelectedCerts(prev => prev.filter(c => c !== chip.value));
        }
    };

    // --- Shared filter panel content ---
    const FilterPanelContent = (
        <div className="w-full space-y-6 bg-white rounded-none">
            {/* Origin Selector */}
            <div className="pb-5 border-b border-zinc-200">
                <p className="text-[13px] md:text-[14px] font-semibold text-zinc-900 tracking-wide mb-3 uppercase">Diamond Origin</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            setSelectedOrigin("Natural");
                            setPage(1);
                        }}
                        className={`py-2 text-xs font-semibold tracking-wider uppercase border transition-all rounded-none ${
                            selectedOrigin === "Natural"
                                ? "bg-zinc-900 border-zinc-900 text-white"
                                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        }`}
                    >
                        Natural Diamonds
                    </button>
                    <button
                        onClick={() => {
                            setSelectedOrigin("Lab Grown");
                            setPage(1);
                        }}
                        className={`py-2 text-xs font-semibold tracking-wider uppercase border transition-all rounded-none ${
                            selectedOrigin === "Lab Grown"
                                ? "bg-zinc-900 border-zinc-900 text-white"
                                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        }`}
                    >
                        Lab Grown Diamonds
                    </button>
                </div>
            </div>

            {/* Shape Icons Grid */}
            <div className="pb-5 border-b border-zinc-200">
                <p className="text-[13px] md:text-[14px] font-semibold text-zinc-900 tracking-wide mb-3 uppercase">Diamond Shape</p>
                <div className="grid grid-cols-3 gap-2">
                    {shapes.map((shape) => {
                        const isSelected = selectedShapes.includes(shape);
                        return (
                            <button
                                key={shape}
                                onClick={() => {
                                    toggleFilter(setSelectedShapes, shapes, shape);
                                    setPage(1);
                                }}
                                className={`flex flex-col items-center justify-center p-2.5 border transition-all rounded-none ${
                                    isSelected
                                        ? "bg-zinc-50 border-zinc-900 text-zinc-900 font-semibold"
                                        : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-800"
                                }`}
                            >
                                <div className="mb-1.5 text-zinc-700">
                                    {shape === "Round" && <RoundIcon />}
                                    {shape === "Oval" && <OvalIcon />}
                                    {shape === "Princess" && <PrincessIcon />}
                                    {shape === "Emerald" && <EmeraldIcon />}
                                    {shape === "Cushion" && <CushionIcon />}
                                    {shape === "Pear" && <PearIcon />}
                                    {shape === "Radiant" && <RadiantIcon />}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider font-medium">{shape}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Price Slider Section */}
            <div className="pb-5 border-b border-zinc-200">
                <p className="text-[13px] md:text-[14px] font-semibold text-zinc-900 tracking-wide mb-3 uppercase">Price Range</p>
                <div className="px-1">
                    <DualRangeSlider
                        min={10000}
                        max={2000000}
                        step={10000}
                        value={priceRange}
                        onValueChange={(val) => {
                            setPriceRange(val);
                            setPage(1);
                        }}
                        formatValue={formatPrice}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center border border-zinc-200 px-2 py-1.5 w-full bg-white rounded-none">
                        <span className="text-xs text-zinc-400 mr-1">₹</span>
                        <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => {
                                const val = Math.max(10000, Math.min(priceRange[1], parseInt(e.target.value) || 0));
                                setPriceRange([val, priceRange[1]]);
                                setPage(1);
                            }}
                            className="w-full text-xs font-medium focus:outline-none bg-transparent rounded-none"
                        />
                    </div>
                    <span className="text-zinc-400 text-xs">—</span>
                    <div className="flex items-center border border-zinc-200 px-2 py-1.5 w-full bg-white rounded-none">
                        <span className="text-xs text-zinc-400 mr-1">₹</span>
                        <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => {
                                const val = Math.min(2000000, Math.max(priceRange[0], parseInt(e.target.value) || 0));
                                setPriceRange([priceRange[0], val]);
                                setPage(1);
                            }}
                            className="w-full text-xs font-medium focus:outline-none bg-transparent rounded-none"
                        />
                    </div>
                </div>
            </div>

            {/* Carat Slider Section */}
            <div className="pb-5 border-b border-zinc-200">
                <p className="text-[13px] md:text-[14px] font-semibold text-zinc-900 tracking-wide mb-3 uppercase">Carat</p>
                <div className="px-1">
                    <DualRangeSlider
                        min={0.2}
                        max={10}
                        step={0.1}
                        value={caratRange}
                        onValueChange={(val) => {
                            setCaratRange(val);
                            setPage(1);
                        }}
                        formatValue={(v) => `${v.toFixed(2)} CT`}
                    />
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center border border-zinc-200 px-2 py-1.5 w-full bg-white rounded-none">
                        <input
                            type="number"
                            step="0.01"
                            value={caratRange[0]}
                            onChange={(e) => {
                                const val = Math.max(0.2, Math.min(caratRange[1], parseFloat(e.target.value) || 0));
                                setCaratRange([val, caratRange[1]]);
                                setPage(1);
                            }}
                            className="w-full text-xs font-medium focus:outline-none text-center bg-transparent rounded-none"
                        />
                    </div>
                    <span className="text-zinc-400 text-xs">—</span>
                    <div className="flex items-center border border-zinc-200 px-2 py-1.5 w-full bg-white rounded-none">
                        <input
                            type="number"
                            step="0.01"
                            value={caratRange[1]}
                            onChange={(e) => {
                                const val = Math.min(10.0, Math.max(caratRange[0], parseFloat(e.target.value) || 0));
                                setCaratRange([caratRange[0], val]);
                                setPage(1);
                            }}
                            className="w-full text-xs font-medium focus:outline-none text-center bg-transparent rounded-none"
                        />
                    </div>
                </div>
            </div>

            {/* Cut Toggle */}
            <FilterGroup title="Cut" options={cuts} selected={selectedCuts} onToggle={(val) => { toggleFilter(setSelectedCuts, cuts, val); setPage(1); }} />

            {/* Clarity Toggle */}
            <FilterGroup title="Clarity" options={clarities} selected={selectedClarities} onToggle={(val) => { toggleFilter(setSelectedClarities, clarities, val); setPage(1); }} />

            {/* Color Toggle */}
            <FilterGroup title="Color" options={colors} selected={selectedColors} onToggle={(val) => { toggleFilter(setSelectedColors, colors, val); setPage(1); }} />

            {/* Certification Toggle */}
            <FilterGroup title="Certification" options={certs} selected={selectedCerts} onToggle={(val) => { toggleFilter(setSelectedCerts, certs, val); setPage(1); }} />
        </div>
    );

    return (
        <div className="py-6 lg:py-10 text-zinc-800 w-full diamond-filter-sidebar">
            <style dangerouslySetInnerHTML={{ __html: `
                .diamond-filter-sidebar [role="slider"],
                .mobile-filter-drawer [role="slider"] {
                    border-radius: 0px !important;
                }
                .diamond-filter-sidebar [class*="Track"],
                .diamond-filter-sidebar [class*="Range"],
                .mobile-filter-drawer [class*="Track"],
                .mobile-filter-drawer [class*="Range"] {
                    border-radius: 0px !important;
                }
            ` }} />

            {/* ── ACTIVE FILTER CHIPS (Brilliant Earth style) ── */}
            {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-xs text-zinc-500 font-medium">
                    {activeChips.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => removeChip(chip)}
                            className="flex items-center gap-1.5 hover:text-[#C9A14A] hover:line-through transition-all"
                        >
                            <span>{chip.label}</span>
                            <span className="text-[10px] text-zinc-400">✕</span>
                        </button>
                    ))}
                    <button
                        onClick={resetFilters}
                        className="text-[#C9A14A] hover:underline uppercase tracking-wider text-[10px] font-bold ml-2"
                    >
                        Reset All ✕
                    </button>
                </div>
            )}

            {/* Split Sidebar & Results Layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start w-full">

                {/* ── MOBILE: filter drawer toggle button ── */}
                <div className="lg:hidden w-full mb-2">
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-zinc-200 text-zinc-800 rounded-none text-xs uppercase tracking-widest font-semibold hover:bg-zinc-50 transition-colors"
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1 bg-zinc-900 text-white text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-none font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Mobile filter drawer */}
                    <AnimatePresence>
                        {isMobileFilterOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[200]"
                                />
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                    className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-[201] bg-white rounded-none border-t border-zinc-200 overflow-y-auto custom-scrollbar mobile-filter-drawer"
                                >
                                    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-zinc-200">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-zinc-800">Filters</p>
                                        <button onClick={() => setIsMobileFilterOpen(false)} className="text-zinc-400 hover:text-[#C9A14A] transition-colors p-1">
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {FilterPanelContent}
                                    </div>
                                    <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-5 py-4">
                                        <button
                                            onClick={() => setIsMobileFilterOpen(false)}
                                            className="w-full py-3.5 bg-zinc-900 text-white text-xs font-semibold uppercase tracking-widest rounded-none hover:bg-zinc-800 transition-colors"
                                        >
                                            Show {totalCount} Results
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── DESKTOP: Left Sidebar (25% - 28% width) ── */}
                <aside className="hidden lg:block w-[26%] flex-shrink-0 border-r border-zinc-200 pr-8 pb-10">
                    <div className="sticky top-32 h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
                        {FilterPanelContent}
                    </div>
                </aside>

                {/* ── RIGHT RESULT CONTAINER (72% - 75% width) ── */}
                <div className="flex-1 lg:w-[74%] w-full">
                    <AnimatedSection as="div" className="flex justify-between items-end mb-5 border-b border-zinc-200 pb-3">
                        <h2 className="text-lg md:text-[18px] font-medium text-zinc-900 tracking-wide font-serif">
                            Search Results
                        </h2>
                        <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-[0.08em]">
                            {totalCount} Diamonds Found
                        </span>
                    </AnimatedSection>

                    {/* GRID RESULTS */}
                    <div className="w-full relative min-h-[400px]">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="rounded-none p-3 border border-zinc-200 bg-white animate-pulse">
                                        <div className="aspect-square w-full mb-4 bg-zinc-100 rounded-none" />
                                        <div className="h-4 w-3/4 mb-2 bg-zinc-200 rounded-none" />
                                        <div className="h-3.5 w-1/2 mb-4 bg-zinc-100 rounded-none" />
                                        <div className="h-9 w-full bg-zinc-100 rounded-none" />
                                    </div>
                                ))}
                            </div>
                        ) : diamonds.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.1 }}
                                className="grid grid-cols-2 md:grid-cols-3 gap-6"
                            >
                                <AnimatePresence>
                                    {diamonds.map((diamond, index) => (
                                        <motion.div
                                            key={diamond.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="group flex flex-col justify-between relative overflow-hidden rounded-none bg-white p-3 border border-zinc-200 transition-all duration-300 hover:border-zinc-400"
                                        >
                                            <div>
                                                {/* Heart Icon Top-Right */}
                                                <button
                                                    className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-red-500 transition-colors p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        toast.success("Added to wishlist!");
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart hover:fill-red-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                                </button>

                                                {/* Small Badge Top-Left */}
                                                {index % 4 === 1 && (
                                                    <span className="absolute top-4 left-4 z-20 text-[9px] tracking-wider uppercase font-bold text-white bg-[#C9A14A] px-2 py-0.5 rounded-none">
                                                        Best Value
                                                    </span>
                                                )}
                                                {index % 4 === 3 && (
                                                    <span className="absolute top-4 left-4 z-20 text-[9px] tracking-wider uppercase font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-none">
                                                        Rare
                                                    </span>
                                                )}

                                                {/* Diamond Image Container */}
                                                <Link
                                                    href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}
                                                    className="relative block aspect-square w-full bg-zinc-50 mb-4 z-10 flex items-center justify-center p-3 rounded-none overflow-hidden border border-zinc-100"
                                                >
                                                    <SmartImage
                                                        src={selectCardImage(diamond.imageUrl || "", usedDiamondImages, "diamond", index, diamond.id, `${diamond.shape}-${diamond.caratWeight}`)}
                                                        alt={`${diamond.shape} diamond`}
                                                        fill
                                                        fallbackType="diamond"
                                                        imageKey={`${diamond.id}:${index}`}
                                                        className="object-contain mix-blend-multiply opacity-95 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                                                    />
                                                </Link>

                                                {/* Product Title & Info below image */}
                                                <div className="w-full text-left px-1 z-10 mb-2">
                                                    <Link href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}>
                                                        <h3 className="font-serif font-medium text-zinc-900 text-sm md:text-[16px] mb-1.5 leading-tight hover:text-[#C9A14A] transition-colors">
                                                            {diamond.caratWeight.toFixed(2)} ct. {diamond.shape} Diamond
                                                        </h3>
                                                    </Link>
                                                    <p className="text-[12px] text-zinc-400 font-normal leading-tight">
                                                        {diamond.cut} · {diamond.color} · {diamond.clarity}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-baseline w-full mt-2 px-1 mb-3">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{diamond.certification}</span>
                                                    <span className="text-[14px] md:text-[16px] font-bold text-zinc-900">{formatPrice(diamond.price)}</span>
                                                </div>

                                                <button
                                                    className="w-full z-10 text-xs font-semibold py-2.5 rounded-none bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors duration-300 uppercase tracking-wider"
                                                    onClick={() => {
                                                        if (customizerMode) {
                                                            handleSelectDiamond(diamond);
                                                        } else {
                                                            router.push(`/diamonds/${diamond.id}`);
                                                        }
                                                    }}
                                                >
                                                    Select Diamond
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-white rounded-none border border-dashed border-zinc-200">
                                <h3 className="text-xl font-serif text-zinc-900 mb-2 font-medium">No Diamonds Found</h3>
                                <p className="text-zinc-500 max-w-md mx-auto mb-6 text-sm">We couldn&apos;t find any diamonds matching those exact specifications. Try broadening your filter criteria.</p>
                                <button onClick={resetFilters} className="px-6 py-2.5 bg-zinc-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#C9A14A] rounded-none">Reset All Filters</button>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!isLoading && totalPages > 1 && (
                        <div className="mt-12 flex justify-center gap-3">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-bold uppercase tracking-wider"
                            >
                                Prev
                            </button>
                            <span className="flex items-center px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-bold uppercase tracking-wider"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper Component for UI Filters
function FilterGroup({ title, options, selected, onToggle }: { title: string, options: string[], selected: string[], onToggle: (val: string) => void }) {
    return (
        <div className="pb-5 border-b border-zinc-200 last:border-b-0">
            <p className="text-[13px] md:text-[14px] font-semibold text-zinc-900 tracking-wide mb-3 uppercase">{title}</p>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const isActive = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => onToggle(opt)}
                            className={`px-3 py-1.5 text-xs font-semibold border transition-all rounded-none ${
                                isActive
                                    ? 'bg-zinc-900 border-zinc-900 text-white'
                                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Inline SVGs for diamond shapes
function RoundIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2l3 4.5H9zm0 20l3-5.5H9z" />
            <path d="M2 12l4.5 3v-6zm20 0l-4.5 3v-6z" />
            <path d="M12 6.5L6.5 12 12 17.5 17.5 12z" />
        </svg>
    );
}

function OvalIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="5" y="3" width="14" height="18" rx="7" />
            <path d="M12 3v18M5 12h14" />
            <path d="M12 7L7 12l5 5 5-5z" />
        </svg>
    );
}

function PrincessIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="4" y="4" width="16" height="16" />
            <path d="M4 4l16 16M20 4L4 20M4 12h16M12 4v16" />
            <path d="M12 8L8 12l4 4 4-4z" />
        </svg>
    );
}

function EmeraldIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M6 3h12l3 3v12l-3 3H6l-3-3V6z" />
            <path d="M8 5h8l1.5 1.5v11L16 19H8l-1.5-1.5v-11z" />
            <path d="M10 8h4v8h-4z" />
        </svg>
    );
}

function CushionIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <path d="M4 4l16 16M20 4L4 20M12 4v16M4 12h16" />
            <path d="M12 7.5L7.5 12l4.5 4.5 4.5-4.5z" />
        </svg>
    );
}

function PearIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 3C12 3 5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12z" />
            <path d="M12 3v19M5.5 14h13" />
            <path d="M12 8.5L8.5 13.5h7z" />
        </svg>
    );
}

function RadiantIcon() {
    return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 3h14l2 2v14l-2 2H5l-2-2V5z" />
            <path d="M3 6h18M3 18h18M6 3v18M18 3v18" />
            <path d="M12 8l-4 4 4 4 4-4z" />
        </svg>
    );
}
