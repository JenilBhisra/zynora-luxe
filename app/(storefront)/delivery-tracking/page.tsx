"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MapPin, Package } from "lucide-react";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";

type LocalOrder = {
    orderId: string;
    status?: string;
    estimatedDeliveryDate?: string;
    shippingAddress?: {
        address?: string;
        city?: string;
        pincode?: string;
        state?: string;
    };
    customer?: {
        name?: string;
        phone?: string;
    };
};

const TRACKING_STEPS = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

function DeliveryTrackingContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<LocalOrder | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(true);
    const [progressTicks, setProgressTicks] = useState(0);

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

    const baseStep = useMemo(() => {
        if (!order?.status) return 1;
        const index = TRACKING_STEPS.findIndex((step) => step.toLowerCase() === order.status?.toLowerCase());
        return index >= 0 ? index : 1;
    }, [order]);
    const currentStep = Math.min(baseStep + progressTicks, TRACKING_STEPS.length - 1);

    useEffect(() => {
        if (!order) return;

        const interval = window.setInterval(() => {
            setProgressTicks((previousTick) => Math.min(previousTick + 1, TRACKING_STEPS.length - 1));
        }, 3000);

        return () => window.clearInterval(interval);
    }, [baseStep, order]);

    const deliveryDate = useMemo(() => {
        if (!order) return "";
        if (!order.estimatedDeliveryDate) return "";
        return new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }, [order]);

    if (isLoadingOrder) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center bg-[#0B0B0C] text-white">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#D6B25E]" />
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Loading tracking...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center bg-[#0B0B0C] px-4 text-white">
                <div className="w-full max-w-md rounded-[20px] border border-white/10 bg-white/5 p-8 text-center">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/45">Tracking unavailable</p>
                    <h2 className="mb-4 text-2xl font-heading">No order found to track.</h2>
                    <Link href="/shop">
                        <Button className="w-full bg-[#D6B25E] text-[#111] hover:bg-[#e4c676]">Continue Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const progressPercent = (currentStep / (TRACKING_STEPS.length - 1)) * 100;

    return (
        <div className="min-h-[80vh] bg-[#0B0B0C] pb-24 pt-10 font-body text-white">
            <div className="container-custom max-w-5xl">
                <FadeIn>
                    <span className="mb-4 block text-[10px] font-medium uppercase tracking-[0.34em] text-[#D6B25E] md:text-[11px]">
                        Delivery Tracking
                    </span>
                    <h1 className="mb-4 max-w-[760px] text-[40px] font-medium leading-[1.1] tracking-tight text-white md:text-[56px]">
                        Follow your order journey.
                    </h1>
                    <p className="max-w-2xl text-sm text-white/55">
                        Order {order.orderId} is currently {TRACKING_STEPS[currentStep]}.
                    </p>
                </FadeIn>

                <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <FadeIn>
                        <div className="luxury-panel rounded-[24px] border border-white/10 p-6 md:p-8">
                            <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Order ID</p>
                                    <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-white">
                                        {order.orderId}
                                    </p>
                                </div>
                                <div className="rounded-full border border-[#D6B25E]/20 bg-[#D6B25E]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#D6B25E]">
                                    {TRACKING_STEPS[currentStep]}
                                </div>
                            </div>

                            <div className="relative mb-8">
                                <div className="absolute left-4 right-4 top-6 h-px bg-white/10" />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className="absolute left-4 top-6 h-[2px] bg-[#D6B25E]"
                                />
                                <div className="relative flex items-start justify-between gap-2">
                                    {TRACKING_STEPS.map((step, index) => {
                                        const completed = index <= currentStep;
                                        return (
                                            <div key={step} className="flex flex-1 flex-col items-center text-center">
                                                <div
                                                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${completed ? "border-[#D6B25E] bg-[#D6B25E] text-[#0B0B0C]" : "border-white/10 bg-[#111] text-white/35"}`}
                                                >
                                                    {index === TRACKING_STEPS.length - 1 ? (
                                                        <CheckCircle2 size={16} />
                                                    ) : (
                                                        <Package size={16} />
                                                    )}
                                                </div>
                                                <p className={`text-[10px] uppercase tracking-[0.24em] ${completed ? "text-white" : "text-white/35"}`}>
                                                    {step}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Estimated Delivery</p>
                                    <p className="mt-2 text-lg font-medium text-white">{deliveryDate || "To be updated"}</p>
                                </div>
                                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Current Status</p>
                                    <p className="mt-2 text-lg font-medium text-white">{TRACKING_STEPS[currentStep]}</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="space-y-6">
                        <FadeIn delay={0.05}>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                                <h3 className="mb-4 text-sm uppercase tracking-[0.24em] text-white/45">Delivery Address</h3>
                                <div className="space-y-3 text-sm text-white/70">
                                    <p className="font-medium text-white">{order.customer?.name || "Customer"}</p>
                                    <p>{order.shippingAddress?.address || "Address unavailable"}</p>
                                    <p>
                                        {(order.shippingAddress?.city || "City")} - {(order.shippingAddress?.pincode || "PIN")}
                                    </p>
                                    <p>{order.customer?.phone || "Phone unavailable"}</p>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="rounded-[24px] border border-white/10 bg-[#111] p-6">
                                <div className="mb-4 flex items-center gap-3 text-[#D6B25E]">
                                    <MapPin size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.24em]">Live mock tracking</span>
                                </div>
                                <p className="text-sm text-white/65">
                                    The timeline advances automatically to simulate shipping updates for this order.
                                </p>
                                <Link href={`/order-success?orderId=${encodeURIComponent(order.orderId)}`}>
                                    <Button className="mt-6 w-full gap-2 bg-[#D6B25E] text-[#111] hover:bg-[#e4c676]">
                                        Back to Order Details
                                    </Button>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DeliveryTrackingPage() {
    return (
        <Suspense fallback={null}>
            <DeliveryTrackingContent />
        </Suspense>
    );
}
