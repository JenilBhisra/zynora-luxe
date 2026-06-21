/**
 * app/api/admin/upload/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin file upload endpoint — now backed by Cloudinary CDN.
 *
 * Previous: wrote files to /public/uploads/ (ephemeral on Vercel) or fell back
 *           to storing base64 data URLs in the database.
 * Now:      uploads directly to Cloudinary, returns a permanent CDN URL.
 *
 * Response shape is unchanged: { url: "https://res.cloudinary.com/..." }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { uploadToCloudinary, deleteByUrl } from "@/lib/cloudinary";

// Allow large file uploads (Vercel default is 4.5 MB)
export const maxDuration = 60;

// ── Valid upload categories ───────────────────────────────────────────────────
const ALLOWED_TYPES = ["diamonds", "settings", "products", "homepage", "shapes"] as const;
type UploadType = typeof ALLOWED_TYPES[number];

const ALLOWED_KINDS = ["image", "video", "model"] as const;
type UploadKind = typeof ALLOWED_KINDS[number];

// ── MIME / extension validators ───────────────────────────────────────────────
const VALID_IMAGE_MIME  = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXT_RE      = /\.(jpg|jpeg|png|webp)$/i;
const VIDEO_EXT_RE      = /\.(mp4|webm|mov)$/i;
const VALID_VIDEO_MIME  = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MODEL_EXT_RE      = /\.(glb|gltf|obj)$/i;

const MAX_IMAGE_BYTES   = 50  * 1024 * 1024; // 50 MB
const MAX_OTHER_BYTES   = 100 * 1024 * 1024; // 100 MB

// ── POST /api/admin/upload ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const file        = formData.get("file") as File | null;
    const uploadType  = formData.get("type") as string | null;
    const previousUrl = formData.get("previousUrl") as string | null;
    const kind        = (formData.get("kind") as string | null) ?? "image";

    // ── Validate file ─────────────────────────────────────────────────────────
    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    if (!uploadType || !(ALLOWED_TYPES as readonly string[]).includes(uploadType)) {
        return NextResponse.json(
            { error: `Invalid upload type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
            { status: 400 }
        );
    }

    if (!(ALLOWED_KINDS as readonly string[]).includes(kind)) {
        return NextResponse.json(
            { error: `Invalid upload kind. Allowed: ${ALLOWED_KINDS.join(", ")}` },
            { status: 400 }
        );
    }

    const fileName = file.name ?? "uploaded-file";
    const safeName = fileName.toLowerCase();

    // ── File type validation ──────────────────────────────────────────────────
    if (kind === "image") {
        if (!VALID_IMAGE_MIME.has(file.type) && !IMAGE_EXT_RE.test(safeName)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPG, PNG, and WebP images are allowed." },
                { status: 400 }
            );
        }
    }

    if (kind === "model") {
        if (!["diamonds", "settings"].includes(uploadType)) {
            return NextResponse.json(
                { error: "3D model uploads are only allowed for settings and diamonds." },
                { status: 400 }
            );
        }
        if (!MODEL_EXT_RE.test(safeName)) {
            return NextResponse.json(
                { error: "Invalid model format. Only .glb, .gltf, and .obj files are allowed." },
                { status: 400 }
            );
        }
    }

    if (kind === "video") {
        if (!["products", "settings"].includes(uploadType)) {
            return NextResponse.json(
                { error: "Video uploads are only allowed for products and settings." },
                { status: 400 }
            );
        }
        if (!VALID_VIDEO_MIME.has(file.type) && !VIDEO_EXT_RE.test(safeName)) {
            return NextResponse.json(
                { error: "Invalid video format. Only MP4, WebM, and MOV are allowed." },
                { status: 400 }
            );
        }
    }

    // ── File size validation ──────────────────────────────────────────────────
    const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_OTHER_BYTES;
    if (file.size > maxBytes) {
        const limitMB = maxBytes / (1024 * 1024);
        return NextResponse.json(
            { error: `File exceeds ${limitMB} MB size limit.` },
            { status: 400 }
        );
    }

    // ── Read file into buffer ─────────────────────────────────────────────────
    let buffer: Buffer;
    try {
        buffer = Buffer.from(await file.arrayBuffer());
    } catch {
        return NextResponse.json({ error: "Failed to read uploaded file." }, { status: 500 });
    }

    // ── Map upload kind → Cloudinary resource_type ────────────────────────────
    const resourceType: "image" | "video" | "raw" =
        kind === "video" ? "video" :
        kind === "model" ? "raw"   :
        "image";

    // ── Upload to Cloudinary ──────────────────────────────────────────────────
    let result;
    try {
        result = await uploadToCloudinary(buffer, {
            uploadType: uploadType as UploadType,
            filename:   fileName,
            resourceType,
        });
    } catch (err: any) {
        console.error("[Upload] Cloudinary upload error:", err);
        return NextResponse.json(
            { error: err?.message ?? "Cloudinary upload failed. Check server logs." },
            { status: 500 }
        );
    }

    // ── Delete previous Cloudinary asset (async, non-blocking) ───────────────
    if (previousUrl) {
        // Fire-and-forget — don't block the response on deletion
        deleteByUrl(previousUrl, resourceType).catch(err =>
            console.error("[Upload] Failed to delete previous Cloudinary asset:", err)
        );
    }

    // ── Return CDN URL ────────────────────────────────────────────────────────
    return NextResponse.json(
        { message: "Success", url: result.url },
        { status: 201 }
    );
}
