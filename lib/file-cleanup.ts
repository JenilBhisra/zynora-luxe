import { unlink } from "fs/promises";
import path from "path";

/**
 * Safely deletes a file from the public/ directory.
 * Only deletes files inside public/uploads or public/models to prevent directory traversal.
 * @param urlOrPath The relative URL or file path (e.g. "/uploads/diamonds/image-123.jpg")
 */
export async function deleteUploadedFile(urlOrPath?: string | null) {
    if (!urlOrPath || typeof urlOrPath !== "string") return;

    // Normalise slashes
    const normalized = urlOrPath.trim().replace(/\\/g, "/");

    // Enforce folder scope validation
    if (!normalized.startsWith("/uploads/") && !normalized.startsWith("/models/")) {
        return; // Don't delete default assets, external links, etc.
    }

    // Convert URL back to filesystem path relative to the public directory
    const relativeFileSystemPath = normalized.replace(/\//g, path.sep);
    const fullPath = path.join(process.cwd(), "public", relativeFileSystemPath);
    const publicDir = path.join(process.cwd(), "public");

    // Guard against path traversal attack
    if (!fullPath.startsWith(publicDir)) {
        console.warn(`[File Cleanup] Guard blocked deletion of path outside public dir: ${fullPath}`);
        return;
    }

    try {
        await unlink(fullPath);
        console.log(`[File Cleanup] Successfully deleted: ${fullPath}`);
    } catch (err: any) {
        if (err.code === "ENOENT") {
            // File does not exist, which is fine
            console.log(`[File Cleanup] File not found (ENOENT) during deletion: ${fullPath}`);
        } else {
            console.error(`[File Cleanup] Error deleting file: ${fullPath}`, err);
        }
    }
}

/**
 * Safely deletes multiple uploaded files, handling string arrays or JSON string arrays.
 */
export async function deleteUploadedFiles(urlsOrPaths?: string | string[] | null) {
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
            } catch (e) {
                // Not valid JSON, treat as a single string
                list = [trimmed];
            }
        } else {
            list = [trimmed];
        }
    }

    for (const url of list) {
        await deleteUploadedFile(url);
    }
}
