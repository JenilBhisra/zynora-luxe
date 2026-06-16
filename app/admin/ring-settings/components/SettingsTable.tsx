/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compression";
import Image from "next/image";
import { Edit2, Trash2, X } from "lucide-react";

export function SettingsTable({ initialSettings }: { initialSettings: any[] }) {
    const [settings, setSettings] = useState(initialSettings);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<any | null>(null);
    const [settingToDelete, setSettingToDelete] = useState<any | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [existingVideo, setExistingVideo] = useState<string | null>(null);
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelName, setModelName] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const DIAMOND_SHAPES = ["Round", "Oval", "Princess", "Emerald", "Cushion"];
    const [supportedShapes, setSupportedShapes] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Solitaire",
        stockCount: "1",
        imageUrl: "",
        images: "[]",
        videoUrl: "",
        modelUrl: ""
    });

    const [karatPrices, setKaratPrices] = useState({ "9K": "", "14K": "", "18K": "", "22K": "" });

    const RING_SIZES = ["2","2 1/4","2 1/2","2 3/4","3","3 1/4","3 1/2","3 3/4","4","4 1/4","4 1/2","4 3/4","5","5 1/4","5 1/2","5 3/4","6","6 1/4","6 1/2","6 3/4","7","7 1/4","7 1/2","7 3/4","8","8 1/4","8 1/2","8 3/4","9","9 1/4","9 1/2","9 3/4","10","10 1/4","10 1/2","10 3/4","11","11 1/4","11 1/2","11 3/4","12"];
    const KARATS = ["9K", "14K", "18K", "22K"] as const;
    const emptySizePricesForKarat = () => Object.fromEntries(RING_SIZES.map(s => [s, ""]));
    const emptyKaratSizePrices = () => Object.fromEntries(KARATS.map(k => [k, emptySizePricesForKarat()])) as Record<string, Record<string, string>>;
    const [karatSizePrices, setKaratSizePrices] = useState<Record<string, Record<string, string>>>(emptyKaratSizePrices());
    const [activeSizeKarat, setActiveSizeKarat] = useState<string>("18K");

    const openCreateModal = () => {
        setEditingSetting(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setVideoFile(null);
        setVideoPreview(null);
        setExistingVideo(null);
        setModelFile(null);
        setModelName("");
        setFormData({ name: "", description: "", price: "", category: "Solitaire", stockCount: "1", imageUrl: "", images: "[]", videoUrl: "", modelUrl: "" });
        setSupportedShapes([]);
        setKaratPrices({ "9K": "", "14K": "", "18K": "", "22K": "" });
        setKaratSizePrices(emptyKaratSizePrices());
        setActiveSizeKarat("18K");
        setIsModalOpen(true);
    };

    const openEditModal = (setting: any) => {
        setEditingSetting(setting);
        setImageFiles([]);
        setImagePreviews([]);
        let parsedImages: string[] = [];
        try { parsedImages = JSON.parse(setting.images || "[]"); } catch {}
        if (!Array.isArray(parsedImages)) parsedImages = [];
        if (parsedImages.length === 0 && setting.imageUrl) parsedImages = [setting.imageUrl];
        setExistingImages(parsedImages);
        setVideoFile(null);
        setVideoPreview(null);
        setExistingVideo(setting.videoUrl || null);
        setModelFile(null);
        setModelName(setting.modelUrl ? setting.modelUrl.split('/').pop() : "");
        setFormData({
            name: setting.name,
            description: setting.description,
            price: setting.price.toString(),
            category: setting.category,
            stockCount: (setting.stockCount ?? 1).toString(),
            imageUrl: setting.imageUrl || "",
            images: setting.images || "[]",
            videoUrl: setting.videoUrl || "",
            modelUrl: setting.modelUrl || ""
        });
        try {
            const shapes = JSON.parse(setting.supportedShapes || "[]");
            setSupportedShapes(Array.isArray(shapes) ? shapes : []);
        } catch {
            setSupportedShapes([]);
        }
        // Prefill karat prices from stored JSON
        try {
            const kp = JSON.parse(setting.karatPrices || "{}");
            setKaratPrices({
                "9K": kp["9K"] !== undefined ? String(kp["9K"]) : "",
                "14K": kp["14K"] !== undefined ? String(kp["14K"]) : "",
                "18K": kp["18K"] !== undefined ? String(kp["18K"]) : "",
                "22K": kp["22K"] !== undefined ? String(kp["22K"]) : "",
            });
        } catch {
            setKaratPrices({ "9K": "", "14K": "", "18K": "", "22K": "" });
        }
        // Prefill size prices from stored JSON (nested per-karat format)
        try {
            const sp = JSON.parse(setting.sizePrices || "{}");
            const filled = emptyKaratSizePrices();
            // Support new nested format: { "9K": { "2": 42000 }, "18K": { "2": 48000 } }
            // Old flat format { "2": 48000 } is treated as empty (admin re-enters per karat)
            const isNested = KARATS.some(k => sp[k] !== undefined && typeof sp[k] === "object");
            if (isNested) {
                for (const k of KARATS) {
                    if (sp[k] && typeof sp[k] === "object") {
                        for (const s of RING_SIZES) {
                            if (sp[k][s] !== undefined) filled[k][s] = String(sp[k][s]);
                        }
                    }
                }
            }
            setKaratSizePrices(filled);
        } catch {
            setKaratSizePrices(emptyKaratSizePrices());
        }
        setActiveSizeKarat("18K");
        setIsModalOpen(true);
    };

    const openDeleteModal = (setting: any) => {
        setSettingToDelete(setting);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!settingToDelete) {
            console.error("executeDelete called but settingToDelete is null");
            return;
        }
        console.log("Delete setting clicked, id:", settingToDelete.id);
        try {
            const url = `/api/admin/settings/${settingToDelete.id}`;
            console.log("Sending DELETE to:", url);
            const res = await fetch(url, { method: "DELETE" });
            console.log("Delete response status:", res.status);
            
            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error("Failed to parse response JSON:", jsonErr);
                const text = await res.text().catch(() => "(empty)");
                console.error("Raw response:", text);
                toast.error("Server returned invalid response");
                return;
            }
            
            console.log("Delete response data:", data);
            if (res.ok) {
                toast.success("Setting deleted");
                setSettings(prev => prev.filter(s => s.id !== settingToDelete.id));
                setIsDeleteModalOpen(false);
                setSettingToDelete(null);
            } else {
                toast.error(data.error || "Failed to delete (may be in use)");
            }
        } catch (err) {
            console.error("Delete setting error:", err);
            toast.error("Network error");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                toast.error(`${file.name} is invalid type.`);
                return false;
            }
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 50MB.`);
                return false;
            }
            return true;
        });
        
        if (validFiles.length) {
            setImageFiles(prev => [...prev, ...validFiles]);
            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
        e.target.value = '';
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
                toast.error("Invalid file type. Only MP4, WebM, and MOV are allowed.");
                return;
            }
            if (file.size > 30 * 1024 * 1024) {
                toast.error("File size exceeds 30MB limit.");
                return;
            }
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
    }
    const removeExistingVideo = () => {
        setExistingVideo(null);
    }

    const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isAllowedModeType = file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf') || file.name.toLowerCase().endsWith('.obj');
        if (!isAllowedModeType) {
            toast.error("Invalid model type. Only .glb, .gltf, and .obj files are allowed.");
            return;
        }
        if (file.size > 30 * 1024 * 1024) {
            toast.error("Model size exceeds 30MB limit.");
            return;
        }
        setModelFile(file);
        setModelName(file.name);
    };

    const removeModel = () => {
        setModelFile(null);
        setModelName("");
        setFormData(prev => ({ ...prev, modelUrl: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting form with formData:", formData);
        console.log("Files:", { imageFiles, videoFile, modelFile });
        try {
            setIsUploading(true);
            let uploadedModelUrl = formData.modelUrl;
            let finalImageUrls = [...existingImages];
            let uploadedVideoUrl = existingVideo || "";

            if (modelFile) {
                console.log("Uploading model...");
                const modelUploadFormData = new FormData();
                modelUploadFormData.append("file", modelFile);
                modelUploadFormData.append("type", "settings");
                modelUploadFormData.append("kind", "model");

                const modelUploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: modelUploadFormData
                });

                const modelUploadData = await modelUploadRes.json();

                if (!modelUploadRes.ok) {
                    console.error("Model upload error:", modelUploadData);
                    toast.error(modelUploadData.error || "Model upload failed");
                    setIsUploading(false);
                    return;
                }

                uploadedModelUrl = modelUploadData.url;
            }

            if (videoFile) {
                const videoFormData = new FormData();
                videoFormData.append("file", videoFile);
                videoFormData.append("type", "settings");
                videoFormData.append("kind", "video");

                const videoRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: videoFormData
                });

                const videoData = await videoRes.json();

                if (!videoRes.ok) {
                    toast.error(videoData.error || "Video upload failed");
                    setIsUploading(false);
                    return;
                }

                uploadedVideoUrl = videoData.url;
            }

            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const compressedFile = await compressImage(file);
                    const uploadFormData = new FormData();
                    uploadFormData.append("file", compressedFile);
                    uploadFormData.append("type", "settings");

                    const uploadRes = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: uploadFormData
                    });

                    const uploadData = await uploadRes.json();

                    if (!uploadRes.ok) {
                        toast.error(uploadData.error || `Image upload failed for ${file.name}`);
                    } else {
                        finalImageUrls.push(uploadData.url);
                    }
                }
            }
            
            const primaryImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : "";

            // Build karatPrices object — only include karats with a value entered
            const karatPricesObj: Record<string, number> = {};
            for (const [k, v] of Object.entries(karatPrices)) {
                if (v !== "") karatPricesObj[k] = parseFloat(v);
            }

            // Build nested sizePrices object: { karat: { size: price } }
            const sizePricesObj: Record<string, Record<string, number>> = {};
            for (const k of KARATS) {
                const sizeMap: Record<string, number> = {};
                for (const [s, v] of Object.entries(karatSizePrices[k] || {})) {
                    if (v !== "") sizeMap[s] = parseFloat(v);
                }
                if (Object.keys(sizeMap).length > 0) sizePricesObj[k] = sizeMap;
            }

            const isEditing = !!editingSetting;
            const url = isEditing ? `/api/admin/settings/${editingSetting.id}` : `/api/admin/settings`;
            const method = isEditing ? "PATCH" : "POST";

            const payload = {
                ...formData,
                imageUrl: primaryImageUrl,
                images: JSON.stringify(finalImageUrls),
                videoUrl: uploadedVideoUrl,
                modelUrl: uploadedModelUrl,
                price: parseFloat(formData.price),
                stockCount: parseInt(formData.stockCount) || 1,
                karatPrices: JSON.stringify(karatPricesObj),
                sizePrices: JSON.stringify(sizePricesObj),
                supportedShapes: JSON.stringify(supportedShapes)
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(isEditing ? "Setting updated" : "Setting added");
                if (isEditing) {
                    setSettings(settings.map(s => s.id === editingSetting.id ? data.setting || { ...s, ...payload, id: editingSetting.id } : s));
                } else {
                    setSettings([data.setting, ...settings]);
                }
                setIsModalOpen(false);
            } else {
                console.error("API Error:", data);
                toast.error(data.error || "Operation failed");
            }
        } catch (err: any) {
            console.error("Submit Exception:", err);
            toast.error(err.message || "Error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={openCreateModal} className="bg-[#111111] text-white border border-transparent px-6 py-3 rounded-none font-bold uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-1 hover:bg-gold/10">
                    + Add Setting
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-4">
                    <div className="bg-white border border-gray-200 rounded-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <h3 className="text-2xl font-heading tracking-wide" style={{ color: "#D6B25E" }}>
                                {editingSetting ? "Edit Ring Setting" : "New Ring Setting Design"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-[#111111] hover:bg-gray-100 p-2 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Name</label>
                                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Base Price (₹)</label>
                                    <input type="number" required className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Category</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option>Solitaire</option><option>Halo</option><option>Vintage</option><option>Three-Stone</option>
                                    </select>
                                </div>
                                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Quantity (Stock)</label>
                                    <input type="number" required min="1" className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Supported Diamond Shapes</label>
                                    <div className="flex flex-wrap gap-3">
                                        {DIAMOND_SHAPES.map(shape => (
                                            <label key={shape} className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-2 rounded-none hover:bg-gray-100 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    className="accent-[#D6B25E] w-4 h-4"
                                                    checked={supportedShapes.includes(shape)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSupportedShapes([...supportedShapes, shape]);
                                                        } else {
                                                            setSupportedShapes(supportedShapes.filter(s => s !== shape));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm font-medium text-gray-700">{shape}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Select the diamond shapes that fit this setting.</p>
                                </div>



                                {/* Ring Size Pricing Section — per karat */}
                                <div className="md:col-span-2">
                                    <div className="border border-blue-100 bg-blue-50/40 rounded-none p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700 mb-1">Ring Size Pricing (US) — Per Karat</p>
                                        <p className="text-[11px] text-blue-600/70 mb-3">Select a karat, then enter the price for each size. Leave blank to hide that size.</p>
                                        {/* Karat Tab Bar */}
                                        <div className="flex gap-1 mb-4">
                                            {KARATS.map(k => (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    onClick={() => setActiveSizeKarat(k)}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                                        activeSizeKarat === k
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    }`}
                                                >
                                                    {k}
                                                    {Object.values(karatSizePrices[k] || {}).some(v => v !== "") && (
                                                        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Size grid for active karat */}
                                        <div className="max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                                                {RING_SIZES.map((size) => (
                                                    <div key={size} className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-12 flex-shrink-0">{size}</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="₹"
                                                            className="w-full bg-white border rounded-none p-2 text-sm text-[#111111] outline-none focus:border-blue-400 border-blue-200 transition-colors"
                                                            value={karatSizePrices[activeSizeKarat]?.[size] ?? ""}
                                                            onChange={e => setKaratSizePrices(prev => ({
                                                                ...prev,
                                                                [activeSizeKarat]: { ...prev[activeSizeKarat], [size]: e.target.value }
                                                            }))}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Description</label>
                                    <textarea required rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Setting Images (Photos)</label>
                                    <div className="flex flex-col gap-5">
                                        <div className="flex flex-wrap gap-4">
                                            {existingImages.map((src, idx) => (
                                                <div key={`existing-${idx}`} className="relative w-16 h-16 border rounded-none bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-gray-200">
                                                    <Image src={src} alt="Preview" fill className="object-cover" unoptimized />
                                                    <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                                                </div>
                                            ))}
                                            {imagePreviews.map((src, idx) => (
                                                <div key={`new-${idx}`} className="relative w-16 h-16 border rounded-none bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-gray-200">
                                                    <Image src={src} alt="Preview" fill className="object-cover" unoptimized />
                                                    <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/png, image/jpeg, image/webp"
                                                onChange={handleImageChange}
                                                className="w-full text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-[#111111] hover:file:bg-white/20 transition-colors cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Setting Video</label>
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 border rounded-none bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-gray-200 shadow-none">
                                            {videoPreview || existingVideo ? (
                                                <video src={videoPreview || existingVideo || ""} className="w-full h-full object-cover" muted />
                                            ) : (
                                                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em] px-2 text-center">No Vid</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="video/mp4, video/webm, video/quicktime"
                                                onChange={handleVideoChange}
                                                className="w-full text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-[#111111] hover:file:bg-white/20 transition-colors cursor-pointer"
                                            />
                                            {(videoPreview || existingVideo) && (
                                                <button type="button" onClick={videoPreview ? removeVideo : removeExistingVideo} className="text-red-400 text-[10px] uppercase tracking-widest mt-3 font-bold hover:text-red-300 transition-colors">
                                                    Remove Video
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">3D Model (.obj, .glb)</label>
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 border rounded-none bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-gray-200 shadow-none">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] px-2 text-center">3D</span>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept=".glb,.gltf,.obj,model/gltf-binary,model/obj"
                                                onChange={handleModelChange}
                                                className="w-full text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-[#111111] hover:file:bg-white/20 transition-colors cursor-pointer"
                                            />
                                            {modelName ? (
                                                <div className="mt-2 flex items-center gap-4">
                                                    <span className="text-[11px] text-gray-600">{modelName}</span>
                                                    <button type="button" onClick={removeModel} className="text-red-400 text-[10px] uppercase tracking-widest font-bold hover:text-red-300 transition-colors">
                                                        Remove Model
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-none font-bold uppercase tracking-widest text-xs text-gray-600 hover:bg-gray-100 hover:text-[#111111] transition-colors" disabled={isUploading}>Cancel</button>
                                <button type="submit" className="bg-[#111111] text-white border border-transparent px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:bg-gold/10" disabled={isUploading}>
                                    {isUploading ? "Uploading..." : (editingSetting ? "Save Changes" : "Save Setting")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white  border border-gray-200 rounded-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 border border-gray-200">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-xl font-heading tracking-wide !text-[#111111] mb-3">Delete Setting?</h3>
                        <p className="text-[0.95rem] font-light text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to permanently delete <strong>{settingToDelete?.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => { setIsDeleteModalOpen(false); setSettingToDelete(null); }} className="flex-1 px-4 py-3 rounded-none font-bold uppercase tracking-widest text-xs text-gray-600 bg-gray-50 hover:bg-gray-200 transition-colors border border-transparent">
                                Cancel
                            </button>
                            <button onClick={executeDelete} className="flex-1 bg-red-500 text-white border border-red-500 px-4 py-3 rounded-none font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settings.map((setting) => (
                    <div key={setting.id} className="bg-white  border border-gray-100 shadow-sm rounded-none p-5 flex gap-5 group hover:border-gray-300 transition-all duration-300">
                        <div className="w-24 h-24 bg-gray-50 rounded-none relative overflow-hidden flex-shrink-0 shadow-none border border-gray-200 group-hover:border-gray-300 transition-colors">
                            {setting.imageUrl ? (
                                <Image src={setting.imageUrl} alt={setting.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-gray-300">No Img</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <h4 className="font-heading font-medium tracking-wide !text-[#111111] truncate text-lg">{setting.name}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{setting.category}</p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-[1rem] font-bold font-body text-[#111111] tracking-wide">₹{(setting.price || 0).toLocaleString("en-IN")}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(setting)} className="p-2 text-gray-400 hover:text-[#111111] transition-colors block bg-gray-50 hover:bg-gray-200 rounded-none" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => openDeleteModal(setting)} className="p-2 text-gray-400 hover:text-red-400 transition-colors block bg-gray-50 hover:bg-red-500/10 rounded-none" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

