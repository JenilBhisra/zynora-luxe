/**
 * Client-side image compression utility using Canvas.
 * Resizes the image to fit within maxWidth and maxHeight (maintaining aspect ratio),
 * and compresses it to a JPEG format with a specified quality level.
 */
export function compressImage(file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
        // Safe check for SSR/server environments or non-image files
        if (typeof window === "undefined" || !file || !file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Scale down if image dimensions exceed limits
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(file); // Fallback to original file
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Replace extension with .jpg
                            const name = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                            const compressedFile = new File([blob], name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file); // Fallback
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => {
                resolve(file); // Fallback
            };
        };
        reader.onerror = () => {
            resolve(file); // Fallback
        };
    });
}
