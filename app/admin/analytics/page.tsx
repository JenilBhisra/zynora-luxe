import { PrismaClient } from "@prisma/client";
import { DashboardStats } from "../components/DashboardStats";
import { getServerSession } from "@/lib/auth";

import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    let totalRevenue, totalOrders, totalUsers, totalDiamonds, totalProducts;
    let chartData;

    try {
        [totalRevenue, totalOrders, totalUsers, totalDiamonds, totalProducts] = await Promise.all([
            prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } } }),
            prisma.order.count(),
            prisma.user.count({ where: { role: 'USER' } }),
            prisma.diamond.count(),
            prisma.product.count()
        ]);

        // Get orders for the last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentOrders = await prisma.order.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        // Group data by day for chart
        const chartDataMap = new Map();
        for (let i = 0; i < 30; i++) {
            const dateStr = format(subDays(new Date(), 29 - i), 'MMM dd');
            chartDataMap.set(dateStr, { name: dateStr, revenue: 0, orders: 0 });
        }

        recentOrders.forEach(order => {
            const dateStr = format(order.createdAt, 'MMM dd');
            if (chartDataMap.has(dateStr)) {
                const existing = chartDataMap.get(dateStr);
                existing.revenue += order.totalAmount || 0;
                existing.orders += 1;
            }
        });

        chartData = Array.from(chartDataMap.values());
    } catch (e) {
        console.error("Analytics Error", e);
        return <div className="p-8 text-red-500">Failed to load analytics dashboard. Please check database connection.</div>;
    }

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-heading text-white mb-3 tracking-wide">Analytics Overview</h1>
                <p className="text-white/40 text-[0.95rem] tracking-wide font-light">Key performance metrics and revenue aggregation.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                <MetricCard title="Total Revenue" value={`₹${((totalRevenue._sum.totalAmount || 0) / 1000).toFixed(1)}k`} />
                <MetricCard title="Total Orders" value={totalOrders || 0} />
                <MetricCard title="Total Users" value={totalUsers || 0} />
                <MetricCard title="Total Diamonds" value={totalDiamonds || 0} />
                <MetricCard title="Products" value={totalProducts || 0} />
            </div>

            <div className="mb-12">
                <DashboardStats data={chartData} />
            </div>
        </div>
    );
}

function MetricCard({ title, value }: { title: string, value: string | number }) {
    return (
        <div className="bg-white/4 border border-white/8 p-6 flex flex-col justify-center items-center text-center transition-all hover:border-[#D6B25E]/25 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(214,178,94,0.08)] group">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#D6B25E]/60 font-bold mb-3 group-hover:text-[#D6B25E]/80 transition-colors">{title}</h3>
            <p className="text-3xl font-body font-bold text-white tracking-wider">{value}</p>
        </div>
    );
}
