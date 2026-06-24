export const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;

export interface OrderedMediaItem {
    type: "model3d" | "image" | "video";
    url: string;
    position: number;
}

export function getOrderedMedia({
    images,
    videos,
    model3d
}: {
    images?: string | string[] | null;
    videos?: string | string[] | null;
    model3d?: string | null;
}): OrderedMediaItem[] {
    const listImages: string[] = [];
    const listVideos: string[] = [];

    // Parse images helper
    const parseToList = (input: string | string[] | null | undefined, list: string[]) => {
        if (!input) return;
        if (Array.isArray(input)) {
            list.push(...input);
        } else {
            const trimmed = input.trim();
            if (trimmed.startsWith("[")) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        list.push(...parsed);
                    } else if (parsed) {
                        list.push(String(parsed));
                    }
                } catch {
                    list.push(trimmed);
                }
            } else if (trimmed) {
                if (trimmed.includes(",")) {
                    list.push(...trimmed.split(",").map(s => s.trim()).filter(Boolean));
                } else {
                    list.push(trimmed);
                }
            }
        }
    };

    parseToList(images, listImages);
    parseToList(videos, listVideos);

    const cleanImages = listImages.map(url => url.trim()).filter(Boolean);
    const cleanVideos = listVideos.map(url => url.trim()).filter(Boolean);

    const isVideoUrl = (url: string) => VIDEO_EXT_REGEX.test(url);

    // Group items strictly based on extension (mixed content handling)
    const allImages: string[] = [];
    const allVideos: string[] = [];

    cleanImages.forEach(url => {
        if (isVideoUrl(url)) {
            allVideos.push(url);
        } else {
            allImages.push(url);
        }
    });

    cleanVideos.forEach(url => {
        if (isVideoUrl(url)) {
            allVideos.push(url);
        } else {
            allImages.push(url);
        }
    });

    // Remove duplicates
    const uniqueImages = Array.from(new Set(allImages));
    const uniqueVideos = Array.from(new Set(allVideos));

    const result: { type: "model3d" | "image" | "video"; url: string }[] = [];

    // Order rules:
    // 1. 3D model
    // 2. First image
    // 3. Second image
    // 4. First video
    // 5. Remaining images in uploaded order
    // 6. Remaining videos if any

    if (model3d && model3d.trim()) {
        result.push({ type: "model3d", url: model3d.trim() });
    }

    const img1 = uniqueImages[0];
    const img2 = uniqueImages[1];
    const vid1 = uniqueVideos[0];

    if (img1) {
        result.push({ type: "image", url: img1 });
    }
    if (img2) {
        result.push({ type: "image", url: img2 });
    }
    if (vid1) {
        result.push({ type: "video", url: vid1 });
    }

    // Remaining images (index >= 2)
    const remainingImages = uniqueImages.slice(2);
    remainingImages.forEach(url => {
        result.push({ type: "image", url });
    });

    // Remaining videos (index >= 1)
    const remainingVideos = uniqueVideos.slice(1);
    remainingVideos.forEach(url => {
        result.push({ type: "video", url });
    });

    return result.map((item, index) => ({
        ...item,
        position: index + 1
    }));
}
