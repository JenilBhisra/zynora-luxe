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

    // Filter States
    const [priceRange, setPriceRange] = useState<[number, number]>([10000, 2000000]);
    const [caratRange, setCaratRange] = useState<[number, number]>([0.2, 10]);

    const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
    const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
    const [selectedClarities, setSelectedClarities] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

    // Filter Options
    const shapes = ['Round', 'Oval', 'Princess', 'Emerald', 'Cushion'];
    const cuts = ['Excellent', 'Very Good', 'Good'];
    const clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
    const colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const certs = ['IGI', 'GIA'];
    const usedDiamondImages = new Set<string>();

    useEffect(() => {
        const fetchDiamonds = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '20',
                    minPrice: priceRange[0].toString(),
                    maxPrice: priceRange[1].toString(),
                    minCarat: caratRange[0].toString(),
                    maxCarat: caratRange[1].toString(),
                });

                if (selectedShapes.length > 0) params.append('shapes', selectedShapes.join(','));
                if (selectedCuts.length > 0) params.append('cuts', selectedCuts.join(','));
                if (selectedClarities.length > 0) params.append('clarities', selectedClarities.join(','));
                if (selectedColors.length > 0) params.append('colors', selectedColors.join(','));
                if (selectedCerts.length > 0) params.append('certs', selectedCerts.join(','));

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
    }, [priceRange, caratRange, selectedShapes, selectedCuts, selectedClarities, selectedColors, selectedCerts, page]);

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
        setPage(1);
    };

    return (
        <div className="py-6 lg:py-10 flex flex-col lg:flex-row gap-5 lg:gap-8 text-white">

            <aside className="w-full lg:w-48 flex-shrink-0">
                <div className="lg:sticky lg:top-28 luxury-panel p-3 space-y-3 lg:h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar rounded-[14px]">
                    <div className="flex justify-between items-center mb-2">
                        <p style={{fontSize:'9px'}} className="font-bold text-white tracking-[0.22em] uppercase">Filters</p>
                        <button onClick={resetFilters} style={{fontSize:'8px'}} className="font-bold text-white/40 hover:text-[#D6B25E] transition-colors uppercase tracking-widest">
                            Reset All
                        </button>
                    </div>

                    {/* Price Slider */}
                    <div>
                        <p style={{fontSize:'8px'}} className="font-bold uppercase text-white/50 tracking-[0.22em] mb-2 border-t border-white/8 pt-3">Price Range</p>
                        <DualRangeSlider
                            min={10000}
                            max={2000000}
                            step={10000}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            formatValue={formatPrice}
                        />
                    </div>

                    {/* Carat Slider */}
                    <div>
                        <p style={{fontSize:'8px'}} className="font-bold uppercase text-white/50 tracking-[0.22em] mb-2 border-t border-white/8 pt-3">Carat</p>
                        <DualRangeSlider
                            min={0.2}
                            max={10}
                            step={0.1}
                            value={caratRange}
                            onValueChange={setCaratRange}
                            formatValue={(v) => `${v.toFixed(2)} CT`}
                        />
                    </div>

                    {/* Shape Toggle */}
                    <div className="border-t border-white/8 pt-3">
                        <FilterGroup title="Shape" options={shapes} selected={selectedShapes} onToggle={(val) => toggleFilter(setSelectedShapes, shapes, val)} />
                    </div>

                    {/* Cut Toggle */}
                    <div className="border-t border-white/8 pt-3">
                        <FilterGroup title="Cut" options={cuts} selected={selectedCuts} onToggle={(val) => toggleFilter(setSelectedCuts, cuts, val)} />
                    </div>

                    {/* Clarity Toggle */}
                    <div className="border-t border-white/8 pt-3">
                        <FilterGroup title="Clarity" options={clarities} selected={selectedClarities} onToggle={(val) => toggleFilter(setSelectedClarities, clarities, val)} />
                    </div>

                    {/* Color Toggle */}
                    <div className="border-t border-white/8 pt-3">
                        <FilterGroup title="Color" options={colors} selected={selectedColors} onToggle={(val) => toggleFilter(setSelectedColors, colors, val)} />
                    </div>

                    {/* Certification Toggle */}
                    <div className="border-t border-white/8 pt-3">
                        <FilterGroup title="Certification" options={certs} selected={selectedCerts} onToggle={(val) => toggleFilter(setSelectedCerts, certs, val)} />
                    </div>
                </div>
            </aside>

            {/* RESULTS SECTION */}
            <div className="flex-1">
                <AnimatedSection as="div" className="flex justify-between items-end mb-4 border-b border-white/10 pb-3">
                    <h2 style={{fontSize: '18px'}} className="font-medium text-white tracking-wide">Search Results</h2>
                    <span className="text-[10px] text-white/55 font-medium uppercase tracking-[0.06em]">{totalCount} Diamonds Found</span>
                </AnimatedSection>

                {/* GRID RESULTS */}
                <div className="w-full relative min-h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="luxury-shell text-center rounded-[16px] p-3 animate-pulse overflow-hidden">
                                        <div className="h-24 w-full mb-3 rounded-[10px] bg-white/8" />
                                        <div className="h-3 w-3/4 mx-auto mb-2 bg-white/10 rounded" />
                                        <div className="h-3 w-1/2 mx-auto mb-3 bg-white/8 rounded" />
                                        <div className="h-7 w-full rounded-[8px] bg-white/8" />
                                    </div>
                            ))}
                        </div>
                    ) : diamonds.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ staggerChildren: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                        >
                            <AnimatePresence>
                                {diamonds.map((diamond, index) => (
                                    <motion.div
                                        key={diamond.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group luxury-shell p-3 transition-all duration-[1.5s] ease-out flex flex-col items-center relative overflow-hidden rounded-[16px]"
                                    >
                                        <Link 
                                            href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}
                                            className="relative block aspect-square w-full bg-black/20 mb-3 z-10 flex items-center justify-center p-2 rounded-[10px] overflow-hidden"
                                        >
                                            <SmartImage
                                                src={selectCardImage(diamond.imageUrl || "", usedDiamondImages, "diamond", index, diamond.id, `${diamond.shape}-${diamond.caratWeight}`)}
                                                alt={`${diamond.shape} diamond`}
                                                fill
                                                fallbackType="diamond"
                                                imageKey={`${diamond.id}:${index}`}
                                                className="object-contain mix-blend-multiply opacity-90 group-hover:scale-[1.04] transition-transform duration-[1.5s] ease-out"
                                            />
                                        </Link>

                                        <div className="text-center w-full px-1 z-10">
                                            <Link href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}>
                                                <p style={{fontSize: '12px'}} className="font-medium text-white mb-0.5 z-10 leading-tight hover:text-[#D6B25E] transition-colors">{diamond.caratWeight.toFixed(2)} Carat {diamond.shape}</p>
                                            </Link>
                                            <p className="text-[11px] text-white/55 mb-2 z-10 font-normal leading-tight">{diamond.color} · {diamond.clarity} · {diamond.cut}</p>
                                        </div>

                                        <div className="flex justify-between items-center w-full mb-2 px-1 z-10">
                                            <span className="text-[9px] font-medium text-white/45 uppercase tracking-widest">{diamond.certification}</span>
                                            <span className="text-[13px] font-semibold text-white">{formatPrice(diamond.price)}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full z-10 text-[10px] py-1.5 hover:bg-[#D6B25E] hover:text-[#0B0B0C] hover:border-[#D6B25E] transition-colors duration-300 border-white/15"
                                            onClick={() => {
                                                if (customizerMode) {
                                                    handleSelectDiamond(diamond);
                                                } else {
                                                    router.push(`/diamonds/${diamond.id}`);
                                                }
                                            }}
                                        >
                                            {customizerMode ? "Select Diamond" : "View Details"}
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 luxury-panel rounded-[22px] border-dashed border border-white/10">
                            <h3 className="text-xl font-heading text-white mb-2">No Diamonds Found</h3>
                            <p className="text-white/60 max-w-md mx-auto mb-6">We couldn&apos;t find any diamonds matching those exact specifications. Try broadening your filter criteria.</p>
                            <Button onClick={resetFilters} variant="filled">Reset All Filters</Button>
                        </div>
                    )}
                </div>

                {/* Pagination Placeholder if needed */}
                {!isLoading && totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                        <span className="flex items-center px-4 text-sm font-medium text-white/55 uppercase tracking-widest">Page {page} of {totalPages}</span>
                        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Component for UI Filters
function FilterGroup({ title, options, selected, onToggle }: { title: string, options: string[], selected: string[], onToggle: (val: string) => void }) {
    return (
        <div>
            <p style={{fontSize:'8px'}} className="font-bold uppercase text-white/45 tracking-[0.22em] mb-1.5">{title}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                    const isActive = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => onToggle(opt)}
                            style={{fontSize:'9px'}}
                            className={`px-1.5 py-0.5 font-medium border transition-colors rounded-none tracking-wider ${isActive ? 'bg-[#D6B25E] border-[#D6B25E] text-[#0B0B0C]' : 'bg-white/5 border-white/10 text-white/55 hover:border-[#D6B25E] hover:text-white'}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
