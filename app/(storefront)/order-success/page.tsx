"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Loader2, Truck } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { SmartImage } from "@/components/SmartImage";

type OrderItem = {
    id: string;
    name: string;
    image?: string;
    isCustomRing?: boolean;
    quantity: number;
    price: number;
};

type LocalOrder = {
    orderId: string;
    items: OrderItem[];
    total: number;
    status: string;
    createdAt: string;
    estimatedDeliveryDate?: string;
    paymentMethod?: string;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
};

function OrderSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [copied, setCopied] = useState(false);
    const [order, setOrder] = useState<LocalOrder | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") {
            setIsLoadingOrder(false);
            return;
        }

        try {
            const raw = window.localStorage.getItem("order");
            if (!raw) {
                setOrder(null);
                return;
            }

            const parsed = JSON.parse(raw) as LocalOrder;
            if (orderId && parsed.orderId !== orderId) {
                setOrder(null);
                return;
            }

            setOrder(parsed);
        } catch {
            setOrder(null);
        } finally {
            setIsLoadingOrder(false);
        }
    }, [orderId]);

    const deliveryDate = useMemo(() => {
        if (!order) return "";
        if (!order.estimatedDeliveryDate) return "";
        return new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }, [order]);

    const handleCopy = async () => {
        const value = order?.orderId || orderId || "";
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    if (isLoadingOrder) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center bg-[#F8F6F2]">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#111]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Loading your order...
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center bg-[#F8F6F2] px-4">
                <div className="max-w-md rounded-[20px] border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Order not found</p>
                    <h2 className="mb-4 text-2xl font-heading text-[#111]">We could not load this order.</h2>
                    <Button className="w-full" onClick={() => router.push("/shop")}>Continue Shopping</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-[#F8F6F2] pb-24 pt-8 font-body text-[#111]">
            <div className="container-custom max-w-4xl">
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 shadow-sm"
                    >
                        <CheckCircle2 className="h-14 w-14 text-green-500" />
                    </motion.div>
                    <h1 className="mb-3 text-4xl font-heading tracking-wide text-[#111] md:text-5xl">
                        Order confirmed
                    </h1>
                    <p className="text-sm tracking-wide text-gray-400">
                        Your jewelry is now in secure processing.
                    </p>
                </div>

                <FadeIn>
                    <div className="mb-6 flex flex-col gap-4 border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Order ID
                            </p>
                            <p className="font-mono text-lg font-bold tracking-wider text-[#111]">
                                {order.orderId}
                            </p>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center justify-center gap-2 border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-gray-50"
                        >
                            <Copy size={14} />
                            {copied ? "Copied" : "Copy Order ID"}
                        </button>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <FadeIn delay={0.05}>
                        <div className="border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-5 text-sm font-heading uppercase tracking-wider text-[#111]">
                                Order Summary
                            </h3>

                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-gray-100 bg-[#F8F6F2]">
                                            <SmartImage
                                                src={item.image || ""}
                                                alt={item.name}
                                                fill
                                                fallbackType={item.isCustomRing ? "setting" : "jewelry"}
                                                sizeType="thumbnail"
                                                className="object-cover p-1.5"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#111]">{item.name}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Qty {item.quantity}
                                                {(item as any).metalType && ` · ${(item as any).metalType}`}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-[#111]">₹{item.price.toLocaleString("en-IN")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    <div className="space-y-6">
                        <FadeIn delay={0.1}>
                            <div className="border border-gray-100 bg-white p-6 shadow-sm">
                                <h3 className="mb-5 text-sm font-heading uppercase tracking-wider text-[#111]">
                                    Delivery Details
                                </h3>
                                <div className="space-y-4 text-sm text-gray-600">
                                    <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
                                        <span>Customer</span>
                                        <span className="font-medium text-[#111]">{order.customer?.name || "Guest"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
                                        <span>Total</span>
                                        <span className="font-medium text-[#111]">₹{order.total.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
                                        <span>Payment</span>
                                        <span className="font-medium text-[#111]">{order.paymentMethod || "Mock Payment"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Estimated Delivery</span>
                                        <span className="font-medium text-[#111]">{deliveryDate || "To be updated"}</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.15}>
                            <div className="rounded-[22px] bg-[#111] p-6 text-white shadow-lg">
                                <div className="mb-4 flex items-center gap-3 text-[#D6B25E]">
                                    <Truck size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.24em]">Track your order</span>
                                </div>
                                <p className="mb-6 text-sm text-white/65">
                                    Monitor the delivery stages in real time using the saved order record.
                                </p>
                                <Button
                                    className="w-full gap-2 bg-[#D6B25E] text-[#111] hover:bg-[#e4c676]"
                                    onClick={() => router.push(`/track-order?orderId=${encodeURIComponent(order.orderId)}`)}
                                >
                                    <Truck size={14} />
                                    Track Order
                                </Button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={null}>
            <OrderSuccessContent />
        </Suspense>
    );
}
