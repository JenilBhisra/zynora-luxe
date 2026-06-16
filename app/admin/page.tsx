/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { DashboardStats } from "./components/DashboardStats";
import { getServerSession } from "@/lib/auth";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const session = await getServerSession();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    let ordersCount = 0, diamondsCount = 0, revenueAmount = 0, pendingOrders = 0, usersCount = 0;
    let chartData: any[] = [];
    let recentOrders: any[] = [];

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [ordersRes, diamondsRes, revenueRes, pendingRes, usersRes, recentRes, last30DaysOrders] = await Promise.all([
            prisma.order.count(),
            prisma.diamond.count({ where: { stockStatus: "AVAILABLE" } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: "PAID" }
            }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.user.count(),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: true }
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true, totalAmount: true, status: true }
            })
        ]);

        ordersCount = ordersRes;
        diamondsCount = diamondsRes;
        revenueAmount = revenueRes._sum.totalAmount || 0;
        pendingOrders = pendingRes;
        usersCount = usersRes;
        recentOrders = recentRes;

        // Process last 30 days data
        const dateMap = new Map();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            dateMap.set(dateStr, { name: dateStr, revenue: 0, orders: 0 });
        }

        last30DaysOrders.forEach(order => {
            const d = new Date(order.createdAt);
            const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            if (dateMap.has(dateStr)) {
                const existing = dateMap.get(dateStr);
                existing.orders += 1;
                if (order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED") {
                    existing.revenue += order.totalAmount;
                }
            }
        });

        chartData = Array.from(dateMap.values());

    } catch (e) {
        console.error("Dashboard DB fetch error:", e);
    }

    return (
        <div className="space-y-10">
            <header className="mb-10">
                <span className="text-[11px] tracking-[0.3em] font-bold text-[#D6B25E]/70 uppercase mb-4 block">Administration</span>
                <h1 className="text-[40px] leading-[1.1] font-medium tracking-tight text-white mb-3">Workspace Overview</h1>
                <p className="text-white/35 text-[15px] max-w-[640px]">Welcome to the ZYNORA LUXE administrative console.</p>
            </header>

            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KpiCard title="Total Revenue" value={`₹${revenueAmount.toLocaleString('en-IN')}`} />
                <KpiCard title="Total Orders" value={ordersCount.toLocaleString()} />
                <KpiCard title="Pending Fulfillment" value={pendingOrders.toLocaleString()} isAlert={pendingOrders > 0} />
                <KpiCard title="Active Diamonds" value={diamondsCount.toLocaleString()} />
                <KpiCard title="Total Users" value={usersCount.toLocaleString()} />
            </div>

            {/* Dashboard Visualizations Block */}
            <div className="mt-12">
                <DashboardStats data={chartData} />
            </div>

            {/* Recent Orders Table */}
            <div className="mt-12 bg-white/4 border border-white/8 p-8">
                <h3 className="uppercase tracking-[0.06em] text-[12px] font-bold text-[#D6B25E]/70 mb-8">Recent Orders</h3>
                <div className="overflow-x-auto custom-scrollbar pb-4">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-[#D6B25E]/55 uppercase tracking-widest bg-white/3 border-y border-white/8">
                            <tr>
                                <th className="px-6 py-5 font-bold">Order ID</th>
                                <th className="px-6 py-5 font-bold">Customer</th>
                                <th className="px-6 py-5 font-bold">Date</th>
                                <th className="px-6 py-5 font-bold">Amount</th>
                                <th className="px-6 py-5 font-bold">Status</th>
                                <th className="px-6 py-5 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                    <td className="px-6 py-5 font-medium text-white tracking-wide">{order.id}</td>
                                    <td className="px-6 py-5 text-white/55 font-light">{order.user?.name || 'Guest'}</td>
                                    <td className="px-6 py-5 text-white/55 font-light">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-5 text-[#D6B25E] font-bold tracking-wide">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold rounded-sm border ${order.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            order.status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Link href={`/admin/orders?id=${order.id}`} className="text-white/30 hover:text-[#D6B25E] transition-colors inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest no-link-underline">
                                            <Eye size={16} /> View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-white/25 tracking-widest uppercase text-xs">No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, trend, isAlert }: { title: string, value: string, trend?: string, isAlert?: boolean }) {
    return (
        <div className="bg-white/4 border border-white/8 p-7 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-[#D6B25E]/25 hover:shadow-[0_8px_30px_rgba(214,178,94,0.08)]">
            <h3 className="text-[10px] uppercase tracking-[0.22em] text-[#D6B25E]/60 font-bold mb-3">{title}</h3>
            <p className="text-[28px] font-medium text-white tracking-tight">{value}</p>

            {trend && (
                <div className="absolute top-7 right-6 text-[10px] uppercase tracking-widest font-bold text-[#D6B25E] bg-[#D6B25E]/10 border border-[#D6B25E]/20 px-2 py-1 rounded-sm">
                    {trend}
                </div>
            )}
            {isAlert && (
                <div className="absolute top-7 right-6 text-[10px] uppercase tracking-widest font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-sm animate-pulse">
                    Action Required
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D6B25E]/0 via-[#D6B25E]/40 to-[#D6B25E]/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
    );
}
