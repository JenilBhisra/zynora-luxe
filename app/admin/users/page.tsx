/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { UsersTable } from "./components/UsersTable";
import { getServerSession } from "@/lib/auth";

import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    let users: any[] = [];
    try {
        users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                orders: {
                    select: { id: true, totalAmount: true, status: true }
                }
            }
        });
    } catch (e) {
        console.error("Failed to load users", e);
    }

    return (
        <div>
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-3 tracking-wide">Customer Base</h1>
                    <p className="text-white/40 text-[0.95rem] tracking-wide font-light">Monitor registered users and track their lifetime spending value.</p>
                </div>
            </header>

            <UsersTable initialUsers={users} />
        </div>
    );
}
