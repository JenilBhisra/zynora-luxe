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
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

    const activeFilterCount = selectedShapes.length + selectedCuts.length + selectedClarities.length + selectedColors.length + selectedCerts.length;

    // --- Shared filter panel content ---
    const FilterPanelContent = (
        <div className="luxury-panel p-4 space-y-4 rounded-xl border border-zinc-200 bg-white">
            <div className="flex justify-between items-center mb-2">
                <p style={{fontSize:'10px'}} className="font-bold text-zinc-800 tracking-[0.22em] uppercase">Filters</p>
                <button onClick={resetFilters} style={{fontSize:'9px'}} className="font-bold text-zinc-400 hover:text-[#C9A14A] transition-colors uppercase tracking-widest">
                    Reset All
                </button>
            </div>

            {/* Price Slider */}
            <div>
                <p style={{fontSize:'9px'}} className="font-bold uppercase text-zinc-400 tracking-[0.22em] mb-2 border-t border-zinc-100 pt-3">Price Range</p>
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
                <p style={{fontSize:'9px'}} className="font-bold uppercase text-zinc-400 tracking-[0.22em] mb-2 border-t border-zinc-100 pt-3">Carat</p>
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
            <div className="border-t border-zinc-100 pt-3">
                <FilterGroup title="Shape" options={shapes} selected={selectedShapes} onToggle={(val) => toggleFilter(setSelectedShapes, shapes, val)} />
            </div>

            {/* Cut Toggle */}
            <div className="border-t border-zinc-100 pt-3">
                <FilterGroup title="Cut" options={cuts} selected={selectedCuts} onToggle={(val) => toggleFilter(setSelectedCuts, cuts, val)} />
            </div>

            {/* Clarity Toggle */}
            <div className="border-t border-zinc-100 pt-3">
                <FilterGroup title="Clarity" options={clarities} selected={selectedClarities} onToggle={(val) => toggleFilter(setSelectedClarities, clarities, val)} />
            </div>

            {/* Color Toggle */}
            <div className="border-t border-zinc-100 pt-3">
                <FilterGroup title="Color" options={colors} selected={selectedColors} onToggle={(val) => toggleFilter(setSelectedColors, colors, val)} />
            </div>

            {/* Certification Toggle */}
            <div className="border-t border-zinc-100 pt-3">
                <FilterGroup title="Certification" options={certs} selected={selectedCerts} onToggle={(val) => toggleFilter(setSelectedCerts, certs, val)} />
            </div>
        </div>
    );

    return (
        <div className="py-6 lg:py-10 flex flex-col lg:flex-row gap-5 lg:gap-8 text-zinc-800">

            {/* ── MOBILE: filter button + drawer ── */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 text-zinc-800 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-50 transition-colors"
                >
                    <SlidersHorizontal size={14} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-1 bg-[#C9A14A] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
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
                                className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[200]"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-[201] bg-white rounded-t-[24px] border-t border-zinc-200 overflow-y-auto custom-scrollbar"
                            >
                                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-zinc-100">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-800">Filters</p>
                                    <button onClick={() => setIsMobileFilterOpen(false)} className="text-zinc-400 hover:text-[#C9A14A] transition-colors p-1">
                                        <XIcon size={18} />
                                    </button>
                                </div>
                                <div className="p-4">
                                    {FilterPanelContent}
                                </div>
                                <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-5 py-4">
                                    <button
                                        onClick={() => setIsMobileFilterOpen(false)}
                                        className="w-full py-3 bg-[#C9A14A] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-colors"
                                    >
                                        Show {totalCount} Results
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* ── DESKTOP: sticky sidebar ── */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
                <div className="sticky top-28 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                    {FilterPanelContent}
                </div>
            </aside>

            {/* RESULTS SECTION */}
            <div className="flex-1">
                <AnimatedSection as="div" className="flex justify-between items-end mb-4 border-b border-zinc-100 pb-3">
                    <h2 style={{fontSize: '18px'}} className="font-medium text-zinc-950 tracking-wide font-serif">Search Results</h2>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-[0.06em]">{totalCount} Diamonds Found</span>
                </AnimatedSection>

                {/* GRID RESULTS */}
                <div className="w-full relative min-h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="luxury-shell text-center rounded-xl p-3 border border-zinc-200 bg-white animate-pulse overflow-hidden">
                                        <div className="h-24 w-full mb-3 rounded-lg bg-zinc-100" />
                                        <div className="h-3 w-3/4 mx-auto mb-2 bg-zinc-200 rounded" />
                                        <div className="h-3 w-1/2 mx-auto mb-3 bg-zinc-100 rounded" />
                                        <div className="h-7 w-full rounded-md bg-zinc-100" />
                                    </div>
                            ))}
                        </div>
                    ) : diamonds.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ staggerChildren: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            <AnimatePresence>
                                {diamonds.map((diamond, index) => (
                                    <motion.div
                                        key={diamond.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group luxury-shell p-3.5 border border-zinc-100 transition-all duration-300 ease-out flex flex-col items-center relative overflow-hidden rounded-xl bg-white hover:shadow-md hover:border-zinc-200"
                                    >
                                        <Link 
                                            href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}
                                            className="relative block aspect-square w-full bg-zinc-50 mb-3 z-10 flex items-center justify-center p-2 rounded-lg overflow-hidden border border-zinc-100"
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

                                        <div className="text-center w-full px-1 z-10">
                                            <Link href={`/diamonds/${diamond.id}${customizerMode ? '?mode=customizer' : ''}`}>
                                                <p className="font-serif font-medium text-zinc-900 text-sm mb-0.5 z-10 leading-tight hover:text-[#C9A14A] transition-colors">{diamond.caratWeight.toFixed(2)} Carat {diamond.shape}</p>
                                            </Link>
                                            <p className="text-[11px] text-zinc-400 mb-2.5 z-10 font-normal leading-tight">{diamond.color} · {diamond.clarity} · {diamond.cut}</p>
                                        </div>

                                        <div className="flex justify-between items-center w-full mb-3 px-1 z-10">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{diamond.certification}</span>
                                            <span className="text-[13px] font-bold text-zinc-900">{formatPrice(diamond.price)}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full z-10 text-[10px] py-2 rounded-md bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors duration-300"
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-dashed border-zinc-200">
                            <h3 className="text-xl font-serif text-zinc-900 mb-2 font-medium">No Diamonds Found</h3>
                            <p className="text-zinc-500 max-w-md mx-auto mb-6 text-sm">We couldn&apos;t find any diamonds matching those exact specifications. Try broadening your filter criteria.</p>
                            <Button onClick={resetFilters} className="bg-zinc-900 text-white hover:bg-[#C9A14A]">Reset All Filters</Button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="mt-12 flex justify-center gap-2">
                        <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-50" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                        <span className="flex items-center px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
                        <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-50" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
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
            <p style={{fontSize:'9px'}} className="font-bold uppercase text-zinc-400 tracking-[0.22em] mb-1.5">{title}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                    const isActive = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => onToggle(opt)}
                            style={{fontSize:'9.5px'}}
                            className={`px-2 py-1 font-semibold border transition-all rounded-md tracking-wider ${isActive ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
