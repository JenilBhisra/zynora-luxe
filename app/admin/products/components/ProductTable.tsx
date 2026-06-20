/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compression";
import Image from "next/image";
import { Play, X } from "lucide-react";

type PendingMedia = {
    file: File;
    preview: string;
    kind: "image" | "video";
};

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|#|$)/i;

export function ProductTable({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isAdding, setIsAdding] = useState(false);

    const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: categories[0]?.name || "Rings",
        metalType: "18K Gold",
        stockCount: "1",
    });

    const [karatPrices, setKaratPrices] = useState({ "9K": "", "14K": "", "18K": "", "22K": "" });

    const handleDelete = async (id: string) => {
        if (!confirm("Delete product permanently?")) return;
        try {
            const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Product deleted");
                setProducts(products.filter(p => p.id !== id));
            } else { toast.error("Failed to delete"); }
        } catch { toast.error("Error"); }
    };

    const clearPendingMedia = () => {
        pendingMedia.forEach((media) => {
            if (media.preview) URL.revokeObjectURL(media.preview);
        });
        setPendingMedia([]);
    };

    const handleMediaChange = (kind: "image" | "video") => (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const validMedia: PendingMedia[] = [];

            const imageTypes = ["image/jpeg", "image/png", "image/webp"];
            const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
            const imageExt = /\.(jpg|jpeg|png|webp)$/i;
            const videoExt = /\.(mp4|webm|mov)$/i;
            const maxSize = kind === "image" ? 50 * 1024 * 1024 : 30 * 1024 * 1024;

            for (const file of files) {
                const isValidType = kind === "image"
                    ? imageTypes.includes(file.type) || imageExt.test(file.name)
                    : videoTypes.includes(file.type) || videoExt.test(file.name);

                if (!isValidType) {
                    toast.error(`Invalid file type for ${file.name}.`);
                    continue;
                }
                if (file.size > maxSize) {
                    toast.error(`File ${file.name} exceeds ${kind === "image" ? "50MB" : "30MB"} limit.`);
                    continue;
                }
                validMedia.push({
                    file,
                    preview: URL.createObjectURL(file),
                    kind,
                });
            }

            setPendingMedia((prev) => [...prev, ...validMedia]);
        }

        e.target.value = "";
    };

    const removeMedia = (index: number) => {
        setPendingMedia((prev) => {
            const cloned = [...prev];
            const removed = cloned.splice(index, 1)[0];
            if (removed?.preview) {
                URL.revokeObjectURL(removed.preview);
            }
            return cloned;
        });
    };

    const imageCount = pendingMedia.filter((media) => media.kind === "image").length;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsUploading(true);
            const uploadedMediaUrls: string[] = [];

            for (const media of pendingMedia) {
                const uploadFormData = new FormData();
                if (media.kind === "image") {
                    const compressedFile = await compressImage(media.file);
                    uploadFormData.append("file", compressedFile);
                } else {
                    uploadFormData.append("file", media.file);
                }
                uploadFormData.append("type", "products");
                uploadFormData.append("kind", media.kind);

                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) {
                    toast.error(`Failed to upload ${media.file.name}`);
                    setIsUploading(false);
                    return;
                }

                uploadedMediaUrls.push(uploadData.url);
            }

            // Build karatPrices object — only include karats with a value entered
            const karatPricesObj: Record<string, number> = {};
            for (const [k, v] of Object.entries(karatPrices)) {
                if (v !== "") karatPricesObj[k] = parseFloat(v);
            }

            const payload = {
                ...formData,
                images: JSON.stringify(uploadedMediaUrls),
                karatPrices: JSON.stringify(karatPricesObj)
            };

            const res = await fetch(`/api/admin/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Product created!");
                setProducts([data.product, ...products]);
                setIsAdding(false);
                setFormData({
                    name: "", description: "", price: "", categoryId: categories[0]?.name || "Rings", metalType: "18K Gold", stockCount: "1"
                });
                setKaratPrices({ "9K": "", "14K": "", "18K": "", "22K": "" });
                clearPendingMedia();
            } else {
                toast.error(data.error || "Creation failed");
            }
        } catch {
            toast.error("Error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => {
                    setIsAdding(!isAdding);
                    clearPendingMedia();
                }} className="bg-[#111111] text-white border border-transparent px-6 py-3 rounded-none font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-1 hover:bg-[#C9A14A] hover:text-white">
                    {isAdding ? "Cancel" : "+ Add Product"}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="bg-white p-8 border border-gray-200 rounded-none shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6  animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="md:col-span-3 text-xl font-heading !text-[#111111] border-b border-gray-200 pb-4 tracking-wide">Create New Custom Product</h3>

                    <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Product Name</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Price (₹)</label>
                        <input type="number" required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>

                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Category</label>
                        <select 
                            required 
                            className="w-full bg-white border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer" 
                            style={{ minHeight: "44px", WebkitAppearance: "menulist", appearance: "menulist" }}
                            value={formData.categoryId} 
                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.name} className="bg-white text-[#111111]">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Metal/Material</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.metalType} onChange={e => setFormData({ ...formData, metalType: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Quantity (Stock)</label>
                        <input type="number" required min="0" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} />
                    </div>

                    {/* Karat Pricing Section */}
                    <div className="md:col-span-3">
                        <div className="border border-amber-100 bg-amber-50/60 rounded-none p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-1">Gold Karat Pricing</p>
                            <p className="text-[11px] text-amber-600/80 mb-4">Set per-karat prices. Leave blank to hide that karat from customers.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(["9K", "14K", "18K", "22K"] as const).map((k) => (
                                    <div key={k}>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">{k} Gold (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 55000"
                                            className="w-full bg-white border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-amber-400 border-amber-200 transition-colors"
                                            value={karatPrices[k]}
                                            onChange={e => setKaratPrices(prev => ({ ...prev, [k]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Product Media</label>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Images</label>
                                    <div className="flex items-center gap-3 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="bg-[#111111] text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold rounded-none"
                                        >
                                            + Add Image
                                        </button>
                                        <span className="text-[11px] text-gray-500">{imageCount} image(s) added</span>
                                    </div>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleMediaChange("image")}
                                        className="hidden"
                                    />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleMediaChange("image")}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-xs file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-[#111111] hover:file:bg-white/20 transition-colors cursor-pointer"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">Or choose multiple at once</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Videos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="video/mp4, video/webm, video/quicktime,.mov"
                                        onChange={handleMediaChange("video")}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-xs file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-[#111111] hover:file:bg-white/20 transition-colors cursor-pointer"
                                    />
                                </div>
                            </div>

                            {pendingMedia.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-4">
                                    {pendingMedia.map((media, index) => (
                                        <div key={index} className="relative w-28 h-28 border border-gray-300 rounded-none overflow-hidden bg-gray-50 group shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                                            {media.kind === "image" ? (
                                                <Image src={media.preview} alt={`Preview ${index}`} width={112} height={112} className="w-full h-full object-cover" unoptimized />
                                            ) : (
                                                <>
                                                    <video src={media.preview} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                                        <Play size={20} className="text-white" fill="currentColor" />
                                                    </div>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(index)}
                                                className="absolute top-2 right-2 bg-gray-50/80 rounded-full p-1.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                                            >
                                                <X size={14} />
                                            </button>
                                            <span className="absolute left-2 bottom-2 bg-black/70 text-white text-[9px] uppercase font-bold px-2 py-1 tracking-widest">
                                                {media.kind}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-3"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Description</label>
                        <textarea required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <button type="submit" disabled={isUploading} className="bg-[#111111] text-white border border-transparent px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all hover:bg-[#C9A14A] hover:text-white">
                            {isUploading ? "Uploading..." : "Save Product"}
                        </button>
                    </div>
                </form>
            )}

            <div className="w-full overflow-x-auto bg-white  border border-gray-100 rounded-none shadow-sm custom-scrollbar pb-4 mt-8">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="p-5 font-bold">Product</th>
                            <th className="p-5 font-bold">Category</th>
                            <th className="p-5 font-bold">Price</th>
                            <th className="p-5 font-bold">Stock</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[0.95rem]">
                        {products.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest font-bold">No products found.</td></tr>
                        ) : products.map((product) => {
                            let parsedImages = [];
                            try {
                                parsedImages = JSON.parse(product.images);
                            } catch { }

                            const firstImage = parsedImages.find((src: string) => typeof src === "string" && !VIDEO_EXT_REGEX.test(src));

                            return (
                                <tr key={product.id} className="hover:bg-gray-100/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-gray-50 rounded-none overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                                                {firstImage ? (
                                                    <Image src={firstImage} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
                                                ) : parsedImages.length > 0 ? (
                                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Video</span>
                                                ) : (
                                                    <span className="text-gray-300 text-[10px] uppercase font-bold tracking-widest">No Img</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#111111] tracking-wide">{product.name}</p>
                                                <p className="text-[11px] text-gray-500 uppercase tracking-widest mt-1">{product.metalType}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md text-gray-700">{product.category.name}</span>
                                    </td>
                                    <td className="p-5 font-bold font-body text-[#111111] tracking-wide">₹{product.price.toLocaleString("en-IN")}</td>
                                    <td className="p-5 text-sm">{product.stockCount > 0 ? <span className="text-[#111111] font-bold uppercase tracking-widest text-[10px] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">{product.stockCount} In Stock</span> : <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">Out of Stock</span>}</td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => handleDelete(product.id)} className="text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors bg-gray-50 px-4 py-2 rounded-md border border-gray-200">Delete</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
