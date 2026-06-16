"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth-flow";
import { FadeIn } from "@/components/FadeIn";

type OrderItem = {
    id: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
};

type Order = {
    orderId: string;
    createdAt: string;
    total: number;
    status: "Processing" | "Shipped" | "Delivered" | string;
    items: OrderItem[];
    userId?: string;
};

export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        try {
            const raw = window.localStorage.getItem("orders");
            const parsed = raw ? (JSON.parse(raw) as Order[]) : [];
            const current = getCurrentUser();
            const visible = current ? parsed.filter((o) => !o.userId || o.userId === current.id) : parsed;
            setOrders(visible.reverse());
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const statusColor = (status: string) => {
        if (status.toLowerCase() === "processing") return "bg-[#D6B25E] text-[#0B0B0C]";
        if (status.toLowerCase() === "shipped") return "bg-blue-500 text-white";
        if (status.toLowerCase() === "delivered") return "bg-green-500 text-white";
        return "bg-gray-500 text-white";
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#0B0B0C] text-white">
                <div className="animate-pulse text-center">
                    <div className="h-8 w-8 rounded-full bg-[#D6B25E] mx-auto mb-4" />
                    <p className="text-sm uppercase tracking-wider">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#0B0B0C] text-white px-4">
                <div className="max-w-2xl rounded-[18px] bg-[#0B0B0C]/60 border border-white/6 p-10 text-center">
                    <h1 className="mb-3 text-3xl font-heading">My Orders</h1>
                    <p className="mb-6 text-sm text-white/60">No orders yet — explore our collection</p>
                    <Link href="/shop">
                        <Button className="bg-[#D6B25E] text-[#0B0B0C]">Shop Now</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-[#0B0B0C] pb-24 pt-10 text-white">
            <div className="container-custom max-w-5xl">
                <FadeIn>
                    <h1 className="mb-6 text-4xl font-heading">My Orders</h1>
                </FadeIn>

                <div className="grid gap-6">
                    {orders.map((order) => (
                        <FadeIn key={order.orderId}>
                            <div className="rounded-[18px] border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-20">
                                        <SmartImage src={order.items[0]?.image || "/assets/placeholder.png"} alt={order.items[0]?.name || "Item"} width={80} height={80} className="rounded-[12px] object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/60">Order ID</p>
                                        <p className="font-mono font-bold">{order.orderId}</p>
                                        <p className="text-sm text-white/50">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-white/60">Total</p>
                                        <p className="font-bold">₹{order.total.toLocaleString("en-IN")}</p>
                                    </div>

                                    <div>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link href={`/order-success?orderId=${encodeURIComponent(order.orderId)}`}>
                                            <Button className="bg-transparent border border-white/10 text-white/90">View Details</Button>
                                        </Link>
                                        <Button className="bg-[#D6B25E] text-[#0B0B0C]" onClick={() => router.push(`/track-order?orderId=${encodeURIComponent(order.orderId)}`)}>
                                            Track Order
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </div>
    );
}
