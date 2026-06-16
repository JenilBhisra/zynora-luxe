/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { OrderTable } from "./components/OrderTable";
import { getServerSession } from "@/lib/auth";

import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    let orders: any[] = [];
    try {
        orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                items: {
                    include: {
                        product: true,
                        ringConfiguration: {
                            include: {
                                diamond: true,
                                setting: true
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Failed to load orders", e);
    }

    return (
        <div>
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <p className="section-kicker mb-4">Operations</p>
                    <h1 className="section-title text-white mb-3 tracking-wide">Order Management</h1>
                    <p className="text-white/40 text-[0.95rem] tracking-wide font-light">Track, update, and manage all incoming orders.</p>
                </div>
            </header>

            <OrderTable initialOrders={orders} />
        </div>
    );
}

