"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getFallbackImage, getFallbackPool, inferImageFallbackType, normalizeImageSrc, type ImageFallbackType } from "@/lib/image-utils";

type SmartImageProps = Omit<ImageProps, "src"> & {
    src: string;
    fallbackType?: ImageFallbackType;
    showLoader?: boolean;
    imageKey?: string;
};

export function SmartImage({
    src,
    alt,
    fallbackType = "generic",
    className,
    showLoader = true,
    imageKey,
    ...props
}: SmartImageProps) {
    const resolvedFallbackType = useMemo(() => fallbackType || inferImageFallbackType(src, alt), [fallbackType, src, alt]);
    const fallback = useMemo(() => getFallbackImage(resolvedFallbackType, imageKey || `${src || ""}:${alt || ""}`), [resolvedFallbackType, imageKey, src, alt]);
    const fallbackPool = useMemo(() => getFallbackPool(resolvedFallbackType), [resolvedFallbackType]);

    const resolvedSrc = useMemo(() => {
        const normalized = normalizeImageSrc(src);
        return normalized || fallback;
    }, [src, fallback]);

    const [imgSrc, setImgSrc] = useState(resolvedSrc);
    const [isLoading, setIsLoading] = useState(true);
    const [fallbackCursor, setFallbackCursor] = useState(0);

    useEffect(() => {
        setImgSrc((prev) => (prev === resolvedSrc ? prev : resolvedSrc));
        setIsLoading(true);
        setFallbackCursor(0);
    }, [resolvedSrc]);

    const computedSizes = props.fill ? (props.sizes || "100vw") : props.sizes;

    return (
        <>
            {showLoader && isLoading && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200" />
            )}
            <Image
                {...props}
                src={imgSrc || fallback}
                alt={alt}
                className={className}
                sizes={computedSizes}
                loading={props.priority ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    if (imgSrc !== fallback) {
                        setImgSrc(fallback);
                        return;
                    }

                    const nextIndex = fallbackCursor + 1;
                    if (nextIndex < fallbackPool.length) {
                        setFallbackCursor(nextIndex);
                        setImgSrc(fallbackPool[nextIndex]);
                        return;
                    }

                    setImgSrc("/products/ring-2.jpg");
                    setIsLoading(false);
                }}
            />
        </>
    );
}
