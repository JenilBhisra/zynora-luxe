/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";


const prisma = new PrismaClient();

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // Retrieve existing setting details for file cleanup
        const { deleteUploadedFile, deleteUploadedFiles } = await import("@/lib/file-cleanup");
        const existing = await prisma.setting.findUnique({ where: { id } });

        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.description) updateData.description = body.description;
        if (body.category) updateData.category = body.category;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.stockCount !== undefined) updateData.stockCount = parseInt(body.stockCount);
        if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
        if (body.images !== undefined) updateData.images = typeof body.images === "string" ? body.images : JSON.stringify(body.images);
        if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
        if (body.modelUrl !== undefined) updateData.modelUrl = normalizeSettingModelUrl(body.modelUrl);
        if (body.karatPrices !== undefined) updateData.karatPrices = body.karatPrices;
        if (body.sizePrices !== undefined) updateData.sizePrices = body.sizePrices;
        if (body.supportedShapes !== undefined) updateData.supportedShapes = body.supportedShapes;

        // Perform cleanup if files have changed
        if (existing) {
            if (body.imageUrl !== undefined && existing.imageUrl && existing.imageUrl !== body.imageUrl) {
                await deleteUploadedFile(existing.imageUrl);
            }
            if (body.videoUrl !== undefined && existing.videoUrl && existing.videoUrl !== body.videoUrl) {
                await deleteUploadedFile(existing.videoUrl);
            }
            if (body.modelUrl !== undefined && existing.modelUrl && existing.modelUrl !== body.modelUrl) {
                await deleteUploadedFile(existing.modelUrl);
            }
            if (body.images !== undefined) {
                try {
                    const oldImages: string[] = JSON.parse(existing.images || "[]");
                    const newImages: string[] = typeof body.images === "string" ? JSON.parse(body.images || "[]") : body.images;
                    if (Array.isArray(oldImages) && Array.isArray(newImages)) {
                        const removed = oldImages.filter(img => !newImages.includes(img));
                        await deleteUploadedFiles(removed);
                    }
                } catch (e) {
                    console.error("[API Settings] Failed parsing images JSON for cleanup", e);
                }
            }
        }

        const setting = await prisma.setting.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, setting });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Delete associated files on disk
        const { deleteUploadedFile, deleteUploadedFiles } = await import("@/lib/file-cleanup");
        const existing = await prisma.setting.findUnique({ where: { id } });
        if (existing) {
            await deleteUploadedFile(existing.imageUrl);
            await deleteUploadedFile(existing.videoUrl);
            await deleteUploadedFile(existing.modelUrl);
            await deleteUploadedFiles(existing.images);
        }

        await prisma.setting.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        // Handle constraint errors if setting is used in orders
        return NextResponse.json({ error: "Cannot delete setting. It may be linked to existing orders." }, { status: 400 });
    }
}
