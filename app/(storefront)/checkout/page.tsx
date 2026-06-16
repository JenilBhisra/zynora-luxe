"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SmartImage } from "@/components/SmartImage";
import { useCart } from "@/components/CartProvider";
import { clearCheckoutIntent, getCheckoutIntent } from "@/lib/checkout-intent";
import { calculateEstimatedDeliveryDate, validateCheckoutDetails } from "@/lib/checkout-flow";
import { getCurrentUser, isLoggedIn, setRedirectAfterLogin } from "@/lib/auth-flow";
import type { StoredOrderItem } from "@/lib/order-storage";
import Script from "next/script";
import Turnstile from "@/components/Turnstile";

declare global {
    interface Window {
        Razorpay: any;
    }
}

type CheckoutFormState = {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    state: string;
    paymentMethod: string;
};

const EMPTY_FORM: CheckoutFormState = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "Gujarat",
    paymentMethod: "Razorpay",
};

export default function CheckoutPage() {
    const router = useRouter();
    const { items, cartCount, addToCart, clearCart } = useCart();

    const [formData, setFormData] = useState<CheckoutFormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormState, string>>>({});
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasCustomItem = items.some((item) => item.isCustomRing);
    const gstAmount = Math.round(subtotal * 0.18);
    const total = subtotal + gstAmount;
    const estimatedDeliveryDate = useMemo(
        () => calculateEstimatedDeliveryDate(items as StoredOrderItem[]),
        [items]
    );

    useEffect(() => {
        if (!isLoggedIn()) {
            setRedirectAfterLogin("/checkout");
            router.replace("/login?redirect=/checkout&message=checkout_required");
            return;
        }

        const currentUser = getCurrentUser();
        const checkoutIntent = getCheckoutIntent();

        if (checkoutIntent && (checkoutIntent.source === "single-product" || checkoutIntent.source === "custom-ring") && checkoutIntent.item) {
            const exists = items.some((item) => item.id === checkoutIntent.item?.id);
            if (!exists) {
                addToCart(checkoutIntent.item);
            }
        }

        clearCheckoutIntent();
        setFormData((current) => ({
            ...current,
            name: currentUser?.name || current.name,
            email: currentUser?.email || current.email,
        }));
        setIsCheckingAuth(false);
    }, [addToCart, items, router]);

    const updateField = <K extends keyof CheckoutFormState>(field: K, value: CheckoutFormState[K]) => {
        setFormData((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const handlePlaceOrder = async () => {
        setSubmitError("");

        if (!isLoggedIn()) {
            setRedirectAfterLogin("/checkout");
            router.replace("/login?redirect=/checkout&message=checkout_required");
            return;
        }

        const nextErrors = validateCheckoutDetails(formData);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0 || items.length === 0) {
            return;
        }

        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        if (siteKey && !turnstileToken) {
            setSubmitError("Please complete the bot verification check.");
            return;
        }

        setIsProcessing(true);

        try {
            // Call API to place the order in DB
            const res = await fetch("/api/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderType: "CART",
                    customer: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                    },
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image || "",
                        quantity: item.quantity || 1,
                        isCustomRing: item.isCustomRing || false,
                        ringConfigurationId: item.ringConfigurationId || null,
                        metalType: item.metalType || null
                    })),
                    subtotal,
                    totalAmount: total,
                    gstAmount,
                    gstType: "CGST_SGST",
                    shippingState: formData.state,
                    billingState: formData.state,
                    paymentMethod: formData.paymentMethod,
                    turnstileToken,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to place order in database");
            }
            
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || "Failed to place order");
            }

            if (formData.paymentMethod === "Razorpay") {
                // Call create-order api
                const razorpayOrderRes = await fetch("/api/razorpay/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: total,
                        currency: "INR",
                        receipt: data.displayOrderId || data.orderId,
                    }),
                });

                if (!razorpayOrderRes.ok) {
                    throw new Error("Failed to initialize payment gateway order.");
                }

                const razorpayOrderData = await razorpayOrderRes.json();
                if (!razorpayOrderData.success) {
                    throw new Error(razorpayOrderData.error || "Failed to create payment order.");
                }

                const options = {
                    key: razorpayOrderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
                    amount: razorpayOrderData.amount,
                    currency: razorpayOrderData.currency,
                    name: "Zynora Luxe",
                    description: items.map(i => i.name).join(", ").slice(0, 255),
                    order_id: razorpayOrderData.id,
                    handler: async function (response: any) {
                        try {
                            setIsProcessing(true);
                            // Verify payment signature on backend
                            const verifyRes = await fetch("/api/razorpay/verify-payment", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    orderId: data.orderId, // database internal ID
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                }),
                            });

                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok || !verifyData.success) {
                                throw new Error(verifyData.error || "Payment verification failed.");
                            }

                            // Complete order locally
                            const order = {
                                orderId: data.displayOrderId || data.orderId,
                                items: items as StoredOrderItem[],
                                total,
                                status: "Processing",
                                createdAt: new Date().toISOString(),
                                estimatedDeliveryDate,
                                paymentMethod: "Razorpay",
                                customer: {
                                    name: formData.name,
                                    email: formData.email,
                                    phone: formData.phone,
                                },
                                shippingAddress: {
                                    address: formData.address,
                                    city: formData.city,
                                    pincode: formData.pincode,
                                    state: formData.state,
                                },
                            };

                            window.localStorage.setItem("order", JSON.stringify(order));
                            try {
                                const raw = window.localStorage.getItem("orders");
                                const existing = raw ? JSON.parse(raw) : [];
                                const withUser = (() => {
                                    try {
                                        const current = getCurrentUser();
                                        return current ? { ...order, userId: current.id } : order;
                                    } catch {
                                        return order;
                                    }
                                })();
                                window.localStorage.setItem("orders", JSON.stringify([...(existing || []), withUser]));
                            } catch {}
                            clearCart();

                            setPlacedOrderId(order.orderId);
                            setShowSuccessAnimation(true);

                            window.setTimeout(() => {
                                router.push(`/order-success?orderId=${encodeURIComponent(order.orderId)}`);
                            }, 1100);
                        } catch (err: any) {
                            console.error(err);
                            setSubmitError(err.message || "Payment verification failed. Please contact support.");
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.phone,
                    },
                    theme: {
                        color: "#0B0B0C", // Zynora Luxe dark navy/gold
                    },
                    modal: {
                        ondismiss: function () {
                            setIsProcessing(false);
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                return;
            }

            const order = {
                orderId: data.displayOrderId || data.orderId,
                items: items as StoredOrderItem[],
                total,
                status: "Processing",
                createdAt: new Date().toISOString(),
                estimatedDeliveryDate,
                paymentMethod: formData.paymentMethod,
                customer: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                },
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode,
                    state: formData.state,
                },
            };

            window.localStorage.setItem("order", JSON.stringify(order));
            try {
                const raw = window.localStorage.getItem("orders");
                const existing = raw ? JSON.parse(raw) : [];
                const withUser = (() => {
                    try {
                        const current = getCurrentUser();
                        return current ? { ...order, userId: current.id } : order;
                    } catch {
                        return order;
                    }
                })();
                window.localStorage.setItem("orders", JSON.stringify([...(existing || []), withUser]));
            } catch {}
            clearCart();

            setPlacedOrderId(order.orderId);
            setShowSuccessAnimation(true);

            window.setTimeout(() => {
                router.push(`/order-success?orderId=${encodeURIComponent(order.orderId)}`);
            }, 1100);
        } catch (error: any) {
            setSubmitError(error.message || "We could not complete the order. Please try again.");
            setShowSuccessAnimation(false);
        } finally {
            window.setTimeout(() => setIsProcessing(false), 250);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#0B0B0C] text-white">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#D6B25E]" />
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Loading checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-[#0B0B0C] pb-24 pt-10 font-body text-white">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
            <AnimatePresence>
                {showSuccessAnimation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/85 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 18 }}
                            animate={{ scale: 1, y: 0 }}
                            className="luxury-panel max-w-md rounded-[24px] border border-white/10 p-8 text-center shadow-2xl"
                        >
                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#D6B25E]/30 bg-[#D6B25E]/10">
                                <PackageCheck className="h-10 w-10 text-[#D6B25E]" />
                            </div>
                            <h2 className="mb-3 text-2xl font-medium text-white">Order confirmed</h2>
                            <p className="text-sm text-white/60">Your order is secured and being prepared now.</p>
                            {placedOrderId && (
                                <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-white/40">
                                    {placedOrderId}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container-custom">
                <FadeIn>
                    <span className="mb-4 block text-[10px] font-medium uppercase tracking-[0.34em] text-[#D6B25E] md:text-[11px]">
                        Checkout
                    </span>
                    <h1 className="mb-4 max-w-[760px] text-[40px] font-medium leading-[1.1] tracking-tight text-white md:text-[56px]">
                        Secure your jewelry purchase.
                    </h1>
                    <p className="max-w-2xl text-sm text-white/55">
                        Complete your details once. Your order, success page, and delivery tracking stay connected.
                    </p>
                </FadeIn>

                {items.length === 0 ? (
                    <FadeIn className="luxury-shell rounded-[24px] py-24 text-center">
                        <h2 className="mb-4 text-3xl font-medium text-white">Your cart is empty</h2>
                        <p className="mb-8 text-[15px] text-white/60">Add a piece to continue to checkout.</p>
                        <Link href="/shop">
                            <Button className="px-8 py-4 text-[14px] font-medium uppercase tracking-[0.1em]">
                                Continue Shopping
                            </Button>
                        </Link>
                    </FadeIn>
                ) : (
                    <div className="section-pad flex flex-col gap-12 lg:flex-row">
                        <div className="flex-[1.5]">
                            <FadeIn className="mb-10">
                                <h3 className="mb-6 border-b border-white/10 pb-3 text-[18px] font-medium text-white">
                                    1. Contact Details
                                </h3>
                                <div className="grid gap-5">
                                    <div>
                                        <input
                                            value={formData.name}
                                            onChange={(event) => updateField("name", event.target.value)}
                                            type="text"
                                            placeholder="Full Name"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.name && <p className="mt-2 text-xs text-red-300">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <input
                                            value={formData.email}
                                            onChange={(event) => updateField("email", event.target.value)}
                                            type="email"
                                            placeholder="Email Address"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.email && <p className="mt-2 text-xs text-red-300">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <input
                                            value={formData.phone}
                                            onChange={(event) => updateField("phone", event.target.value)}
                                            type="tel"
                                            placeholder="Phone Number"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.phone && <p className="mt-2 text-xs text-red-300">{errors.phone}</p>}
                                    </div>
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.1} className="mb-10">
                                <h3 className="mb-6 border-b border-white/10 pb-3 text-[18px] font-medium text-white">
                                    2. Shipping Address
                                </h3>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <input
                                            value={formData.address}
                                            onChange={(event) => updateField("address", event.target.value)}
                                            type="text"
                                            placeholder="Street Address"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.address && <p className="mt-2 text-xs text-red-300">{errors.address}</p>}
                                    </div>
                                    <div>
                                        <input
                                            value={formData.city}
                                            onChange={(event) => updateField("city", event.target.value)}
                                            type="text"
                                            placeholder="City"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.city && <p className="mt-2 text-xs text-red-300">{errors.city}</p>}
                                    </div>
                                    <div>
                                        <select
                                            value={formData.state}
                                            onChange={(event) => updateField("state", event.target.value)}
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white focus:border-[#D6B25E] focus:outline-none"
                                        >
                                            <option value="Gujarat">Gujarat</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Karnataka">Karnataka</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <input
                                            value={formData.pincode}
                                            onChange={(event) => updateField("pincode", event.target.value)}
                                            type="text"
                                            placeholder="PIN Code"
                                            className="w-full border border-white/10 bg-white/5 p-4 text-[15px] text-white placeholder:text-white/35 focus:border-[#D6B25E] focus:outline-none"
                                        />
                                        {errors.pincode && <p className="mt-2 text-xs text-red-300">{errors.pincode}</p>}
                                    </div>
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.2} className="mb-10">
                                <h3 className="mb-6 border-b border-white/10 pb-3 text-[18px] font-medium text-white">
                                    3. Payment Method
                                </h3>
                                <div className="luxury-panel flex flex-col gap-6 rounded-[18px] p-6">
                                    <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={formData.paymentMethod === "Razorpay"}
                                                onChange={() => updateField("paymentMethod", "Razorpay")}
                                                className="h-4 w-4 accent-[#D6B25E]"
                                            />
                                            <span className="text-[15px] font-medium text-white flex items-center gap-2">
                                                Razorpay <span className="text-[10px] bg-[#D6B25E]/10 text-[#D6B25E] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Test Mode</span>
                                            </span>
                                        </label>
                                        <p className="ml-7 text-[13px] text-white/60">
                                            Pay securely via Cards, UPI, Netbanking, or Wallets.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={formData.paymentMethod === "Mock Payment"}
                                                onChange={() => updateField("paymentMethod", "Mock Payment")}
                                                className="h-4 w-4 accent-[#D6B25E]"
                                            />
                                            <span className="text-[15px] font-medium text-white">Mock Payment</span>
                                        </label>
                                        <p className="ml-7 text-[13px] text-white/60">
                                            Secure test mode. No external gateway is used for this flow.
                                        </p>
                                    </div>
                                    {errors.paymentMethod && <p className="text-xs text-red-300">{errors.paymentMethod}</p>}
                                </div>
                            </FadeIn>

                            {submitError && (
                                <div className="rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {submitError}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <FadeIn delay={0.3} className="sticky top-28 rounded-[22px] border border-white/10 p-8 luxury-panel">
                                <h3 className="mb-8 text-center text-[14px] font-medium uppercase tracking-[0.24em] text-white">
                                    Order Summary
                                </h3>

                                <div className="mb-8 max-h-[40vh] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[14px] bg-black/20">
                                                <SmartImage
                                                    src={item.image || ""}
                                                    alt={item.name}
                                                    fill
                                                    fallbackType={item.isCustomRing ? "setting" : "jewelry"}
                                                    className="object-cover p-2"
                                                />
                                                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D6B25E] text-[10px] font-bold text-[#0B0B0C]">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex flex-1 flex-col justify-center">
                                                <h4 className="line-clamp-2 text-[14px] font-medium leading-snug text-white">
                                                    {item.name}
                                                </h4>
                                                <p className="mt-2 text-[14px] font-normal text-white/60">
                                                    ₹{item.price.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-6 space-y-4 border-y border-white/10 py-6">
                                    <div className="flex justify-between text-[14px] font-normal text-white/60">
                                        <span>Subtotal ({cartCount} items)</span>
                                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-normal text-white/60">
                                        <span>{hasCustomItem ? "Estimated GST" : "GST (18%)"}</span>
                                        <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-normal text-white/60">
                                        <span>Delivery Window</span>
                                        <span>{hasCustomItem ? "3-4 weeks" : "7-10 days"}</span>
                                    </div>
                                </div>

                                <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-6">
                                    <span className="text-[14px] font-medium uppercase tracking-[0.24em] text-white">Total</span>
                                    <span className="text-[20px] font-medium text-white">
                                        ₹{total.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                                        onVerify={(token) => setTurnstileToken(token)}
                                    />
                                )}

                                <Button
                                    fullWidth
                                    className="mb-4 gap-2 text-sm"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || items.length === 0}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing Order...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={16} />
                                            Place Order Securely
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-white/45">
                                    <ShieldCheck size={14} />
                                    <span>Authenticated checkout with local order persistence</span>
                                </div>

                                <div className="mt-6 rounded-[18px] border border-[#D6B25E]/20 bg-[#D6B25E]/8 p-4 text-center text-[12px] text-white/70">
                                    Estimated delivery: {new Date(estimatedDeliveryDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/35">
                                    <Sparkles size={12} />
                                    Luxury checkout experience
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
