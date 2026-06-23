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

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;

export default function ProductClient({ product }: { product: any }) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("specs");

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

    let parsedMedia: string[] = [];
    try {
        if (typeof product.images === "string") {
            parsedMedia = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
            parsedMedia = product.images;
        }
    } catch (e) {
        console.log("Error parsing media in product details", e);
    }
    const mediaItems = (parsedMedia.length > 0 ? parsedMedia : [])
        .filter((src) => typeof src === "string" && src.trim().length > 0)
        .map((src) => ({
            src,
            type: VIDEO_EXT_REGEX.test(src) ? "video" as const : "image" as const,
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

            <div className="container-custom flex flex-col lg:flex-row gap-8 lg:gap-12 mb-24 relative">
                {/* Left: Gallery (Brilliant Earth 2-column Grid) */}
                <section className="w-full lg:w-[68%] flex flex-col gap-4">
                    {/* Desktop Grid Layout */}
                    <div className="hidden md:grid grid-cols-2 gap-4 w-full">
                        {mediaItems.map((item, idx) => (
                            <FadeIn 
                                key={`${item.src}-${idx}`} 
                                className={`relative aspect-[4/5] w-full overflow-hidden flex items-center justify-center p-2 group ${
                                    mediaItems.length === 1 || (mediaItems.length % 2 !== 0 && idx === 0) ? "md:col-span-2" : ""
                                }`}
                            >
                                {item.type === "image" ? (
                                    <SmartImage
                                        src={item.src}
                                        alt={product.name}
                                        fill
                                        fallbackType={imageFallbackType}
                                        imageKey={`${product.id}:grid:${idx}`}
                                        sizeType="detail"
                                        priority={idx === 0}
                                        className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <video
                                        src={item.src}
                                        className="w-full h-full object-contain p-2"
                                        controls
                                        preload="metadata"
                                        playsInline
                                    />
                                )}
                            </FadeIn>
                        ))}
                        {mediaItems.length === 0 && (
                            <div className="relative aspect-[4/5] w-full overflow-hidden flex items-center justify-center col-span-2">
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
                        <div className="relative aspect-[4/5] w-full overflow-hidden flex items-center justify-center p-2 rounded-none">
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
                                        className="object-contain p-4"
                                    />
                                ) : (
                                    <video
                                        src={mediaItems[activeMediaIndex].src}
                                        className="w-full h-full object-contain p-2"
                                        controls
                                        preload="metadata"
                                        playsInline
                                    />
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
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-[10px] text-zinc-500 font-bold uppercase">
                                                Video
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Right: Details (Scrollable Flow) */}
                <section className="w-full lg:w-[32%] pt-4 flex flex-col">
                    <FadeIn delay={0.2}>
                        <span className="text-[11px] md:text-xs tracking-[0.34em] font-semibold text-[#C9A14A] uppercase mb-3 block">Product Detail</span>
                        <h1 className="text-[22px] md:text-3xl lg:text-[34px] font-serif font-medium text-zinc-900 tracking-wide mb-6 max-w-[640px]">
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-6 mb-8 border-b border-zinc-200 pb-6">
                            <span className="text-[18px] md:text-[28px] font-medium text-zinc-900">₹{displayPrice.toLocaleString("en-IN")}</span>
                            <span className="text-[11px] md:text-[12px] uppercase tracking-[0.06em] text-zinc-400">Inclusive of all taxes</span>
                        </div>

                        <p className="text-[14px] md:text-[15px] font-normal text-zinc-500 mb-10 max-w-[640px] leading-relaxed">
                            {product.description}
                        </p>

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

            {/* Product Specifications & Details Tabs */}
            <section className="max-w-[1100px] mx-auto pt-16 border-t border-zinc-200 px-5">
                <FadeIn>
                    <div className="flex justify-center gap-12 border-b border-zinc-200 mb-16">
                        <button
                            onClick={() => setActiveTab("specs")}
                            className={`pb-5 text-xl font-heading tracking-wide transition-all duration-500 relative group ${activeTab === "specs" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-650"} ${activeTab === "specs" ? "after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-[#C9A14A]" : "after:absolute after:bottom-[-1px] after:left-0 after:w-0 after:h-[1px] after:bg-[#C9A14A] after:group-hover:w-full after:transition-all after:duration-500"}`}
                        >
                            Product Specifications
                        </button>
                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`pb-5 text-xl font-heading tracking-wide transition-all duration-500 relative group ${activeTab === "reviews" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-650"} ${activeTab === "reviews" ? "after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-[#C9A14A]" : "after:absolute after:bottom-[-1px] after:left-0 after:w-0 after:h-[1px] after:bg-[#C9A14A] after:group-hover:w-full after:transition-all after:duration-500"}`}
                        >
                            Customer Reviews
                        </button>
                    </div>

                    <div className="animate-[fadeIn_0.5s_ease]">
                        {activeTab === "specs" && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Diamond Shape", val: product.diamond?.shape || "Round" },
                                    { label: "Carat Weight", val: `${product.diamond?.caratWeight || "1.00"} CT` },
                                    { label: "Cut", val: product.diamond?.cut || "Excellent" },
                                    { label: "Clarity", val: product.diamond?.clarity || "VVS1" },
                                    { label: "Color", val: product.diamond?.color || "E - F" },
                                    { label: "Certification", val: product.diamond?.certification || "GIA / IGI Certified" },
                                    { 
                                        label: isGold ? "Gold Purity" : "Metal Finish", 
                                        val: finalMetalType 
                                    },
                                ].map((row, i) => (
                                    <FadeIn key={i} delay={i * 0.06}>
                                        <div className="border border-zinc-150 py-8 px-4 flex flex-col justify-center items-center text-center rounded-none md:rounded-[4px] cursor-pointer">
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-[0.28em] font-bold mb-3">{row.label}</span>
                                            <span className="text-[16px] text-zinc-900 font-medium">{row.val}</span>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="text-center py-10 max-w-[800px] mx-auto">
                                <h3 className="text-6xl font-heading text-zinc-900 mb-4 tracking-wide">4.9</h3>
                                <div className="flex justify-center gap-2 text-[#C9A14A] mb-4 w-40 mx-auto opacity-85">
                                    <StarIcon /> <StarIcon /> <StarIcon /> <StarIcon /> <StarIcon />
                                </div>
                                <p className="text-zinc-500 text-base mb-16 uppercase tracking-widest font-medium">Based on 24 reviews</p>

                                <div className="text-left border-t border-zinc-200 pt-10 pb-8">
                                    <div className="flex gap-2 text-[#C9A14A] mb-4 w-24 opacity-85"><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></div>
                                    <h4 className="text-2xl text-zinc-900 mb-3 font-heading tracking-wide">Absolutely Stunning</h4>
                                    <p className="text-zinc-600 mb-4 leading-relaxed font-light">The ring is even more beautiful in person. The craftsmanship is flawless, and the diamond sparkles incredibly.</p>
                                    <p className="text-sm text-zinc-400 uppercase tracking-widest font-medium">Anjali S. — October 12, 2023</p>
                                </div>

                                <div className="mt-10">
                                    <ReviewForm productId={product.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>
            </section>

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
        </div>
    );
}

function ReviewForm({ productId }: { productId: string }) {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, rating, comment })
            });
            alert("Review submitted successfully");
            setComment("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <div className="mt-12 py-8 border-t border-zinc-200 text-zinc-500 tracking-widest uppercase text-base text-center font-medium">Please login to write a review.</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="mt-12 pt-10 border-t border-zinc-200 text-left max-w-[600px] mx-auto">
            <h4 className="text-2xl font-heading text-zinc-900 mb-8">Write a Review</h4>
            <div className="mb-6">
                <label className="block text-sm uppercase tracking-widest text-zinc-650 mb-3 font-medium">Rating</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full max-w-[200px] p-4 rounded-none border border-zinc-200 text-zinc-900 appearance-none bg-white focus:outline-none focus:border-[#C9A14A] transition-colors cursor-pointer font-medium">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
            <div className="mb-8">
                <label className="block text-sm uppercase tracking-widest text-zinc-650 mb-3 font-medium">Review</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    className="w-full p-5 rounded-none border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-[#C9A14A] transition-colors resize-none placeholder:text-zinc-400"
                    placeholder="Share your experience..."
                />
            </div>
            <Button disabled={isSubmitting} className="w-full md:w-auto">{isSubmitting ? "Submitting..." : "Submit Review"}</Button>
        </form>
    );
}

function StarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
        </svg>
    );
}
