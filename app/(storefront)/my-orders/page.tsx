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
        if (status.toLowerCase() === "processing") return "bg-amber-50 text-amber-700 border border-amber-200";
        if (status.toLowerCase() === "shipped") return "bg-blue-50 text-blue-700 border border-blue-250";
        if (status.toLowerCase() === "delivered") return "bg-green-50 text-green-700 border border-green-250";
        return "bg-gray-50 text-gray-700 border border-gray-200";
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-white text-zinc-900">
                <div className="animate-pulse text-center">
                    <div className="h-8 w-8 rounded-full bg-[#C9A14A] mx-auto mb-4" />
                    <p className="text-sm uppercase tracking-wider text-zinc-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-white text-zinc-900 px-4">
                <div className="max-w-2xl w-full rounded-[18px] bg-zinc-50 border border-zinc-200 p-10 text-center shadow-sm">
                    <h1 className="mb-3 text-3xl font-heading text-zinc-900">My Orders</h1>
                    <p className="mb-6 text-sm text-zinc-500">No orders yet — explore our collection</p>
                    <Link href="/shop">
                        <Button className="bg-[#C9A14A] text-white hover:bg-[#B58F3B]">Shop Now</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-white pb-24 pt-10 text-zinc-900">
            <div className="container-custom max-w-5xl">
                <FadeIn>
                    <h1 className="mb-6 text-4xl font-heading text-zinc-900">My Orders</h1>
                </FadeIn>

                <div className="grid gap-6">
                    {orders.map((order) => (
                        <FadeIn key={order.orderId}>
                            <div className="rounded-[18px] border border-zinc-200 bg-zinc-50/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-20">
                                        <SmartImage src={order.items[0]?.image || "/assets/placeholder.png"} alt={order.items[0]?.name || "Item"} width={80} height={80} sizeType="thumbnail" className="rounded-[12px] object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Order ID</p>
                                        <p className="font-mono font-bold text-zinc-900">{order.orderId}</p>
                                        <p className="text-sm text-zinc-400">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-zinc-500">Total</p>
                                        <p className="font-bold text-zinc-900">₹{order.total.toLocaleString("en-IN")}</p>
                                    </div>

                                    <div>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link href={`/order-success?orderId=${encodeURIComponent(order.orderId)}`}>
                                            <Button className="bg-transparent border border-zinc-200 text-zinc-700 hover:bg-zinc-50">View Details</Button>
                                        </Link>
                                        <Button className="bg-[#C9A14A] text-white hover:bg-[#B58F3B]" onClick={() => router.push(`/track-order?orderId=${encodeURIComponent(order.orderId)}`)}>
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
