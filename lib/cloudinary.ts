/**
 * lib/cloudinary.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloudinary v2 server-side utility for Zynora Luxe.
 *
 * Provides:
 *   uploadToCloudinary()       – Upload a Buffer to Cloudinary, returns secure URL
 *   deleteFromCloudinary()     – Delete an asset by public_id
 *   extractPublicIdFromUrl()   – Parse a Cloudinary URL → public_id for deletion
 *
 * Environment variables required (server-side only):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { v2 as cloudinary } from "cloudinary";

// ── Configuration ─────────────────────────────────────────────────────────────

function getCloudinaryConfig() {
    const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey     = process.env.CLOUDINARY_API_KEY;
    const apiSecret  = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            "[Cloudinary] Missing required environment variables: " +
            "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. " +
            "Please add them to your .env file and Vercel project settings."
        );
    }

    return { cloudName, apiKey, apiSecret };
}

function configureCloudinary() {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    cloudinary.config({
        cloud_name:  cloudName,
        api_key:     apiKey,
        api_secret:  apiSecret,
        secure:      true, // Always use HTTPS
    });
}

// ── Folder Mapping ────────────────────────────────────────────────────────────

/** Maps upload types to Cloudinary folder paths */
const FOLDER_MAP: Record<string, string> = {
    homepage:    "zynora/homepage",
    products:    "zynora/products",
    diamonds:    "zynora/diamonds",
    settings:    "zynora/collections",
    categories:  "zynora/categories",
    blog:        "zynora/blog",
    admin:       "zynora/admin",
};

export function getCloudinaryFolder(uploadType: string): string {
    return FOLDER_MAP[uploadType] ?? `zynora/${uploadType}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
    /** Full CDN URL with f_auto,q_auto transformations */
    url: string;
    /** Cloudinary public_id for future deletion */
    publicId: string;
    /** Original secure URL without transformations */
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

export interface UploadOptions {
    /** Upload type determines the folder: 'homepage' | 'products' | 'diamonds' | 'settings' */
    uploadType: string;
    /** Original filename used to generate the public_id */
    filename: string;
    /** Resource type: image | video | raw */
    resourceType?: "image" | "video" | "raw" | "auto";
}

/**
 * Uploads a file buffer to Cloudinary.
 * Returns a CDN-optimised URL with automatic format and quality selection.
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    options: UploadOptions
): Promise<CloudinaryUploadResult> {
    configureCloudinary();

    const { uploadType, filename, resourceType = "auto" } = options;
    const folder = getCloudinaryFolder(uploadType);

    // Sanitise filename to create a stable public_id
    const extMatch = filename.match(/\.[^/.]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : "";
    const baseName   = filename.replace(/[^a-zA-Z0-9.\-_]/g, "").replace(/\.[^/.]+$/, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    let publicId   = `${folder}/${baseName}-${uniqueSuffix}`;
    if (resourceType === "raw") {
        publicId += ext;
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id:     publicId,
                resource_type: resourceType,
                // Automatic optimisation — Cloudinary picks the best format (WebP/AVIF)
                // and quality level per device and network conditions
                transformation: resourceType === "image" || resourceType === "auto"
                    ? [{ fetch_format: "auto", quality: "auto" }]
                    : undefined,
                // Preserve the original quality in the stored asset
                overwrite: false,
            },
            (error, result) => {
                if (error || !result) {
                    reject(
                        new Error(
                            `[Cloudinary] Upload failed: ${error?.message ?? "Unknown error"}`
                        )
                    );
                    return;
                }

                // Build delivery URL with f_auto,q_auto for best performance
                const optimizedUrl = buildOptimizedUrl(result.secure_url);

                resolve({
                    url:       optimizedUrl,
                    publicId:  result.public_id,
                    secureUrl: result.secure_url,
                    width:     result.width   ?? 0,
                    height:    result.height  ?? 0,
                    format:    result.format  ?? "",
                    bytes:     result.bytes   ?? 0,
                });
            }
        );

        uploadStream.end(buffer);
    });
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Deletes an asset from Cloudinary by its public_id.
 * Silently succeeds if the asset does not exist.
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
    if (!publicId) return;

    try {
        configureCloudinary();
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (result.result !== "ok" && result.result !== "not found") {
            console.warn(`[Cloudinary] Delete returned unexpected result for "${publicId}":`, result);
        }
    } catch (err) {
        // Non-fatal: log but don't crash the request
        console.error(`[Cloudinary] Failed to delete asset "${publicId}":`, err);
    }
}

/**
 * Deletes a Cloudinary asset identified by its full URL.
 * No-ops for non-Cloudinary URLs (local paths, external URLs, etc.)
 */
export async function deleteByUrl(
    url?: string | null,
    resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
    const publicId = extractPublicIdFromUrl(url);
    if (publicId) {
        await deleteFromCloudinary(publicId, resourceType);
    }
}

// ── URL Utilities ─────────────────────────────────────────────────────────────

/**
 * Checks if a URL is a Cloudinary URL.
 */
export function isCloudinaryUrl(url?: string | null): boolean {
    if (!url) return false;
    return url.includes("res.cloudinary.com");
}

/**
 * Extracts the public_id from a Cloudinary URL.
 * Returns null for non-Cloudinary URLs.
 *
 * Example:
 *   "https://res.cloudinary.com/mycloud/image/upload/f_auto,q_auto/zynora/homepage/hero-123"
 *   → "zynora/homepage/hero-123"
 */
export function extractPublicIdFromUrl(url?: string | null): string | null {
    if (!url || !isCloudinaryUrl(url)) return null;

    try {
        // Strip query params
        const cleanUrl = url.split("?")[0];

        // Match everything after /upload/ (or /upload/<transformations>/)
        // Handles:
        //   .../upload/zynora/folder/filename.jpg
        //   .../upload/f_auto,q_auto/zynora/folder/filename.jpg
        const match = cleanUrl.match(/\/upload\/(?:[^/]+\/)*?(zynora\/.+?)(?:\.[a-z0-9]+)?$/i);
        if (match && match[1]) {
            return match[1];
        }

        // Fallback: everything after /upload/
        const uploadIndex = cleanUrl.indexOf("/upload/");
        if (uploadIndex === -1) return null;

        let publicIdWithExt = cleanUrl.slice(uploadIndex + "/upload/".length);

        // Strip leading transformation segments (e.g., "f_auto,q_auto/")
        publicIdWithExt = publicIdWithExt.replace(/^([a-z_,]+\/)+/, "");

        // Remove file extension
        const dotIndex = publicIdWithExt.lastIndexOf(".");
        return dotIndex !== -1 ? publicIdWithExt.slice(0, dotIndex) : publicIdWithExt;
    } catch {
        return null;
    }
}

/**
 * Converts a plain Cloudinary secure URL to an optimised delivery URL.
 * Inserts f_auto,q_auto transformation if not already present.
 *
 * Example:
 *   "https://res.cloudinary.com/cloud/image/upload/folder/file.jpg"
 *   → "https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto/folder/file.jpg"
 */
export function buildOptimizedUrl(secureUrl: string): string {
    if (!secureUrl || !isCloudinaryUrl(secureUrl)) return secureUrl;
    if (secureUrl.includes("f_auto") || secureUrl.includes("q_auto")) return secureUrl;
    // Do not optimize raw files (like .obj, .gltf, .glb)
    if (secureUrl.includes("/raw/upload/")) return secureUrl;

    return secureUrl.replace("/upload/", "/upload/f_auto,q_auto/");
}
