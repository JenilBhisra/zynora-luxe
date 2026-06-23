import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const DEFAULT_SHAPES = [
    { name: "Round", slug: "round", displayOrder: 1, isActive: true },
    { name: "Oval", slug: "oval", displayOrder: 2, isActive: true },
    { name: "Emerald", slug: "emerald", displayOrder: 3, isActive: true },
    { name: "Cushion", slug: "cushion", displayOrder: 4, isActive: true },
    { name: "Elongated Cushion", slug: "elongated-cushion", displayOrder: 5, isActive: true },
    { name: "Pear", slug: "pear", displayOrder: 6, isActive: true },
    { name: "Radiant", slug: "radiant", displayOrder: 7, isActive: true },
    { name: "Princess", slug: "princess", displayOrder: 8, isActive: true },
    { name: "Marquise", slug: "marquise", displayOrder: 9, isActive: true },
    { name: "Asscher", slug: "asscher", displayOrder: 10, isActive: true },
    { name: "Heart", slug: "heart", displayOrder: 11, isActive: true }
];

export async function GET() {
    try {
        let shapes = await prisma.shape.findMany({
            orderBy: {
                displayOrder: 'asc'
            }
        });

        // Auto-seed if empty
        if (shapes.length === 0) {
            await prisma.shape.createMany({
                data: DEFAULT_SHAPES
            });
            shapes = await prisma.shape.findMany({
                orderBy: {
                    displayOrder: 'asc'
                }
            });
        }

        // Fetch corresponding site asset URLs for shapes dynamically
        const shapeKeys = shapes.flatMap(s => [
            `diamond-shape-icon-${s.slug}`,
            `diamond-shape-hover-${s.slug}`
        ]);

        const assets = await prisma.siteAsset.findMany({
            where: {
                key: { in: shapeKeys }
            },
            select: {
                key: true,
                url: true
            }
        });

        const assetsMap = assets.reduce((acc: Record<string, string>, asset) => {
            acc[asset.key] = asset.url;
            return acc;
        }, {});

        const shapesWithAssets = shapes.map(shape => {
            const iconKey = `diamond-shape-icon-${shape.slug}`;
            const hoverKey = `diamond-shape-hover-${shape.slug}`;
            return {
                ...shape,
                thumbnailImageUrl: shape.thumbnailImageUrl || assetsMap[iconKey] || null,
                previewImageUrl: shape.previewImageUrl || assetsMap[hoverKey] || null
            };
        });

        return NextResponse.json(shapesWithAssets);
    } catch (error) {
        console.error("Failed to fetch shapes:", error);
        return NextResponse.json(
            { error: "Failed to fetch shapes" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, slug, imageUrl, thumbnailImageUrl, previewImageUrl, isActive, displayOrder } = body;

        if (id) {
            // Update
            const updated = await prisma.shape.update({
                where: { id },
                data: {
                    name,
                    slug,
                    imageUrl,
                    thumbnailImageUrl,
                    previewImageUrl,
                    isActive: isActive ?? true,
                    displayOrder: Number(displayOrder) || 0
                }
            });
            return NextResponse.json(updated);
        } else {
            // Create
            const created = await prisma.shape.create({
                data: {
                    name,
                    slug,
                    imageUrl,
                    thumbnailImageUrl,
                    previewImageUrl,
                    isActive: isActive ?? true,
                    displayOrder: Number(displayOrder) || 0
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error("Failed to save shape:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save shape" },
            { status: 500 }
        );
    }
}
