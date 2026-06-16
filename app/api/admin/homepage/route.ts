import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

// Get all homepage custom asset overrides
export async function GET() {
    try {
        const assets = await prisma.siteAsset.findMany();
        
        // Convert to key-value object for easy lookup
        const assetMap = assets.reduce((acc: Record<string, string>, asset) => {
            acc[asset.key] = asset.url;
            return acc;
        }, {});

        return NextResponse.json({ success: true, assets: assetMap });
    } catch (e) {
        console.error("[API] GET homepage assets error:", e);
        return NextResponse.json({ error: "Failed to fetch homepage assets." }, { status: 500 });
    }
}

// Upsert a homepage custom asset override
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const body = await req.json();
        const { key, url, alt } = body;

        if (!key || !url) {
            return NextResponse.json({ error: "Missing required fields: key, url" }, { status: 400 });
        }

        // Clean up old file if replacing
        const { deleteUploadedFile } = await import("@/lib/file-cleanup");
        const existing = await prisma.siteAsset.findUnique({
            where: { key }
        });
        if (existing && existing.url !== url) {
            await deleteUploadedFile(existing.url);
        }

        const asset = await prisma.siteAsset.upsert({
            where: { key },
            update: {
                url,
                alt: alt || null,
            },
            create: {
                key,
                url,
                alt: alt || null,
            },
        });

        return NextResponse.json({ success: true, asset });
    } catch (e: any) {
        console.error("[API] POST homepage assets error:", e);
        return NextResponse.json({ error: "Failed to save asset: " + (e.message || "Internal Error") }, { status: 500 });
    }
}
