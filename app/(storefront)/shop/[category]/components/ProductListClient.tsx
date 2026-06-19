"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { FadeIn } from "@/components/FadeIn";
import { selectCardImage } from "@/lib/image-utils";
import { Button } from "@/components/Button";

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
                        // Convert parsed images array back to string to remain compatible with selectCardImage signature
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                {products.map((product, i) => {
                    const image = selectCardImage(
                        product.images,
                        usedProductImages,
                        "jewelry",
                        i,
                        product.id,
                        product.slug || product.name
                    );

                    // Determine display price: show lowest karat price if set
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
                                <div className="h-full flex flex-col luxury-shell premium-hover-lift rounded-[22px] overflow-hidden bg-white border border-zinc-100 shadow-sm">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50 mb-5 border-b border-zinc-100">
                                        <SmartImage
                                            src={image}
                                            alt={product.name}
                                            fill
                                            fallbackType="jewelry"
                                            className="object-cover image-zoom-reveal transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                            priority={i < 4}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-40" />
                                        <span className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.24em] font-bold text-[#C9A14A] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/90 px-2.5 py-1 rounded-full shadow-sm">
                                            View Details
                                        </span>
                                    </div>
                                    <div className="text-center pb-5 px-4">
                                        <h3 className="text-[16px] md:text-[17px] font-medium text-zinc-900 mb-2 line-clamp-1 group-hover:text-[#C9A14A] transition-colors duration-500 font-serif">
                                            {product.name}
                                        </h3>
                                        <p className="text-[14px] text-zinc-600 font-semibold">
                                            {showFrom && (
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest mr-1">
                                                    From
                                                </span>
                                            )}
                                            ₹{displayPrice.toLocaleString("en-IN")}
                                        </p>
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
                            className="animate-pulse flex flex-col overflow-hidden luxury-shell rounded-[22px] p-4 border border-zinc-100 bg-white shadow-sm"
                        >
                            <div className="aspect-[4/5] bg-zinc-100 mb-5 relative overflow-hidden rounded-[16px]" />
                            <div className="h-4 bg-zinc-200 w-2/3 mb-2 mx-auto" />
                            <div className="h-4 bg-zinc-100 w-1/3 mb-5 mx-auto" />
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
