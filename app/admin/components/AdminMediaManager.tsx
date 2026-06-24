"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Play, X, Upload, RotateCw, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { getOrderedMedia } from "@/lib/media-utils";

export interface UploadingItem {
    id: string; // url or temp ID
    file?: File;
    name: string;
    type: "image" | "video" | "model3d";
    status: "uploading" | "success" | "failed";
    progress: number;
    url?: string;
    error?: string;
    previewUrl?: string; // local blob URL
}

interface AdminMediaManagerProps {
    uploadType: "diamonds" | "settings" | "products";
    existingImages?: string[];
    existingVideos?: string[];
    existingModel3d?: string | null;
    onMediaChange: (media: { images: string[]; videos: string[]; model3d: string | null }) => void;
    onUploadingStatusChange: (isUploading: boolean) => void;
}

export default function AdminMediaManager({
    uploadType,
    existingImages = [],
    existingVideos = [],
    existingModel3d = null,
    onMediaChange,
    onUploadingStatusChange
}: AdminMediaManagerProps) {
    const [mediaItems, setMediaItems] = useState<UploadingItem[]>([]);
    
    // Track initialized URLs to avoid re-populating on every props update
    const initializedRef = useRef(false);

    // Initialize list from existing database values on first mount or reset
    useEffect(() => {
        if (initializedRef.current) return;
        
        const items: UploadingItem[] = [];
        if (existingModel3d) {
            items.push({
                id: existingModel3d,
                name: existingModel3d.split("/").pop() || "3D Model",
                type: "model3d",
                status: "success",
                progress: 100,
                url: existingModel3d
            });
        }
        existingImages.forEach((url) => {
            if (url) {
                items.push({
                    id: url,
                    name: url.split("/").pop() || "Image",
                    type: "image",
                    status: "success",
                    progress: 100,
                    url
                });
            }
        });
        existingVideos.forEach((url) => {
            if (url) {
                items.push({
                    id: url,
                    name: url.split("/").pop() || "Video",
                    type: "video",
                    status: "success",
                    progress: 100,
                    url
                });
            }
        });
        setMediaItems(items);
        initializedRef.current = true;
    }, [existingImages, existingVideos, existingModel3d]);

    // Track active uploading status to report back to parent form
    useEffect(() => {
        const isAnyUploading = mediaItems.some(item => item.status === "uploading");
        onUploadingStatusChange(isAnyUploading);
    }, [mediaItems, onUploadingStatusChange]);

    // Clean up local blob object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            mediaItems.forEach(item => {
                if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
        };
    }, []);

    // Report success URLs back to parent
    const triggerChange = useCallback((items: UploadingItem[]) => {
        const successItems = items.filter(item => item.status === "success" && item.url);
        const images = successItems.filter(item => item.type === "image").map(item => item.url!);
        const videos = successItems.filter(item => item.type === "video").map(item => item.url!);
        const model3d = successItems.find(item => item.type === "model3d")?.url || null;
        onMediaChange({ images, videos, model3d });
    }, [onMediaChange]);

    const handleUploadFile = useCallback((file: File, type: "image" | "video" | "model3d") => {
        const tempId = Math.random().toString(36).substring(7) + "_" + Date.now();
        const previewUrl = type !== "model3d" ? URL.createObjectURL(file) : undefined;

        const newTask: UploadingItem = {
            id: tempId,
            file,
            name: file.name,
            type,
            status: "uploading",
            progress: 0,
            previewUrl
        };

        setMediaItems((prev) => {
            const next = [...prev, newTask];
            // If it's a 3D model, we enforce single 3D model limit by removing any other model
            if (type === "model3d") {
                return next.filter(item => item.type !== "model3d" || item.id === tempId);
            }
            return next;
        });

        // Use XMLHttpRequest to track progress in real-time
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", uploadType);
        
        let apiKind = "image";
        if (type === "video") apiKind = "video";
        if (type === "model3d") apiKind = "model";
        formData.append("kind", apiKind);

        xhr.open("POST", "/api/admin/upload");

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setMediaItems((prev) =>
                    prev.map((item) => (item.id === tempId ? { ...item, progress } : item))
                );
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.url) {
                        setMediaItems((prev) => {
                            const updated = prev.map((item) =>
                                item.id === tempId
                                    ? { ...item, status: "success" as const, progress: 100, url: response.url }
                                    : item
                            );
                            triggerChange(updated);
                            return updated;
                        });
                    } else {
                        throw new Error("Missing url in response");
                    }
                } catch {
                    setMediaItems((prev) =>
                        prev.map((item) =>
                            item.id === tempId ? { ...item, status: "failed" as const, error: "Upload failed" } : item
                        )
                    );
                    toast.error(`Upload response error for ${file.name}`);
                }
            } else {
                let errorText = "Upload failed";
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) errorText = response.error;
                } catch {}
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === tempId ? { ...item, status: "failed" as const, error: errorText } : item
                    )
                );
                toast.error(errorText);
            }
        };

        xhr.onerror = () => {
            setMediaItems((prev) =>
                prev.map((item) =>
                    item.id === tempId ? { ...item, status: "failed" as const, error: "Network error" } : item
                )
            );
            toast.error(`Network error uploading ${file.name}`);
        };

        xhr.send(formData);
    }, [uploadType, triggerChange]);

    const handleFileSelection = (type: "image" | "video" | "model3d") => (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const imageTypes = ["image/jpeg", "image/png", "image/webp"];
        const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
        
        for (const file of files) {
            if (type === "image") {
                if (!imageTypes.includes(file.type) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
                    toast.error(`Invalid image file type: ${file.name}`);
                    continue;
                }
                if (file.size > 50 * 1024 * 1024) {
                    toast.error(`Image exceeds 50MB limit: ${file.name}`);
                    continue;
                }
            } else if (type === "video") {
                if (!videoTypes.includes(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
                    toast.error(`Invalid video file type: ${file.name}`);
                    continue;
                }
                if (file.size > 30 * 1024 * 1024) {
                    toast.error(`Video exceeds 30MB limit: ${file.name}`);
                    continue;
                }
            } else if (type === "model3d") {
                if (!/\.(glb|gltf|obj)$/i.test(file.name)) {
                    toast.error(`Invalid 3D model format: ${file.name}`);
                    continue;
                }
                if (file.size > 30 * 1024 * 1024) {
                    toast.error(`3D model exceeds 30MB limit: ${file.name}`);
                    continue;
                }
            }
            handleUploadFile(file, type);
        }
        e.target.value = "";
    };

    const handleRemove = (itemId: string) => {
        setMediaItems((prev) => {
            const item = prev.find(x => x.id === itemId);
            if (item?.previewUrl && item.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(item.previewUrl);
            }
            const updated = prev.filter((x) => x.id !== itemId);
            triggerChange(updated);
            return updated;
        });
    };

    const handleRetry = (item: UploadingItem) => {
        if (!item.file) return;
        handleRemove(item.id);
        handleUploadFile(item.file, item.type);
    };

    // Calculate ordered items to show in the 2-column admin preview grid
    const getOrderedPreviewItems = () => {
        // Group items
        const models = mediaItems.filter((x) => x.type === "model3d");
        const images = mediaItems.filter((x) => x.type === "image");
        const videos = mediaItems.filter((x) => x.type === "video");

        const ordered: UploadingItem[] = [];

        // 1. 3D model first
        if (models.length > 0) ordered.push(models[0]);

        // 2 & 3. Image 1 and 2
        const img1 = images[0];
        const img2 = images[1];
        const vid1 = videos[0];

        if (img1) ordered.push(img1);
        if (img2) ordered.push(img2);
        if (vid1) ordered.push(vid1);

        // 5. Remaining images
        images.slice(2).forEach(item => ordered.push(item));

        // 6. Remaining videos
        videos.slice(1).forEach(item => ordered.push(item));

        return ordered.map((item, index) => ({
            ...item,
            position: index + 1
        }));
    };

    const orderedItems = getOrderedPreviewItems();

    return (
        <div className="space-y-6">
            {/* File inputs selector row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-gray-100 p-4 bg-gray-50/50">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Upload Image(s)</label>
                    <div className="relative">
                        <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileSelection("image")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border border-dashed border-gray-300 bg-white hover:bg-gray-50/50 p-3 flex items-center justify-center gap-2 transition-colors">
                            <Upload size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Choose Images</span>
                        </div>
                    </div>
                </div>

                {uploadType !== "diamonds" && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Upload Video</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="video/mp4, video/webm, video/quicktime,.mov"
                                onChange={handleFileSelection("video")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border border-dashed border-gray-300 bg-white hover:bg-gray-50/50 p-3 flex items-center justify-center gap-2 transition-colors">
                                <Upload size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Choose Video</span>
                            </div>
                        </div>
                    </div>
                )}

                {uploadType !== "products" && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Upload 3D Model</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".glb,.gltf,.obj"
                                onChange={handleFileSelection("model3d")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border border-dashed border-gray-300 bg-white hover:bg-gray-50/50 p-3 flex items-center justify-center gap-2 transition-colors">
                                <Upload size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Choose 3D File</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Media preview grid - strict 2 columns on desktop, 1 on mobile */}
            {orderedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orderedItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-gray-200 p-4 flex gap-4 relative group shadow-sm transition-all duration-300 hover:border-gray-400"
                        >
                            {/* Display Position Badge */}
                            <span className="absolute top-3 left-3 bg-zinc-950 text-white font-mono text-[10px] font-bold px-2 py-0.5 z-10 tracking-widest">
                                [{item.position}]
                            </span>

                            {/* Media Type Indicator */}
                            <span className="absolute top-3 right-3 bg-gray-100 text-zinc-800 text-[8px] font-bold uppercase px-2 py-0.5 tracking-wider border border-gray-200">
                                {item.type === "model3d" ? "3D Model" : item.type}
                            </span>

                            {/* Media Thumbnail / Preview Area */}
                            <div className="w-24 h-28 bg-gray-50 border border-gray-100 shrink-0 relative overflow-hidden flex items-center justify-center">
                                {item.type === "image" && (item.url || item.previewUrl) ? (
                                    <Image
                                        src={item.url || item.previewUrl || ""}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : item.type === "video" && (item.url || item.previewUrl) ? (
                                    <div className="w-full h-full relative">
                                        <video
                                            src={item.url || item.previewUrl || ""}
                                            className="w-full h-full object-cover"
                                            muted
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                            <Play size={16} className="text-white fill-white" />
                                        </div>
                                    </div>
                                ) : (
                                    // 3D Model placeholder or error fallback
                                    <div className="flex flex-col items-center gap-1.5 p-2 text-center">
                                        <FileText size={24} className="text-[#C9A14A]" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                            3D File
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Upload Info & Status Area */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between pt-5">
                                <div className="space-y-1">
                                    <p className="text-xs font-mono font-bold text-gray-800 truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                </div>

                                <div className="pb-1">
                                    {/* Uploading Status */}
                                    {item.status === "uploading" && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                <span>Uploading…</span>
                                                <span>{item.progress}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#C9A14A] transition-all duration-300"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Success */}
                                    {item.status === "success" && (
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                            <CheckCircle2 size={13} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                Uploaded
                                            </span>
                                        </div>
                                    )}

                                    {/* Upload Failed */}
                                    {item.status === "failed" && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-red-500">
                                                <AlertTriangle size={13} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                                    {item.error || "Failed"}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRetry(item)}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#C9A14A] hover:underline"
                                            >
                                                <RotateCw size={10} />
                                                Retry upload
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 transition-colors"
                                title="Remove media"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border border-dashed border-gray-200 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                    No media uploaded yet. Use the upload bar above to select files.
                </div>
            )}
        </div>
    );
}
