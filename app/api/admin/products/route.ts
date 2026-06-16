/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // Need to find category by name/slug handling since Prisma requires ID
        let category = await prisma.category.findUnique({ where: { name: body.categoryId } });
        if (!category) {
            // Lazy create category if it doesn't exist
            category = await prisma.category.create({
                data: {
                    name: body.categoryId,
                    slug: body.categoryId.toLowerCase().replace(/\s+/g, '-')
                }
            });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: body.name,
                slug: body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
                description: body.description,
                price: parseFloat(body.price),
                categoryId: category.id,
                metalType: body.metalType,
                stockCount: parseInt(body.stockCount) || 1,
                images: body.images || "[]",
                karatPrices: body.karatPrices || "{}"
            },
            include: { category: true }
        });

        return NextResponse.json({ success: true, product: newProduct });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const body = await req.json();
        const updateData: any = {};
        if (body.karatPrices !== undefined) updateData.karatPrices = body.karatPrices;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);

        const product = await prisma.product.update({ where: { id }, data: updateData, include: { category: true } });
        return NextResponse.json({ success: true, product });
    } catch (e: any) {
        return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "ID req" }, { status: 400 });

        // Delete associated files on disk
        const { deleteUploadedFiles } = await import("@/lib/file-cleanup");
        const existing = await prisma.product.findUnique({ where: { id } });
        if (existing) {
            await deleteUploadedFiles(existing.images);
        }

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
