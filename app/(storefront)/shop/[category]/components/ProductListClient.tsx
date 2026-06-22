"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { FadeIn } from "@/components/FadeIn";
import { selectCardImage } from "@/lib/image-utils";
import { Button } from "@/components/Button";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    images: string;
    categoryId: string;
    metalType: string;
    karatPrices: string | null;
    stockCount: number;
}

interface ProductListClientProps {
    initialProducts: Product[];
    totalCount: number;
    categorySlug: string;
    limit: number;
}

export function ProductListClient({
    initialProducts,
    totalCount,
    categorySlug,
    limit,
}: ProductListClientProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const hasMore = products.length < totalCount;

    const loadMoreProducts = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const response = await fetch(
                `/api/products?category=${categorySlug}&page=${nextPage}&limit=${limit}`
            );
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.products) {
                    const newProducts = data.products.map((p: any) => ({
                        ...p,
                        images: Array.isArray(p.images) ? JSON.stringify(p.images) : p.images,
                    }));
                    setProducts((prev) => [...prev, ...newProducts]);
                    setPage(nextPage);
                }
            }
        } catch (error) {
            console.error("Failed to load more products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const usedProductImages = new Set<string>();

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 lg:gap-10">
                {products.map((product, i) => {
                    const image = selectCardImage(
                        product.images,
                        usedProductImages,
                        "jewelry",
                        i,
                        product.id,
                        product.slug || product.name
                    );

                    let displayPrice = product.price;
                    let showFrom = false;
                    try {
                        const kp: Record<string, number> = JSON.parse(product.karatPrices || "{}");
                        const values = Object.values(kp).filter(
                            (v): v is number => typeof v === "number" && v > 0
                        );
                        if (values.length > 0) {
                            displayPrice = Math.min(...values);
                            showFrom = true;
                        }
                    } catch {}

                    return (
                        <FadeIn key={product.id} delay={(i % 8) * 0.05} className="group cursor-pointer">
                            <Link href={`/product/${product.slug}`} className="block h-full">
                                <div className="h-full flex flex-col rounded-none md:rounded-[4px] overflow-hidden bg-white border-0 md:border border-zinc-150/85 shadow-none hover:shadow-sm transition-all duration-300">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50 mb-3 border-b border-zinc-100/50 rounded-none md:rounded-[4px]">
                                        <SmartImage
                                            src={image}
                                            alt={product.name}
                                            fill
                                            fallbackType="jewelry"
                                            className="object-cover image-zoom-reveal transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                            priority={i < 4}
                                        />
                                        
                                        {/* Small Badge Top-Left */}
                                        {i % 4 === 1 && (
                                            <span className="absolute top-2 left-2 z-10 text-[7px] tracking-wider uppercase font-bold text-white bg-[#C9A14A] px-1.5 py-0.5 rounded-none">
                                                Award Winning
                                            </span>
                                        )}
                                        {i % 4 === 3 && (
                                            <span className="absolute top-2 left-2 z-10 text-[7px] tracking-wider uppercase font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded-none">
                                                Most Loved
                                            </span>
                                        )}

                                        {/* Heart Icon Top-Right */}
                                        <button
                                            className="absolute top-2 right-2 z-10 text-zinc-400 hover:text-red-500 transition-colors p-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                toast.success("Added to wishlist!");
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                        </button>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-40 md:block hidden" />
                                        <span className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.24em] font-bold text-[#C9A14A] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/90 px-2.5 py-1 rounded-full shadow-sm md:block hidden">
                                            View Details
                                        </span>
                                    </div>
                                    <div className="text-center pb-3 px-2">
                                        {/* 1. Price */}
                                        <p className="text-[18px] font-semibold tracking-tight text-zinc-900 mb-1">
                                            {showFrom && (
                                                <span className="text-[13px] text-zinc-500 font-normal mr-1 normal-case tracking-normal">
                                                    From
                                                </span>
                                            )}
                                            ₹{displayPrice.toLocaleString("en-IN")}
                                        </p>

                                        {/* 2. Title */}
                                        <h3 className="text-[14px] md:text-[17px] font-sans font-medium text-zinc-900 mb-1.5 line-clamp-1 group-hover:text-[#C9A14A] transition-colors duration-500">
                                            {product.name}
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        </FadeIn>
                    );
                })}

                {/* Shimmer card skeletons while loading pages */}
                {isLoading &&
                    Array.from({ length: limit }).map((_, idx) => (
                        <div
                            key={`skeleton-${idx}`}
                            className="animate-pulse flex flex-col bg-white border border-zinc-100 rounded-none md:rounded-[4px] p-2 md:p-4"
                        >
                            <div className="aspect-[4/5] bg-zinc-100 mb-3 relative overflow-hidden rounded-none md:rounded-[4px]" />
                            <div className="h-3 bg-zinc-200 w-2/3 mb-2 mx-auto" />
                            <div className="h-3 bg-zinc-100 w-1/3 mb-4 mx-auto" />
                        </div>
                    ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-16">
                    <Button
                        variant="outline"
                        onClick={loadMoreProducts}
                        disabled={isLoading}
                        className="px-10 py-4 text-[12px] uppercase tracking-[0.2em] font-semibold border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white min-w-[200px]"
                    >
                        {isLoading ? "Loading..." : "Load More Designs"}
                    </Button>
                </div>
            )}
        </div>
    );
}
