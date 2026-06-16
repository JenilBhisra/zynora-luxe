import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "@/lib/auth";


// Extend route timeout to allow large file uploads
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const uploadType = formData.get("type") as string; // images: diamonds/settings/products, models: diamonds/settings
        const previousUrl = formData.get("previousUrl") as string;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const allowedTypes = ['diamonds', 'settings', 'products', 'homepage'];
        if (!uploadType || !allowedTypes.includes(uploadType)) {
            return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });
        }

        const kind = (formData.get("kind") as string) || "image";
        if (!["image", "video", "model"].includes(kind)) {
            return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
        }

        // Validate File Type
        const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const imageExtRegex = /\.(jpg|jpeg|png|webp)$/i;
        const videoExtRegex = /\.(mp4|webm|mov)$/i;
        const validVideoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        const modelExtRegex = /\.(glb|gltf|obj)$/i;
        const safeName = file.name.toLowerCase();

        if (kind === "image") {
            const isImageMime = validImageMimeTypes.includes(file.type);
            const isImageExt = imageExtRegex.test(safeName);
            if (!isImageMime && !isImageExt) {
                return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, and WebP are allowed." }, { status: 400 });
            }
        }

        if (kind === "model") {
            if (!['diamonds', 'settings'].includes(uploadType)) {
                return NextResponse.json({ error: "Model uploads are only allowed for settings and diamonds." }, { status: 400 });
            }
            if (!modelExtRegex.test(safeName)) {
                return NextResponse.json({ error: "Invalid model type. Only .glb, .gltf, and .obj files are allowed." }, { status: 400 });
            }
        }

        if (kind === "video") {
            if (!['products', 'settings'].includes(uploadType)) {
                return NextResponse.json({ error: "Video uploads are only allowed for products and settings." }, { status: 400 });
            }
            const isVideoMime = validVideoMimeTypes.includes(file.type);
            const isVideoExt = videoExtRegex.test(safeName);
            if (!isVideoMime && !isVideoExt) {
                return NextResponse.json({ error: "Invalid video type. Only MP4, WebM, and MOV are allowed." }, { status: 400 });
            }
        }

        // Validate File Size
        const MAX_SIZE = kind === "image" ? 50 * 1024 * 1024 : 100 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: kind === "image" ? "File size exceeds 50MB limit." : "File size exceeds 100MB limit." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Sanitize filename & create unique name
        const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const filename = `${name}-${uniqueSuffix}${ext}`;

        // Ensure directory exists
        const uploadDir = kind === "model"
            ? path.join(process.cwd(), "public", "models", uploadType)
            : path.join(process.cwd(), "public", "uploads", uploadType);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        const filePath = path.join(uploadDir, filename);
        if (!filePath.startsWith(uploadDir)) {
            return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }

        // Save file locally
        await writeFile(filePath, buffer);

        // Delete previous file if provided
        if (previousUrl && previousUrl.startsWith("/uploads/")) {
            try {
                // Remove /uploads/ and construct absolute path
                const relativePath = previousUrl.replace("/uploads/", "");
                const previousFilePath = path.join(process.cwd(), "public", "uploads", relativePath);
                
                // Make sure we only delete files inside public/uploads
                if (previousFilePath.startsWith(path.join(process.cwd(), "public", "uploads"))) {
                    const { unlink } = require("fs/promises");
                    await unlink(previousFilePath);
                }
            } catch (err) {
                console.error("Failed to delete previous file:", err);
            }
        }

        // Path to store in DB
        const publicUrl = kind === "model"
            ? `/models/${uploadType}/${filename}`
            : `/uploads/${uploadType}/${filename}`;

        return NextResponse.json({
            message: "Success",
            url: publicUrl
        }, { status: 201 });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
    }
}
