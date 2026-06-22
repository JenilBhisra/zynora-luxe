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

function normalizeSettingModelUrl(input?: string): string {
    if (!input) return "";
    const value = input.trim().replace(/\\/g, "/");
    if (value.startsWith("/models/settings/")) return value;
    if (value.startsWith("models/settings/")) return `/${value}`;
    const publicIdx = value.indexOf("/public/models/settings/");
    if (publicIdx !== -1) return value.slice(publicIdx + "/public".length);
    const modelsIdx = value.indexOf("/models/settings/");
    if (modelsIdx !== -1) return value.slice(modelsIdx);
    return "";
}

// GET all settings (handled primarily by server components, but good to have)
export async function GET() {
    try {
        const settings = await prisma.setting.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ settings });
    } catch {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST a new setting
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
                const existingSetting = await prisma.setting.findUnique({
                    where: { sku }
                });
                if (existingSetting) {
                    return NextResponse.json({ error: `SKU "${sku}" is already in use by another setting.` }, { status: 400 });
                }
            }
        }

        const setting = await prisma.setting.create({
            data: {
                sku: sku,
                name: body.name,
                description: body.description,
                category: body.category,
                price: parseFloat(body.price),
                stockCount: body.stockCount ? parseInt(body.stockCount) : 1,
                imageUrl: body.imageUrl || "",
                images: body.images || "[]",
                videoUrl: body.videoUrl || "",
                modelUrl: normalizeSettingModelUrl(body.modelUrl),
                karatPrices: body.karatPrices || "{}",
                availableMetals: body.availableMetals || "",
                goldPrice: body.goldPrice !== undefined && body.goldPrice !== null ? parseFloat(body.goldPrice) : null,
                silverPrice: body.silverPrice !== undefined && body.silverPrice !== null ? parseFloat(body.silverPrice) : null,
                platinumPrice: body.platinumPrice !== undefined && body.platinumPrice !== null ? parseFloat(body.platinumPrice) : null,
                sizePrices: body.sizePrices || "{}",
                supportedShapes: body.supportedShapes || "[]"
            }
        });

        return NextResponse.json({ success: true, setting });
    } catch (e) {
        console.error("Failed to create setting:", e);
        return NextResponse.json({ error: "Failed to create setting", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
