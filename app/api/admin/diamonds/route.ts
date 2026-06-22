/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";


const prisma = new PrismaClient();

function cleanAndValidateSku(skuInput: any) {
    if (skuInput === undefined || skuInput === null) return { sku: undefined };
    const cleaned = String(skuInput).trim().toUpperCase();
    if (cleaned === "") return { sku: null };
    if (!/^[A-Z0-9-]+$/.test(cleaned)) {
        return { error: "SKU must contain only letters, numbers, and hyphens" };
    }
    return { sku: cleaned };
}

// Create new Diamond
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // SKU validation
        let sku: string | null | undefined = undefined;
        if (body.sku !== undefined) {
            const skuRes = cleanAndValidateSku(body.sku);
            if (skuRes.error) {
                return NextResponse.json({ error: skuRes.error }, { status: 400 });
            }
            sku = skuRes.sku;

            if (sku) {
                const existingDiamond = await prisma.diamond.findUnique({
                    where: { sku }
                });
                if (existingDiamond) {
                    return NextResponse.json({ error: `SKU "${sku}" is already in use by another diamond.` }, { status: 400 });
                }
            }
        }
        // body should contain shape, carat, cut, color, clarity, cert, price, imageUrl
        const newDiamond = await prisma.diamond.create({
            data: {
                sku: sku,
                shape: body.shape,
                caratWeight: parseFloat(body.caratWeight),
                cut: body.cut,
                clarity: body.clarity,
                color: body.color,
                certification: body.certification,
                price: parseFloat(body.price),
                stockCount: body.stockCount ? parseInt(body.stockCount) : 1,
                imageUrl: body.imageUrl || null,
                modelUrl: body.modelUrl || null,
                stockStatus: "AVAILABLE"
            }
        });

        return NextResponse.json({ success: true, diamond: newDiamond });

    } catch (e) {
        console.error("Failed to add diamond", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Delete Diamond
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID req" }, { status: 400 });

        await prisma.diamond.delete({ where: { id } });
        return NextResponse.json({ success: true });

    } catch (e: any) {
        if (e.code === 'P2003') {
            return NextResponse.json({ error: "Cannot delete diamond because it is tied to an active order or configuration." }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
