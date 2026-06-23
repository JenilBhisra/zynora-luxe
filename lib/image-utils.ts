export type ImageFallbackType = "ring" | "diamond" | "jewelry" | "setting" | "generic";

export type ImageInput = string | string[] | null | undefined;

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;
const BROKEN_LOCAL_IMAGES = new Set([
    "/products/ring-1.jpg",
    "/products/ring-3.jpg",
    "/products/ring-4.jpg",
    "/products/necklace-1.jpg",
    "/products/necklace-2.jpg",
    "/products/setting-1.jpg",
    "/products/setting-2.jpg",
]);

function isImageUrl(src: string) {
    if (!src) return false;
    return !VIDEO_EXT_REGEX.test(src);
}

const FALLBACK_POOL: Record<ImageFallbackType, string[]> = {
    ring: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1543295204-8e6d3f3b7d66?auto=format&fit=crop&w=1400&q=80",
        "/products/ring-2.jpg",
        "/products/earrings-1.jpg",
    ],
    diamond: [
        "https://images.unsplash.com/photo-1615655114865-4cc97325775f?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80",
        "/products/loose-diamond.jpg",
    ],
    jewelry: [
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1400&q=80",
        "/products/earrings-1.jpg",
        "/products/ring-2.jpg",
    ],
    setting: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1400&q=80",
        "/products/ring-2.jpg",
        "/products/earrings-1.jpg",
    ],
    generic: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80",
        "/products/ring-2.jpg",
        "/products/earrings-1.jpg",
        "/products/loose-diamond.jpg",
    ],
};

export function inferImageFallbackType(src?: string, alt?: string): ImageFallbackType {
    const text = `${src || ""} ${alt || ""}`.toLowerCase();

    if (text.includes("diamond") || text.includes("loose")) return "diamond";
    if (text.includes("ring") || text.includes("setting") || text.includes("custom")) return "ring";
    if (text.includes("necklace") || text.includes("earring") || text.includes("bracelet") || text.includes("jewelry")) return "jewelry";
    return "generic";
}

export function getFallbackImage(type: ImageFallbackType, key = "") {
    const pool = FALLBACK_POOL[type] || FALLBACK_POOL.generic;
    if (pool.length === 1) return pool[0];

    const seed = `${type}:${key}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }

    return pool[hash % pool.length];
}

export function getFallbackImageByIndex(type: ImageFallbackType, index: number) {
    const pool = FALLBACK_POOL[type] || FALLBACK_POOL.generic;
    return pool[Math.abs(index) % pool.length];
}

export function parseImageList(images: ImageInput): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(normalizeImageSrc).filter((src): src is string => Boolean(src) && isImageUrl(src));
    if (typeof images === "string" && !images.trim().startsWith("[")) {
        const single = normalizeImageSrc(images);
        return single && isImageUrl(single) ? [single] : [];
    }

    try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) return parsed.map(normalizeImageSrc).filter((src): src is string => Boolean(src) && isImageUrl(src));
        if (typeof parsed === "string" && parsed) {
            const single = normalizeImageSrc(parsed);
            return single && isImageUrl(single) ? [single] : [];
        }
        return [];
    } catch {
        if (typeof images !== "string") return [];
        const single = normalizeImageSrc(images);
        return single && isImageUrl(single) ? [single] : [];
    }
}

export function normalizeImageSrc(value: string | null | undefined): string {
    const src = (value || "").trim();
    if (!src) return "";
    if (src === "null" || src === "undefined" || src === "[]") return "";
    if (BROKEN_LOCAL_IMAGES.has(src)) return "";
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:")) return src;
    return "";
}

export function selectCardImage(
    images: ImageInput,
    usedImages: Set<string>,
    fallbackType: ImageFallbackType,
    index: number,
    key: string,
    alt = "",
) {
    const candidates = parseImageList(images);

    for (const candidate of candidates) {
        if (!usedImages.has(candidate)) {
            usedImages.add(candidate);
            return candidate;
        }
    }

    const fallback = getFallbackImageByIndex(fallbackType, index) || getFallbackImage(fallbackType, `${key}:${alt}`);
    usedImages.add(fallback);
    return fallback;
}

export function getFallbackPool(type: ImageFallbackType): string[] {
    return FALLBACK_POOL[type] || FALLBACK_POOL.generic;
}

/**
 * Checks if a URL is a Cloudinary URL.
 */
export function isCloudinaryUrl(url?: string | null): boolean {
    if (!url) return false;
    return url.includes("res.cloudinary.com");
}

/**
 * Gets clean Cloudinary base URL and path by stripping existing transformations.
 */
export function getCleanCloudinaryPath(url: string): { baseUrl: string; cleanPath: string } {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return { baseUrl: "", cleanPath: url };
    
    const baseUrl = url.slice(0, uploadIndex + "/upload/".length);
    const rest = url.slice(uploadIndex + "/upload/".length);
    
    const segments = rest.split("/");
    const cleanSegments: string[] = [];
    let foundAssetPath = false;
    
    for (const segment of segments) {
        if (foundAssetPath) {
            cleanSegments.push(segment);
            continue;
        }
        
        // A segment starts the asset path if it is a version (v123456)
        const isVersion = /^v\d+$/.test(segment);
        
        // Or if it is a folder name that does not look like a transformation.
        // Cloudinary transformations are combinations of short keys (1-2 chars) followed by underscore.
        // We check if it matches a transformation pattern.
        const isTransformation = /^(?:[a-z]{1,2}_[a-zA-Z0-9.-]+,?)+$/.test(segment);
        
        if (isVersion || !isTransformation) {
            foundAssetPath = true;
            cleanSegments.push(segment);
        }
    }
    
    if (!foundAssetPath) {
        return { baseUrl, cleanPath: rest };
    }
    
    return { baseUrl, cleanPath: cleanSegments.join("/") };
}

/**
 * Optimizes a Cloudinary URL by injecting format, quality, and dimension transformations.
 */
export function optimizeCloudinaryUrl(
    url: string,
    sizeType: "thumbnail" | "detail" | "hero" | "logo" | "full" = "full"
): string {
    if (!url || !isCloudinaryUrl(url)) return url;
    if (url.includes("/raw/upload/")) return url; // Do not optimize raw model files
    
    const { baseUrl, cleanPath } = getCleanCloudinaryPath(url);
    if (!baseUrl) return url;
    
    // Define transformations based on size type
    let transformations = "f_auto,q_auto";
    if (sizeType === "thumbnail") {
        transformations += ",w_500,c_limit";
    } else if (sizeType === "detail") {
        transformations += ",w_1200,c_limit";
    } else if (sizeType === "hero") {
        transformations += ",w_1920,c_limit";
    } else if (sizeType === "logo") {
        transformations += ",w_200,c_limit";
    }
    
    return `${baseUrl}${transformations}/${cleanPath}`;
}