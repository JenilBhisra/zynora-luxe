/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { ProductTable } from "./components/ProductTable";
import { getServerSession } from "@/lib/auth";

import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    let products: any[] = [];
    let categories: any[] = [];

    try {
        products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: { category: true }
        });

        categories = await prisma.category.findMany();
    } catch (e) {
        console.error("Failed to load products/categories", e);
    }

    return (
        <div>
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <p className="section-kicker mb-4">Catalog</p>
                    <h1 className="section-title text-white mb-3 tracking-wide">Showcase Products</h1>
                    <p className="text-white/40 text-[0.95rem] tracking-wide font-light">Manage finished jewelry, pre-set rings, and inventory limits.</p>
                </div>
            </header>

            <ProductTable initialProducts={products} categories={categories} />
        </div>
    );
}
