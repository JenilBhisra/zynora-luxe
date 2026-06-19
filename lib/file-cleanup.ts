/**
 * lib/file-cleanup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified file/asset deletion utility.
 *
 * Supports two storage backends:
 *   1. Cloudinary  – for URLs starting with res.cloudinary.com (new)
 *   2. Local disk  – for legacy /uploads/ paths (old, kept for backwards compat)
 *
 * All existing callers (diamonds, products, settings, homepage routes)
 * work without any changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { isCloudinaryUrl, deleteByUrl as deleteCloudinaryByUrl } from "@/lib/cloudinary";

// ── Cloudinary-aware deletion ─────────────────────────────────────────────────

/**
 * Detects whether a URL is a Cloudinary URL or a legacy local path,
 * then dispatches to the correct deletion method.
 *
 * @param urlOrPath  e.g. "https://res.cloudinary.com/..." or "/uploads/diamonds/file.jpg"
 */
export async function deleteUploadedFile(urlOrPath?: string | null): Promise<void> {
    if (!urlOrPath || typeof urlOrPath !== "string") return;

    const normalized = urlOrPath.trim();

    // ── Cloudinary URL ─────────────────────────────────────────────────────
    if (isCloudinaryUrl(normalized)) {
        await deleteCloudinaryByUrl(normalized);
        return;
    }

    // ── Legacy local /uploads/ or /models/ path ────────────────────────────
    if (!normalized.startsWith("/uploads/") && !normalized.startsWith("/models/")) {
        return; // Not a managed path — skip (default assets, external URLs, base64, etc.)
    }

    // Dynamic import to avoid loading 'fs' in edge/browser environments
    try {
        const { unlink } = await import("fs/promises");
        const { default: path } = await import("path");

        const relativeFileSystemPath = normalized.replace(/\//g, path.sep);
        const fullPath = path.join(process.cwd(), "public", relativeFileSystemPath);
        const publicDir = path.join(process.cwd(), "public");

        // Guard against path traversal
        if (!fullPath.startsWith(publicDir)) {
            console.warn(`[File Cleanup] Blocked deletion outside public dir: ${fullPath}`);
            return;
        }

        await unlink(fullPath);
        console.log(`[File Cleanup] Deleted local file: ${fullPath}`);
    } catch (err: any) {
        if (err.code === "ENOENT") {
            console.log(`[File Cleanup] File not found (already deleted): ${urlOrPath}`);
        } else {
            console.error(`[File Cleanup] Error deleting local file: ${urlOrPath}`, err);
        }
    }
}

/**
 * Deletes multiple uploaded files/assets.
 * Accepts a string array, a JSON string array, or a single string path/URL.
 */
export async function deleteUploadedFiles(urlsOrPaths?: string | string[] | null): Promise<void> {
    if (!urlsOrPaths) return;

    let list: string[] = [];

    if (Array.isArray(urlsOrPaths)) {
        list = urlsOrPaths;
    } else if (typeof urlsOrPaths === "string") {
        const trimmed = urlsOrPaths.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    list = parsed.filter(item => typeof item === "string");
                }
            } catch {
                list = [trimmed];
            }
        } else {
            list = [trimmed];
        }
    }

    // Delete sequentially to avoid Cloudinary rate-limit issues
    for (const url of list) {
        await deleteUploadedFile(url);
    }
}
