"use client";
import { useCart } from "@/components/CartProvider";
import { ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { saveCheckoutIntent } from "@/lib/checkout-intent";
import { SmartImage } from "@/components/SmartImage";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
    const { items, cartCount, removeFromCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckoutClick = () => {
        if (!user) {
            saveCheckoutIntent({
                source: "cart",
                items,
                createdAt: Date.now(),
            });
            router.push("/login?redirect=/checkout&message=checkout_required");
            return;
        }

        router.push("/checkout");
    };

    return (
        <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0C] text-white">
            <div className="container-custom max-w-5xl">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#D6B25E]/20">
                    <ShoppingBag size={24} className="text-[#D6B25E]" />
                    <h1 className="text-3xl font-heading uppercase tracking-wide">
                        Your Cart {cartCount > 0 && <span className="text-zinc-500 text-xl ml-2">({cartCount})</span>}
                    </h1>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-[#121214] rounded-2xl border border-[#D6B25E]/10">
                        <div className="w-24 h-24 rounded-full bg-[#D6B25E]/10 border border-[#D6B25E]/20 flex items-center justify-center mb-6">
                            <ShoppingBag size={40} className="text-[#D6B25E]/45" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-heading text-white mb-3">Your Cart is Empty</h3>
                        <p className="text-zinc-400 mb-8 max-w-md leading-relaxed">
                            Discover our exquisite collection of fine jewelry and begin your journey.
                        </p>
                        <Link href="/shop">
                            <Button className="px-8 py-3 text-sm gap-2">
                                Explore Collection
                                <ArrowRight size={14} />
                            </Button>
                        </Link>
                        <Link 
                            href="/customizer/step-1-diamond" 
                            className="text-xs text-zinc-500 hover:text-[#D6B25E] transition-colors mt-6 uppercase tracking-widest font-medium block"
                        >
                            or Customize a Ring
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Cart Items */}
                        <div className="flex-1 space-y-0">
                            <AnimatePresence mode="popLayout">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex gap-6 py-6 border-b border-[#D6B25E]/10 group"
                                    >
                                        <div className="w-28 h-28 sm:w-36 sm:h-36 relative bg-[#18181B] shrink-0 border border-[#D6B25E]/20 rounded-xl overflow-hidden">
                                            <SmartImage 
                                                src={item.image} 
                                                alt={item.name} 
                                                fill 
                                                fallbackType={item.isCustomRing ? "setting" : "jewelry"} 
                                                className="object-cover p-2" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h4 className="text-lg text-white font-medium pr-4 leading-snug">{item.name}</h4>
                                                    {item.isCustomRing && item.metalType && (
                                                        <p className="text-sm text-zinc-500 mt-2 uppercase tracking-wider">{item.metalType}</p>
                                                    )}
                                                </div>
                                                <p className="text-lg font-medium text-[#D6B25E] shrink-0">
                                                    ₹{item.price.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-6">
                                                <div className="flex items-center text-zinc-400 text-sm">
                                                    Quantity: {(item as any).quantity || 1}
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="hidden sm:inline">Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-[380px] shrink-0">
                            <div className="bg-[#121214] border border-[#D6B25E]/20 rounded-2xl p-8 sticky top-32">
                                <h3 className="text-xl font-heading text-white mb-6 border-b border-[#D6B25E]/10 pb-4">Order Summary</h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Subtotal</span>
                                        <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Shipping</span>
                                        <span className="text-white">Calculated at checkout</span>
                                    </div>
                                </div>
                                
                                <div className="border-t border-[#D6B25E]/20 pt-4 mb-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg text-white">Estimated Total</span>
                                        <span className="font-medium text-[#D6B25E] text-2xl">₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2 text-right">Taxes included</p>
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    <Button fullWidth className="py-4 text-sm gap-2" onClick={handleCheckoutClick}>
                                        Proceed to Checkout
                                        <ArrowRight size={16} />
                                    </Button>
                                    <Link href="/shop" className="w-full text-center py-3 text-xs uppercase tracking-widest text-zinc-400 hover:text-[#D6B25E] transition-colors font-medium border border-transparent hover:border-[#D6B25E]/20 rounded-md">
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
