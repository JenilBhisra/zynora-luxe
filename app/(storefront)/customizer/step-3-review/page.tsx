"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useCustomizerStore } from "@/lib/customizer-store";
import { useCart } from "@/components/CartProvider";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { saveCheckoutIntent } from "@/lib/checkout-intent";

const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export default function Step4ReviewPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { config, getTotalPrice, resetConfig } = useCustomizerStore();
    const { addToCart } = useCart();

    const [isAdded, setIsAdded] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        if (!config.diamond) {
            router.push("/customizer/step-1-diamond");
        } else if (!config.setting) {
            router.push("/customizer/step-2-setting");
        }
    }, [config, router]);

    if (!config.setting || !config.diamond) {
        return null;
    }

    const { setting, diamond, metalType, ringKarat, ringSize, ringKaratPrice, ringSizePrice } = config;
    const totalPrice = getTotalPrice();
    const settingDisplayPrice = ringKarat && ringKaratPrice > 0 ? ringKaratPrice + ringSizePrice : setting.price;

    const handleAddToCart = async () => {
        setIsAdded(true);
        try {
            const res = await fetch('/api/customizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settingId: setting.id,
                    diamondId: diamond.id,
                    metalType: metalType,
                    totalPrice: totalPrice,
                })
            });

            if (!res.ok) throw new Error("Failed to save configuration");
            const data = await res.json();

            // Construct a logical cart item representing the custom ring
            addToCart({
                id: `ring-config-${data.id}`,
                name: `Custom ${setting.name} with ${diamond.caratWeight}ct ${diamond.shape} Diamond`,
                price: totalPrice,
                image: setting.imageUrl || "/products/setting-1.jpg",
                quantity: 1,
                isCustomRing: true,
                ringConfigurationId: data.id,
                metalType: metalType
            });

            toast.success("Added to Cart successfully!");

            setTimeout(() => {
                resetConfig();
                router.push("/cart"); // Redirect to cart or keep it
            }, 1000);
        } catch (error) {
            console.error(error);
            setIsAdded(false);
            toast.error("Failed to add to cart. Please try again.");
        }
    };

    const handleProceedToPurchase = async () => {
        setIsPurchasing(true);
        try {
            // Save ring configuration to DB first
            const res = await fetch('/api/customizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settingId: setting.id,
                    diamondId: diamond.id,
                    metalType: metalType,
                    totalPrice: totalPrice,
                })
            });

            if (!res.ok) throw new Error("Failed to save configuration");
            const data = await res.json();

            const cartItem = {
                id: `ring-config-${data.id}`,
                name: `Custom ${setting.name} with ${diamond.caratWeight}ct ${diamond.shape} Diamond`,
                price: totalPrice,
                image: setting.imageUrl || "/products/setting-1.jpg",
                quantity: 1,
                isCustomRing: true,
                ringConfigurationId: data.id,
                metalType: metalType,
            };

            if (!user) {
                saveCheckoutIntent({
                    source: "custom-ring",
                    item: cartItem,
                    createdAt: Date.now(),
                });
                router.push("/login?redirect=/checkout&message=checkout_required");
                return;
            }

            addToCart(cartItem);
            toast.success("Custom ring added. Continue to checkout.");
            router.push("/checkout");
        } catch (error) {
            console.error(error);
            setIsPurchasing(false);
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="animate-in fade-in duration-700 max-w-3xl mx-auto mb-20 text-zinc-900">
            <h2 className="text-[24px] md:text-[32px] font-serif text-zinc-900 mb-10 text-center block font-normal tracking-wide">Review Your Ring</h2>

            <div className="luxury-shell p-8 md:p-10 border border-zinc-100 rounded-[22px]">

                {/* Text Summary */}
                <div className="border-b border-zinc-150 pb-10 mb-10">
                    <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#C9A14A] mb-3 block">
                        Your Masterpiece
                    </span>
                    <h3 className="text-[20px] md:text-[22px] font-medium leading-tight tracking-[-0.02em] text-zinc-900 mb-4">
                        {setting.name}
                    </h3>
                    <p className="text-zinc-600 mb-6 text-[14px] leading-relaxed font-normal">
                        Crafted in <strong className="text-zinc-900 font-medium">{metalType}</strong>, starring a stunning <strong className="text-zinc-900 font-medium">{diamond.caratWeight} Carat {diamond.cut} cut, {diamond.color} color, {diamond.clarity} clarity {diamond.shape}</strong> diamond.
                    </p>
                    <div className="text-[32px] font-medium text-zinc-900 mt-8">
                        {formatPrice(totalPrice)}
                    </div>
                    {ringKarat && (
                        <div className="mt-2 flex gap-3">
                            <span className="inline-flex items-center gap-1.5 bg-[#D6B25E]/10 border border-[#D6B25E]/20 text-[#D6B25E] text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                {ringKarat} Gold
                            </span>
                            {ringSize && (
                                <span className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 text-zinc-655 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                    Size {ringSize} US
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Breakdown */}
                <h4 className="text-[18px] mb-6 text-zinc-900 font-medium">Order Details</h4>
                <div className="space-y-5 mb-12 text-[14px]">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-600">
                            Setting ({setting.name})
                            {ringKarat && <span className="text-zinc-400 ml-1.5">· {ringKarat}{ringSize ? ` · Size ${ringSize}` : ""}</span>}
                        </span>
                        <span className="font-semibold text-zinc-900">{formatPrice(settingDisplayPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-600">Diamond ({diamond.caratWeight}ct {diamond.shape})</span>
                        <span className="font-semibold text-zinc-900">{formatPrice(diamond.price)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-600">Metal ({metalType})</span>
                        <span className="font-semibold text-zinc-900">{formatPrice(config.metalPriceAdjustment)}</span>
                    </div>
                    <div className="flex justify-between items-center py-5 bg-zinc-50 px-6 mt-6 border-b border-zinc-100 rounded-[16px]">
                        <span className="font-semibold text-zinc-500 tracking-[0.28em] uppercase text-[10px]">Final Total</span>
                        <span className="font-bold text-[20px] text-[#C9A14A]">{formatPrice(totalPrice)}</span>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="luxury-panel p-6 mb-12 flex gap-5 items-start rounded-[18px]">
                    <div className="text-[#D6B25E] mt-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <div>
                        <h5 className="font-medium text-[#C9A14A] tracking-[0.28em] uppercase text-[10px] mb-2">Made to Order</h5>
                        <p className="text-zinc-500 text-[14px] leading-relaxed font-normal">
                            Your bespoke ring will be handcrafted to perfection. Estimated delivery in <strong className="text-zinc-900 font-medium">3-4 weeks</strong> from order date.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-zinc-150">
                    <button
                        onClick={() => router.push("/customizer/step-1-diamond")}
                        className="text-zinc-400 hover:text-zinc-800 text-[14px] font-bold uppercase tracking-widest transition-colors w-full md:w-auto text-left"
                    >
                        Back to Diamond
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdded || isPurchasing}
                            className={`w-full sm:w-auto px-8 py-4 rounded-none text-[14px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${isAdded ? 'bg-[#C9A14A] border-[#C9A14A] text-white' : 'bg-transparent text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                                }`}
                        >
                            {isAdded ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Added to Cart
                                </>
                            ) : (
                                'Add to Cart'
                            )}
                        </button>
                        <button
                            onClick={handleProceedToPurchase}
                            disabled={isAdded || isPurchasing}
                            className="w-full sm:w-auto px-10 py-4 rounded-none text-[14px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[#C9A14A] text-white hover:bg-black hover:shadow-[0_0_20px_rgba(201,161,74,0.18)] hover:-translate-y-0.5"
                        >
                            {isPurchasing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <ShoppingBag size={16} />
                                    Proceed to Purchase
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
