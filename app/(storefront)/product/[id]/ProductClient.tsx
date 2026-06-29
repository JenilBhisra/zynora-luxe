/* eslint-disable */
"use client";

import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Play, Truck, X, Check, AlertCircle } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { saveCheckoutIntent } from "@/lib/checkout-intent";
import { SmartImage } from "@/components/SmartImage";
import { getOrderedMedia } from "@/lib/media-utils";
import { ErrorBoundary } from "react-error-boundary";
import dynamic from "next/dynamic";

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

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;

const ModelFallback = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 p-6 text-center select-none">
        <span className="text-xs uppercase tracking-widest text-[#C9A14A] font-bold mb-2">3D Preview Unavailable</span>
        <span className="text-[10px] text-zinc-500">Could not initialize 3D canvas</span>
    </div>
);

const VideoFallback = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 p-6 text-center select-none">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Video Preview Unavailable</span>
        <span className="text-[10px] text-zinc-400">Unable to load media stream</span>
    </div>
);

export default function ProductClient({ product }: { product: any }) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxImage(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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

    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Form state
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [jewelrySize, setJewelrySize] = useState("");
    const [metalType, setMetalType] = useState(product.metalType || "18K White Gold");
    const [stoneType, setStoneType] = useState("Natural Diamond");
    const [stoneSize, setStoneSize] = useState("1.00 Carat");
    const [engraving, setEngraving] = useState("");
    const [requirements, setRequirements] = useState("");

    // Sync auth user data when user changes
    useEffect(() => {
        if (user) {
            setCustomerName(prev => prev || user.displayName || "");
            setCustomerEmail(prev => prev || user.email || "");
            setCustomerPhone(prev => prev || user.phoneNumber || "");
        }
    }, [user]);

    const handleCustomizationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!customerName.trim()) {
            errors.customerName = "Name is required.";
        }
        if (!customerEmail.trim()) {
            errors.customerEmail = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            errors.customerEmail = "Please enter a valid email address.";
        }
        if (!customerPhone.trim()) {
            errors.customerPhone = "WhatsApp / phone number is required.";
        }
        if (!requirements.trim()) {
            errors.requirements = "Please specify your customization requests.";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            const response = await fetch("/api/customization-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku || product.diamondId || product.id,
                    productPrice: displayPrice,
                    productUrl: typeof window !== "undefined" ? window.location.href : "",
                    customerName,
                    customerEmail,
                    customerPhone,
                    jewelrySize,
                    metalType,
                    stoneType,
                    stoneSize,
                    engraving,
                    requirements,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit request.");
            }

            setSubmitSuccess(true);
        } catch (err) {
            console.error(err);
            setFormErrors({ submit: "An error occurred while submitting. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Parse karat prices from product
    const karatPricesMap: Record<string, number> = (() => {
        try { return JSON.parse(product.karatPrices || "{}"); } catch { return {}; }
    })();

    const enabledMetals = product.availableMetals 
        ? product.availableMetals.split(",").map((m: string) => m.trim().toLowerCase()) 
        : ["gold"];

    const enabledFinishes: string[] = [];
    if (enabledMetals.includes("gold") || enabledMetals.length === 0) {
        enabledFinishes.push("Yellow Gold", "White Gold", "Rose Gold");
    }
    if (enabledMetals.includes("silver")) {
        enabledFinishes.push("Silver");
    }
    if (enabledMetals.includes("platinum")) {
        enabledFinishes.push("Platinum");
    }
    if (enabledFinishes.length === 0) {
        enabledFinishes.push("Yellow Gold", "White Gold", "Rose Gold");
    }

    const initialFinish = enabledFinishes.find(f => {
        const pmt = (product.metalType || "").toLowerCase();
        if (pmt.includes("yellow")) return f === "Yellow Gold";
        if (pmt.includes("white")) return f === "White Gold";
        if (pmt.includes("rose")) return f === "Rose Gold";
        if (pmt.includes("silver")) return f === "Silver";
        if (pmt.includes("platinum")) return f === "Platinum";
        return false;
    }) || enabledFinishes[0];

    const [selectedFinish, setSelectedFinish] = useState<string>(initialFinish);

    const allPossibleKarats = ["10K", "14K", "18K", "22K"] as const;
    const definedKarats = allPossibleKarats.filter(k => karatPricesMap[k] !== undefined && karatPricesMap[k] !== null);
    const availableKarats = definedKarats.length > 0 ? definedKarats : allPossibleKarats;

    const [selectedKarat, setSelectedKarat] = useState<string>(availableKarats[0] || "18K");

    const isGold = ["Yellow Gold", "White Gold", "Rose Gold"].includes(selectedFinish);

    const getDisplayPrice = () => {
        if (isGold) {
            if (selectedKarat && karatPricesMap[selectedKarat] !== undefined && karatPricesMap[selectedKarat] !== null && karatPricesMap[selectedKarat] > 0) {
                return karatPricesMap[selectedKarat];
            }
            if (product.goldPrice !== null && product.goldPrice !== undefined && product.goldPrice > 0) {
                return product.goldPrice;
            }
            return product.price || 0;
        } else if (selectedFinish === "Silver") {
            if (product.silverPrice !== null && product.silverPrice !== undefined && product.silverPrice > 0) {
                return product.silverPrice;
            }
            return product.price || 0;
        } else if (selectedFinish === "Platinum") {
            if (product.platinumPrice !== null && product.platinumPrice !== undefined && product.platinumPrice > 0) {
                return product.platinumPrice;
            }
            return product.price || 0;
        }
        return product.price || 0;
    };
    const displayPrice = getDisplayPrice();

    const finalMetalType = isGold ? `${selectedKarat} ${selectedFinish}` : selectedFinish;

    useEffect(() => {
        setMetalType(finalMetalType);
    }, [finalMetalType]);

    const getAvailableOptions = () => {
        const options: string[] = [];
        if (enabledMetals.includes("gold") || enabledMetals.length === 0) {
            availableKarats.forEach(k => {
                options.push(`${k} Yellow Gold`, `${k} White Gold`, `${k} Rose Gold`);
            });
        }
        if (enabledMetals.includes("silver")) {
            options.push("Silver");
        }
        if (enabledMetals.includes("platinum")) {
            options.push("Platinum");
        }
        return options;
    };
    const availableOptions = getAvailableOptions();

    const orderedMedia = getOrderedMedia({ images: product.images });
    const mediaItems = orderedMedia.map((item) => ({
        src: item.url,
        type: item.type === "model3d" ? ("3d" as const) : item.type === "image" ? ("image" as const) : ("video" as const),
    }));
    const imageItems = mediaItems.filter((item) => item.type === "image");

    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const activeMedia = mediaItems[activeMediaIndex];
    const activeImage = imageItems[0]?.src || "";
    const imageFallbackType: "ring" | "diamond" | "jewelry" = product.category?.name?.toLowerCase().includes("diamond")
        ? "diamond"
        : product.category?.name?.toLowerCase().includes("ring")
            ? "ring"
            : "jewelry";

    const goToPrevMedia = () => {
        if (mediaItems.length <= 1) return;
        setActiveMediaIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    };

    const goToNextMedia = () => {
        if (mediaItems.length <= 1) return;
        setActiveMediaIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    };

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: displayPrice,
            quantity: 1,
            image: activeImage,
            metalType: finalMetalType,
            sku: product.sku || null
        });
    };

    const handleBuyNow = () => {
        const item = {
            id: product.id,
            name: product.name,
            price: displayPrice,
            quantity: 1,
            image: activeImage,
            metalType: finalMetalType,
            sku: product.sku || null
        };

        if (!user) {
            saveCheckoutIntent({
                source: "single-product",
                item,
                createdAt: Date.now(),
            });
            router.push("/login?redirect=/checkout&message=checkout_required");
            return;
        }

        addToCart(item);
        router.push("/checkout");
    };

    return (
        <div className="min-h-screen pb-24 md:pb-32 font-body text-zinc-900 bg-white">
            {/* Breadcrumb */}
            <div className="container-custom py-6 text-[12px] text-zinc-500 tracking-[0.06em] uppercase font-medium">
                <span className="hover:text-[#C9A14A] cursor-pointer transition-colors">Home</span> <span className="mx-2 text-zinc-300">/</span>
                <span className="hover:text-[#C9A14A] cursor-pointer transition-colors">{product.category?.name || "Rings"}</span> <span className="mx-2 text-zinc-300">/</span>
                <span className="text-zinc-900">{product.name}</span>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8 mb-24 relative">
                {/* Left: Gallery (Brilliant Earth 2-column Grid) */}
                <section className="w-full lg:w-[65%] flex flex-col gap-4">
                    {/* Desktop Grid Layout */}
                    <div className="hidden md:grid grid-cols-2 gap-2 md:gap-3 w-full">
                        {mediaItems.map((item, idx) => (
                            <FadeIn 
                                key={`${item.src}-${idx}`} 
                                className={`relative aspect-square w-full overflow-hidden flex items-center justify-center group ${
                                    mediaItems.length === 1 ? "md:col-span-2" : ""
                                }`}
                            >
                                {item.type === "image" ? (
                                    <div 
                                        className="w-full h-full relative cursor-zoom-in"
                                        onDoubleClick={() => setLightboxImage(item.src)}
                                    >
                                        <SmartImage
                                            src={item.src}
                                            alt={product.name}
                                            fill
                                            fallbackType={imageFallbackType}
                                            imageKey={`${product.id}:grid:${idx}`}
                                            sizeType="detail"
                                            priority={idx === 0}
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                        />
                                    </div>
                                ) : item.type === "video" ? (
                                    videoErrors[item.src] ? (
                                        <VideoFallback />
                                    ) : (
                                        <video
                                            src={item.src}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="auto"
                                            onError={() => setVideoErrors(prev => ({ ...prev, [item.src]: true }))}
                                        />
                                    )
                                ) : (
                                    <div className="relative w-full h-full">
                                        <ErrorBoundary fallback={<ModelFallback />}>
                                            <ModelCanvas url={item.src} />
                                        </ErrorBoundary>
                                    </div>
                                )}
                            </FadeIn>
                        ))}
                        {mediaItems.length === 0 && (
                            <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center col-span-2">
                                <SmartImage
                                    src=""
                                    alt={product.name}
                                    fill
                                    fallbackType={imageFallbackType}
                                    imageKey={product.id}
                                    className="object-contain p-4"
                                />
                            </div>
                        )}
                    </div>

                    {/* Mobile Carousel / Thumbnail Selection */}
                    <div className="block md:hidden w-full">
                        <div 
                            className="relative aspect-square w-full overflow-hidden flex items-center justify-center rounded-none cursor-zoom-in"
                            onDoubleClick={() => {
                                if (mediaItems[activeMediaIndex]?.type === "image") {
                                    setLightboxImage(mediaItems[activeMediaIndex].src);
                                }
                            }}
                        >
                            {mediaItems.length > 0 ? (
                                mediaItems[activeMediaIndex].type === "image" ? (
                                    <SmartImage
                                        src={mediaItems[activeMediaIndex].src}
                                        alt={product.name}
                                        fill
                                        fallbackType={imageFallbackType}
                                        imageKey={`${product.id}:mobile-main`}
                                        sizeType="detail"
                                        priority={true}
                                        className="object-cover transition-transform duration-700 ease-out"
                                    />
                                ) : mediaItems[activeMediaIndex].type === "video" ? (
                                    videoErrors[mediaItems[activeMediaIndex].src] ? (
                                        <VideoFallback />
                                    ) : (
                                        <video
                                            src={mediaItems[activeMediaIndex].src}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="auto"
                                            onError={() => setVideoErrors(prev => ({ ...prev, [mediaItems[activeMediaIndex].src]: true }))}
                                        />
                                    )
                                ) : (
                                    <div className="relative w-full h-full">
                                        <ErrorBoundary fallback={<ModelFallback />}>
                                            <ModelCanvas url={mediaItems[activeMediaIndex].src} />
                                        </ErrorBoundary>
                                    </div>
                                )
                            ) : (
                                <SmartImage
                                    src=""
                                    alt={product.name}
                                    fill
                                    fallbackType={imageFallbackType}
                                    imageKey={product.id}
                                    className="object-contain p-4"
                                />
                            )}
                        </div>

                        {/* Mobile thumbnails scroll bar */}
                        {mediaItems.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto py-3 px-1 mt-2 scrollbar-none">
                                {mediaItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveMediaIndex(idx)}
                                        className={`relative w-16 h-12 flex-shrink-0 bg-[#FAF8F4] overflow-hidden border transition-all ${
                                            activeMediaIndex === idx
                                                ? "border-[#C9A14A] ring-1 ring-[#C9A14A]/25"
                                                : "border-zinc-200"
                                        } rounded-none`}
                                    >
                                        {item.type === "image" ? (
                                            <SmartImage
                                                src={item.src}
                                                alt={`Thumbnail ${idx}`}
                                                fill
                                                fallbackType={imageFallbackType}
                                                imageKey={`${product.id}:mobile-thumb:${idx}`}
                                                sizeType="thumbnail"
                                                className="object-contain p-1"
                                            />
                                        ) : item.type === "video" ? (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[10px] text-zinc-500 font-bold uppercase">
                                                Video
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[9px] text-[#C9A14A] font-bold uppercase">
                                                3D Model
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Right: Details (Scrollable Flow) */}
                <section className="w-full lg:w-[35%] pt-4 lg:sticky lg:top-24 flex flex-col">
                    <FadeIn delay={0.2}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[11px] md:text-xs tracking-[0.34em] font-semibold text-[#C9A14A] uppercase">Product Detail</span>
                            {product.diamondType && (
                                <>
                                    <span className="text-zinc-300">|</span>
                                    <span className="text-[10px] md:text-[11px] tracking-[0.18em] font-bold text-zinc-500 uppercase">{product.diamondType}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-[22px] md:text-3xl lg:text-[34px] font-serif font-medium text-zinc-900 tracking-wide mb-6 max-w-[640px]">
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-6 mb-8 border-b border-zinc-200 pb-6">
                            <span className="text-[18px] md:text-[28px] font-medium text-zinc-900">₹{displayPrice.toLocaleString("en-IN")}</span>
                            <span className="text-[11px] md:text-[12px] uppercase tracking-[0.06em] text-zinc-400">Inclusive of all taxes</span>
                        </div>

                        {/* Selectors */}
                        <div className="flex flex-col gap-6 mb-10">
                            {/* Metal Finish Selector */}
                            <div className="w-full">
                                <label className="block text-[11px] md:text-[12px] tracking-[0.34em] font-medium text-zinc-500 uppercase mb-3">Select Metal Finish</label>
                                <div className="relative">
                                    <select 
                                        value={selectedFinish}
                                        onChange={(e) => setSelectedFinish(e.target.value)}
                                        className="w-full p-4 rounded-none border border-zinc-200 bg-white text-zinc-900 appearance-none focus:outline-none focus:border-[#C9A14A] transition-colors cursor-pointer text-[14px]"
                                    >
                                        {enabledFinishes.map((finish) => (
                                            <option key={finish} value={finish}>{finish}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Gold Karat Selector */}
                            {isGold && availableKarats.length > 0 && (
                                <div className="w-full">
                                    <label className="block text-[11px] md:text-[12px] tracking-[0.34em] font-medium text-zinc-500 uppercase mb-3">Select Gold Karat</label>
                                    <div className="flex flex-wrap gap-3">
                                        {availableKarats.map((k) => (
                                            <button
                                                key={k}
                                                onClick={() => setSelectedKarat(k)}
                                                className={`relative px-5 py-3 text-[13px] font-bold tracking-[0.18em] uppercase transition-all duration-300 rounded-none border ${
                                                    selectedKarat === k
                                                        ? "bg-[#C9A14A] text-white border-[#C9A14A] shadow-sm"
                                                        : "bg-white text-zinc-800 border-zinc-200 hover:border-[#C9A14A]/50 hover:text-[#C9A14A]"
                                                }`}
                                            >
                                                {k}
                                                {karatPricesMap[k] !== undefined && karatPricesMap[k] !== null && karatPricesMap[k] > 0 && (
                                                    <span className={`block text-[10px] font-medium mt-0.5 ${
                                                        selectedKarat === k ? "text-white/85" : "text-zinc-400"
                                                    }`}>
                                                        ₹{karatPricesMap[k].toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Description with Learn More */}
                        {product.description && (
                            <div className="mb-8 border-t border-zinc-100 pt-6">
                                <div 
                                    className={`text-[14.5px] md:text-[15.5px] font-normal text-zinc-500 max-w-[640px] leading-relaxed transition-all duration-300 ${
                                        isDescExpanded ? "" : "line-clamp-2"
                                    }`}
                                    style={{ whiteSpace: "pre-line" }}
                                >
                                    {product.description}
                                </div>
                                <button
                                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                                    className="mt-2.5 text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-[#C9A14A] hover:text-[#111] transition-colors"
                                >
                                    {isDescExpanded ? "SHOW LESS" : "LEARN MORE"}
                                </button>
                            </div>
                        )}

                        {/* Delivery Info */}
                        <div className="flex items-center gap-5 p-0 md:luxury-panel md:p-5 mb-8 relative overflow-hidden rounded-none border-0 md:border md:border-zinc-200">
                            <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center shrink-0 bg-zinc-50">
                                <Truck className="text-[#C9A14A]" size={18} strokeWidth={1.5} />
                            </div>
                            <span className="text-[14px] text-zinc-500 leading-snug">
                                <strong className="block text-zinc-900 font-medium mb-1 tracking-wide">Guaranteed Delivery</strong>
                                Delivered within 7-10 working days across India via insured shipping.
                            </span>
                        </div>

                        {/* Inventory Status Alert */}
                        {product.stockCount <= 0 ? (
                            <div className="mb-8 p-4 rounded-none border border-red-200 bg-red-50 text-center">
                                <span className="text-red-700 font-bold uppercase tracking-widest text-xs">Out of Stock</span>
                            </div>
                        ) : product.stockCount < 5 ? (
                            <div className="mb-8 p-4 rounded-none border border-amber-200 bg-amber-50 text-center">
                                <span className="text-amber-700 font-bold uppercase tracking-widest text-xs">
                                    Hurry! Only {product.stockCount} {product.stockCount === 1 ? 'piece' : 'pieces'} left in stock
                                </span>
                            </div>
                        ) : null}

                        {/* Add to Cart Actions (Normal scrolling) */}
                        <div ref={normalBtnRef} className="flex flex-col gap-4 z-40 p-0 border-0 shadow-none bg-transparent md:luxury-panel md:p-5 md:border md:border-zinc-200 md:shadow-md md:rounded-[4px] md:bg-white">
                            <Button fullWidth onClick={handleAddToCart} disabled={product.stockCount <= 0} className="py-4 text-[13px] md:text-[14px] tracking-[0.1em] bg-[#C9A14A] text-white border-[#C9A14A] hover:bg-black hover:border-black disabled:opacity-50 disabled:cursor-not-allowed rounded-none md:rounded-[4px]">
                                {product.stockCount <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
                            </Button>
                            <Button variant="outline" fullWidth onClick={handleBuyNow} disabled={product.stockCount <= 0} className="py-4 text-[13px] md:text-[14px] tracking-[0.1em] border-zinc-300 text-zinc-900 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-none md:rounded-[4px]">
                                BUY NOW
                            </Button>
                            <Button variant="outline" fullWidth onClick={() => setIsCustomizing(true)} className="py-4 text-[13px] md:text-[14px] tracking-[0.1em] border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-300 rounded-none md:rounded-[4px]">
                                ✨ Customize This Design
                            </Button>
                        </div>
                    </FadeIn>
                </section>
            </div>

            {/* Mobile Sticky CTA Bar */}
            {showStickyBottomBar && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-50 flex gap-2 md:hidden shadow-lg animate-in slide-in-from-bottom duration-300">
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stockCount <= 0}
                        className="flex-grow py-3.5 text-[13px] font-bold uppercase tracking-widest bg-[#C9A14A] text-white border border-[#C9A14A] disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                    >
                        {product.stockCount <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                    <button
                        onClick={() => setIsCustomizing(true)}
                        className="px-5 py-3.5 text-[13px] font-bold uppercase tracking-widest border border-zinc-300 text-zinc-800 bg-white rounded-none"
                    >
                        Customize
                    </button>
                </div>
            )}
                      {/* Customization Request Modal Overlay */}
            {isCustomizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/80 backdrop-blur-md overflow-y-auto">
                    <div className="relative w-full max-w-2xl my-8 bg-white border border-zinc-200 rounded-none md:rounded-[4px] p-6 md:p-8 shadow-2xl text-zinc-900 overflow-hidden">
                        {/* Top gold line accent */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9A14A] to-transparent" />
                        
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setIsCustomizing(false);
                                setSubmitSuccess(false);
                            }}
                            className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={24} />
                        </button>

                        {!submitSuccess ? (
                            <div>
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl md:text-3xl font-heading text-[#C9A14A] tracking-wide uppercase">Bespoke Design Customization</h3>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Personalize your Zynora Luxe jewelry design</p>
                                </div>

                                <form onSubmit={handleCustomizationSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Auto-filled Product Info */}
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-4 space-y-2">
                                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#C9A14A] font-bold">Selected Design Details</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                            <div>
                                                <span className="text-xs text-zinc-500 block">Product ID:</span>
                                                <span className="text-sm font-medium text-zinc-800">{product.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-zinc-500 block">Design Name:</span>
                                                <span className="text-sm font-medium text-[#C9A14A]">{product.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-zinc-500 block">Estimated Starting Price:</span>
                                                <span className="text-sm font-medium text-zinc-800">₹{displayPrice.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-zinc-500 block">Metal Purity:</span>
                                                <span className="text-sm font-medium text-zinc-800">{finalMetalType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm uppercase tracking-wider text-zinc-850 border-b border-zinc-200 pb-2 font-semibold font-heading">Your Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label htmlFor="customerName" className="block text-xs uppercase tracking-widest text-zinc-650">Full Name *</label>
                                                <input
                                                    type="text"
                                                    id="customerName"
                                                    value={customerName}
                                                    onChange={(e) => {
                                                        setCustomerName(e.target.value);
                                                        if (formErrors.customerName) {
                                                            setFormErrors(prev => ({ ...prev, customerName: "" }));
                                                        }
                                                    }}
                                                    className={`w-full bg-zinc-50 border ${formErrors.customerName ? 'border-red-300' : 'border-zinc-200'} rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors`}
                                                    placeholder="Enter your full name"
                                                />
                                                {formErrors.customerName && <span className="text-xs text-red-500 block">{formErrors.customerName}</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <label htmlFor="customerEmail" className="block text-xs uppercase tracking-widest text-zinc-650">Email Address *</label>
                                                <input
                                                    type="email"
                                                    id="customerEmail"
                                                    value={customerEmail}
                                                    onChange={(e) => {
                                                        setCustomerEmail(e.target.value);
                                                        if (formErrors.customerEmail) {
                                                            setFormErrors(prev => ({ ...prev, customerEmail: "" }));
                                                        }
                                                    }}
                                                    className={`w-full bg-zinc-50 border ${formErrors.customerEmail ? 'border-red-300' : 'border-zinc-200'} rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors`}
                                                    placeholder="Enter your email address"
                                                />
                                                {formErrors.customerEmail && <span className="text-xs text-red-500 block">{formErrors.customerEmail}</span>}
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label htmlFor="customerPhone" className="block text-xs uppercase tracking-widest text-zinc-650">WhatsApp / Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    id="customerPhone"
                                                    value={customerPhone}
                                                    onChange={(e) => {
                                                        setCustomerPhone(e.target.value);
                                                        if (formErrors.customerPhone) {
                                                            setFormErrors(prev => ({ ...prev, customerPhone: "" }));
                                                        }
                                                    }}
                                                    className={`w-full bg-zinc-50 border ${formErrors.customerPhone ? 'border-red-300' : 'border-zinc-200'} rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors`}
                                                    placeholder="Enter your contact number"
                                                />
                                                {formErrors.customerPhone && <span className="text-xs text-red-500 block">{formErrors.customerPhone}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customization Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm uppercase tracking-wider text-zinc-850 border-b border-zinc-200 pb-2 font-semibold font-heading">Customization Selections</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="block text-xs uppercase tracking-widest text-zinc-650">Metal Finish</label>
                                                <div className="relative">
                                                    <select
                                                        value={metalType}
                                                        onChange={(e) => setMetalType(e.target.value)}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors appearance-none cursor-pointer"
                                                     >
                                                        {availableOptions.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs uppercase tracking-widest text-zinc-650">Jewelry Size</label>
                                                <input
                                                    type="text"
                                                    value={jewelrySize}
                                                    onChange={(e) => setJewelrySize(e.target.value)}
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors"
                                                    placeholder="e.g. Ring Size 6, Chain length 18 in"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs uppercase tracking-widest text-zinc-650">Stone Type</label>
                                                <div className="relative">
                                                    <select
                                                        value={stoneType}
                                                        onChange={(e) => setStoneType(e.target.value)}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors appearance-none cursor-pointer"
                                                    >
                                                        <option value="Natural Diamond">Natural Diamond</option>
                                                        <option value="Lab-Grown Diamond">Lab-Grown Diamond</option>
                                                        <option value="Moissanite">Moissanite</option>
                                                        <option value="Sapphire">Blue Sapphire</option>
                                                        <option value="Emerald">Emerald</option>
                                                        <option value="Ruby">Ruby</option>
                                                        <option value="No Stone">No Stone / Plain Metal</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs uppercase tracking-widest text-zinc-650">Stone Size</label>
                                                <div className="relative">
                                                    <select
                                                        value={stoneSize}
                                                        onChange={(e) => setStoneSize(e.target.value)}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors appearance-none cursor-pointer"
                                                    >
                                                        <option value="0.50 Carat">0.50 Carat</option>
                                                        <option value="0.75 Carat">0.75 Carat</option>
                                                        <option value="1.00 Carat">1.00 Carat</option>
                                                        <option value="1.50 Carat">1.50 Carat</option>
                                                        <option value="2.00 Carat">2.00 Carat</option>
                                                        <option value="3.00 Carat+">3.00 Carat+</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                                </div>
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-xs uppercase tracking-widest text-zinc-650">Engraving Inscription</label>
                                                    <span className={`text-[10px] ${engraving.length >= 30 ? 'text-red-500 font-bold' : 'text-zinc-400'}`}>
                                                        {engraving.length} / 30 chars
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    maxLength={30}
                                                    value={engraving}
                                                    onChange={(e) => setEngraving(e.target.value)}
                                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors tracking-widest"
                                                    placeholder="e.g. A & K - Forever"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Special Requirements */}
                                    <div className="space-y-1">
                                        <label htmlFor="requirements" className="block text-xs uppercase tracking-widest text-zinc-650">Additional Requirements *</label>
                                        <textarea
                                            id="requirements"
                                            rows={4}
                                            value={requirements}
                                            onChange={(e) => {
                                                setRequirements(e.target.value);
                                                if (formErrors.requirements) {
                                                    setFormErrors(prev => ({ ...prev, requirements: "" }));
                                                }
                                            }}
                                            className={`w-full bg-zinc-50 border ${formErrors.requirements ? 'border-red-300' : 'border-zinc-200'} rounded-none md:rounded-[4px] p-3 text-sm text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors resize-none`}
                                            placeholder="Describe changes in diamond shape, custom bands, custom designs, metal variations, or additional notes..."
                                        />
                                        {formErrors.requirements && <span className="text-xs text-red-500 block">{formErrors.requirements}</span>}
                                    </div>

                                    {/* Submit error */}
                                    {formErrors.submit && (
                                        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-none md:rounded-[4px] border border-red-200">
                                            <AlertCircle size={14} />
                                            <span>{formErrors.submit}</span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="pt-2">
                                        <Button
                                            fullWidth
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="py-4 text-[14px] bg-[#C9A14A] text-white border-[#C9A14A] hover:bg-[#b08b3a] hover:border-[#b08b3a] disabled:opacity-50 transition-all font-semibold rounded-none md:rounded-[4px]"
                                        >
                                            {isSubmitting ? "SUBMITTING REQUEST..." : "SUBMIT CUSTOMIZATION REQUEST"}
                                        </Button>
                                    </div>
                                </form>
                             </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                                <div className="w-20 h-20 rounded-full border border-[#C9A14A] flex items-center justify-center bg-[#C9A14A]/10 animate-[scaleIn_0.5s_ease-out] shadow-[0_0_30px_rgba(201,161,74,0.15)]">
                                    <Check size={40} className="text-[#C9A14A]" />
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-2xl font-heading text-[#C9A14A] tracking-wide uppercase">Request Received</h3>
                                    <p className="text-sm text-zinc-700 leading-relaxed">
                                        Thank you for your bespoke request. Our master designer will review your specifications and contact you at <strong className="text-[#C9A14A]">{customerEmail}</strong> or via WhatsApp within 24 hours.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={() => {
                                            setIsCustomizing(false);
                                            setSubmitSuccess(false);
                                        }}
                                        className="px-8 py-3.5 border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white uppercase tracking-widest text-xs font-semibold rounded-none md:rounded-[4px] transition-all"
                                    >
                                        Back to Product
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Image Fullscreen Lightbox Overlay */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300 cursor-zoom-out animate-in fade-in"
                    onClick={() => setLightboxImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 z-10"
                        onClick={() => setLightboxImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <div 
                        className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={lightboxImage} 
                            alt="Product Fullscreen" 
                            className="max-w-full max-h-[95vh] object-contain select-none shadow-2xl transition-transform duration-300"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
