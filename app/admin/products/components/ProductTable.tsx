/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Play, X, Search } from "lucide-react";
import AdminMediaManager from "@/app/admin/components/AdminMediaManager";
import { VIDEO_EXT_REGEX } from "@/lib/media-utils";

export function ProductTable({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        categoryId: categories[0]?.name || "Rings",
        diamondType: "Lab Grown Diamond",
        metalType: "Gold",
        stockCount: "1",
        tags: "",
        extraKeywords: "",
        seoTitle: "",
        seoDescription: "",
        availableMetals: ["Gold"] as string[],
        goldPrice: "",
        silverPrice: "",
        platinumPrice: "",
        karatPrices: { "10K": "", "14K": "", "18K": "", "22K": "" },
        images: "[]"
    });

    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState<any | null>(null);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const q = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.metalType.toLowerCase().includes(q) ||
            (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q))
        );
    }, [products, searchQuery]);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading) {
            toast.error("Please wait until all uploads are complete.");
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            const availableMetalsStr = formData.availableMetals.join(",");
            const silverVal = formData.availableMetals.includes("Silver") ? parseFloat(formData.silverPrice) || null : null;
            const platVal = formData.availableMetals.includes("Platinum") ? parseFloat(formData.platinumPrice) || null : null;
            
            const karatPricesObj: Record<string, number> = {};
            if (formData.availableMetals.includes("Gold")) {
                for (const [k, v] of Object.entries(formData.karatPrices)) {
                    if (v !== "") karatPricesObj[k] = parseFloat(v);
                }
            }

            const goldBase = karatPricesObj["18K"] ?? karatPricesObj["14K"] ?? karatPricesObj["10K"] ?? karatPricesObj["22K"] ?? null;
            const basePrice = goldBase ?? silverVal ?? platVal ?? 0;

            const payload = {
                sku: formData.sku || null,
                name: formData.name,
                description: formData.description,
                price: basePrice,
                categoryId: formData.categoryId,
                diamondType: formData.diamondType || "Lab Grown Diamond",
                metalType: formData.metalType,
                stockCount: formData.stockCount,
                tags: formData.tags,
                extraKeywords: formData.extraKeywords,
                seoTitle: formData.seoTitle,
                seoDescription: formData.seoDescription,
                availableMetals: availableMetalsStr,
                goldPrice: goldBase,
                silverPrice: silverVal,
                platinumPrice: platVal,
                images: formData.images,
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
                    sku: "",
                    name: "", description: "", categoryId: categories[0]?.name || "Rings",
                    diamondType: "Lab Grown Diamond",
                    metalType: "Gold", stockCount: "1",
                    tags: "", extraKeywords: "", seoTitle: "", seoDescription: "",
                    availableMetals: ["Gold"], goldPrice: "", silverPrice: "", platinumPrice: "",
                    karatPrices: { "10K": "", "14K": "", "18K": "", "22K": "" },
                    images: "[]"
                });
            } else {
                toast.error(data.error || "Creation failed");
            }
        } catch {
            toast.error("Error");
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (product: any) => {
        setEditingProduct(product);
        const metalsList = product.availableMetals 
            ? product.availableMetals.split(",").map((m: string) => m.trim())
            : ["Gold"];

        let kpObj = { "10K": "", "14K": "", "18K": "", "22K": "" };
        try {
            const parsed = JSON.parse(product.karatPrices || "{}");
            kpObj = {
                "10K": parsed["10K"] !== undefined ? String(parsed["10K"]) : parsed["9K"] !== undefined ? String(parsed["9K"]) : "",
                "14K": parsed["14K"] !== undefined ? String(parsed["14K"]) : "",
                "18K": parsed["18K"] !== undefined ? String(parsed["18K"]) : "",
                "22K": parsed["22K"] !== undefined ? String(parsed["22K"]) : "",
            };
        } catch {}

        setEditFormData({
            sku: product.sku || "",
            name: product.name,
            description: product.description,
            categoryId: product.category?.name || categories[0]?.name || "Rings",
            diamondType: product.diamondType || "Lab Grown Diamond",
            metalType: product.metalType || "Gold",
            stockCount: String(product.stockCount),
            tags: product.tags || "",
            extraKeywords: product.extraKeywords || "",
            seoTitle: product.seoTitle || "",
            seoDescription: product.seoDescription || "",
            availableMetals: metalsList,
            goldPrice: product.goldPrice !== null && product.goldPrice !== undefined ? String(product.goldPrice) : "",
            silverPrice: product.silverPrice !== null && product.silverPrice !== undefined ? String(product.silverPrice) : "",
            platinumPrice: product.platinumPrice !== null && product.platinumPrice !== undefined ? String(product.platinumPrice) : "",
            karatPrices: kpObj,
            images: product.images || "[]"
        });
        setIsAdding(false);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading) {
            toast.error("Please wait until all uploads are complete.");
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            const availableMetalsStr = editFormData.availableMetals.join(",");
            const silverVal = editFormData.availableMetals.includes("Silver") ? parseFloat(editFormData.silverPrice) || null : null;
            const platVal = editFormData.availableMetals.includes("Platinum") ? parseFloat(editFormData.platinumPrice) || null : null;
            
            const karatPricesObj: Record<string, number> = {};
            if (editFormData.availableMetals.includes("Gold")) {
                for (const [k, v] of Object.entries(editFormData.karatPrices)) {
                    if (v !== "") karatPricesObj[k] = parseFloat(v as string);
                }
            }

            const goldBase = karatPricesObj["18K"] ?? karatPricesObj["14K"] ?? karatPricesObj["10K"] ?? karatPricesObj["22K"] ?? null;
            const basePrice = goldBase ?? silverVal ?? platVal ?? 0;

            const payload = {
                sku: editFormData.sku || null,
                name: editFormData.name,
                description: editFormData.description,
                price: basePrice,
                categoryId: editFormData.categoryId,
                diamondType: editFormData.diamondType || "Lab Grown Diamond",
                metalType: editFormData.metalType,
                stockCount: parseInt(editFormData.stockCount) || 1,
                tags: editFormData.tags,
                extraKeywords: editFormData.extraKeywords,
                seoTitle: editFormData.seoTitle,
                seoDescription: editFormData.seoDescription,
                availableMetals: availableMetalsStr,
                goldPrice: goldBase,
                silverPrice: silverVal,
                platinumPrice: platVal,
                karatPrices: JSON.stringify(karatPricesObj),
                images: editFormData.images
            };

            const res = await fetch(`/api/admin/products?id=${editingProduct.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Product updated!");
                setProducts(products.map(p => p.id === editingProduct.id ? data.product : p));
                setEditingProduct(null);
                setEditFormData(null);
            } else {
                toast.error(data.error || "Update failed");
            }
        } catch {
            toast.error("Error");
        } finally {
            setIsSaving(false);
        }
    };

    const slugify = (text: string) => {
        return (text || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search SKU, name, metal, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-4 py-3 w-full bg-white text-[#111111] border border-gray-200 rounded-none text-[0.95rem] focus:ring-2 focus:ring-gray-200 focus:border-[#111111] outline-none transition-all placeholder-soft-cream/30 shadow-sm"
                    />
                </div>
                <div className="flex gap-3">
                    {editingProduct && (
                        <button onClick={() => {
                            setEditingProduct(null);
                            setEditFormData(null);
                        }} className="bg-gray-100 text-gray-700 border border-gray-200 px-6 py-3 rounded-none font-bold text-xs uppercase tracking-widest transition-all hover:bg-gray-200">
                            Cancel Edit
                        </button>
                    )}
                    <button onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingProduct(null);
                        setEditFormData(null);
                    }} className="bg-[#111111] text-white border border-transparent px-6 py-3 rounded-none font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-1 hover:bg-[#C9A14A] hover:text-white">
                        {isAdding ? "Cancel" : "+ Add Product"}
                    </button>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="bg-white p-8 border border-gray-200 rounded-none shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6  animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="md:col-span-3 text-xl font-heading !text-[#111111] border-b border-gray-200 pb-4 tracking-wide">Create New Custom Product</h3>

                    <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Product Name</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SKU</label>
                        <input 
                            placeholder="e.g. ZL-RNG-OVL-001" 
                            className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" 
                            value={formData.sku || ""} 
                            onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                                setFormData({ ...formData, sku: val });
                            }} 
                        />
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
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Diamond Type</label>
                        <select 
                            className="w-full bg-white border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
                            style={{ minHeight: "44px", WebkitAppearance: "menulist", appearance: "menulist" }}
                            value={formData.diamondType || "Lab Grown Diamond"}
                            onChange={e => setFormData({ ...formData, diamondType: e.target.value })}
                        >
                            <option value="Lab Grown Diamond">Lab Grown Diamond</option>
                            <option value="Natural Diamond">Natural Diamond</option>
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Metal/Material Description</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.metalType} onChange={e => setFormData({ ...formData, metalType: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Quantity (Stock)</label>
                        <input type="number" required min="0" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} />
                    </div>

                    {/* Metal Checkboxes */}
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Available Metals</label>
                        <div className="flex gap-4">
                            {["Gold", "Silver", "Platinum"].map((metal) => (
                                <label key={metal} className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-2 hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="accent-[#111111]"
                                        checked={formData.availableMetals.includes(metal)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...formData.availableMetals, metal]
                                                : formData.availableMetals.filter((m: string) => m !== metal);
                                            setFormData({ ...formData, availableMetals: next });
                                        }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">{metal}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Price Inputs */}
                    {formData.availableMetals.includes("Gold") && (
                        <div className="md:col-span-3 border border-amber-100 bg-amber-50/60 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-1">Gold Karat Pricing</p>
                            <p className="text-[11px] text-amber-600/80 mb-4">Set prices for the enabled Gold karats.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(["10K", "14K", "18K", "22K"] as const).map((k) => (
                                    <div key={k}>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-655 mb-2">{k} Gold (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 55000"
                                            className="w-full bg-white border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-amber-400 border-amber-200 transition-colors"
                                            value={formData.karatPrices[k] ?? ""}
                                            onChange={e => setFormData({
                                                ...formData,
                                                karatPrices: { ...formData.karatPrices, [k]: e.target.value }
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.availableMetals.includes("Silver") && (
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Silver Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors"
                                value={formData.silverPrice}
                                onChange={e => setFormData({ ...formData, silverPrice: e.target.value })}
                            />
                        </div>
                    )}

                    {formData.availableMetals.includes("Platinum") && (
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Platinum Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors"
                                value={formData.platinumPrice}
                                onChange={e => setFormData({ ...formData, platinumPrice: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Product Media</label>
                        {(() => {
                            let parsedImages: string[] = [];
                            let parsedVideos: string[] = [];
                            try {
                                const parsed = JSON.parse(formData.images || "[]");
                                if (Array.isArray(parsed)) {
                                    parsedImages = parsed.filter(url => !VIDEO_EXT_REGEX.test(url));
                                    parsedVideos = parsed.filter(url => VIDEO_EXT_REGEX.test(url));
                                }
                            } catch {}
                            return (
                                <AdminMediaManager
                                    uploadType="products"
                                    existingImages={parsedImages}
                                    existingVideos={parsedVideos}
                                    onMediaChange={({ images, videos }) => {
                                        const combined = [...images, ...videos];
                                        setFormData(prev => ({
                                            ...prev,
                                            images: JSON.stringify(combined)
                                        }));
                                    }}
                                    onUploadingStatusChange={setIsUploading}
                                />
                            );
                        })()}
                    </div>

                    <div className="md:col-span-3"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Description</label>
                        <textarea required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    {/* SEO & Search Section */}
                    <div className="md:col-span-3 border-t border-gray-200 pt-6 mt-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-4">SEO & Search Optimization</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Search Tags (Comma-separated)</label>
                                <input placeholder="e.g. vintage, solitaire, gift" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Extra Search Keywords (Comma-separated)</label>
                                <input placeholder="e.g. unique band, proposal rings" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.extraKeywords} onChange={e => setFormData({ ...formData, extraKeywords: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SEO Custom Title (Optional)</label>
                                <input placeholder="Fallback: Product Name | Zynora Luxe" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.seoTitle} onChange={e => setFormData({ ...formData, seoTitle: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SEO Custom Description (Optional)</label>
                                <input placeholder="Fallback: Product description" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={formData.seoDescription} onChange={e => setFormData({ ...formData, seoDescription: e.target.value })} />
                            </div>
                        </div>

                        {/* Live SEO & Slug Preview */}
                        <div className="mt-6 p-5 bg-gray-50 border border-gray-200">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-4">Search Engine Result Preview</p>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 block mb-1">Slug / URL Preview:</span>
                                    <code className="text-xs text-amber-600 break-all select-all">
                                        https://zynoraluxe.com/product/{slugify(formData.name) || "product-name"}-xxxx
                                    </code>
                                </div>
                                <div className="border border-gray-200 bg-white p-4 rounded shadow-sm max-w-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">Z</div>
                                        <div className="text-xs text-gray-600 truncate">
                                            <span>Zynora Luxe</span>
                                            <span className="mx-1 text-gray-400">›</span>
                                            <span className="text-gray-500">product</span>
                                            <span className="mx-1 text-gray-400">›</span>
                                            <span>{slugify(formData.name) || "product-name"}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-blue-800 text-lg hover:underline cursor-pointer font-sans truncate">
                                        {formData.seoTitle || (formData.name ? `${formData.name} | Zynora Luxe` : "Product Name | Zynora Luxe")}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-sans line-clamp-2 mt-1">
                                        {formData.seoDescription || formData.description || "Enter a description or custom SEO description to see how it will display on search engines."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <button type="submit" disabled={isSaving || isUploading} className="bg-[#111111] text-white border border-transparent px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all hover:bg-[#C9A14A] hover:text-white">
                            {isSaving ? "Uploading product..." : (isUploading ? "Uploading..." : "Save Product")}
                        </button>
                    </div>
                </form>
            )}

            {editingProduct && editFormData && (
                <form onSubmit={handleEditSave} className="bg-white p-8 border border-[#C9A14A] rounded-none shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="md:col-span-3 text-xl font-heading !text-[#111111] border-b border-gray-200 pb-4 tracking-wide flex justify-between items-center">
                        <span>Edit Product: {editingProduct.name}</span>
                        <button type="button" onClick={() => { setEditingProduct(null); setEditFormData(null); }} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                    </h3>

                    <div className="md:col-span-2"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Product Name</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SKU</label>
                        <input 
                            placeholder="e.g. ZL-RNG-OVL-001" 
                            className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" 
                            value={editFormData.sku || ""} 
                            onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                                setEditFormData({ ...editFormData, sku: val });
                            }} 
                        />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Category</label>
                        <select 
                            required 
                            className="w-full bg-white border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer" 
                            style={{ minHeight: "44px", WebkitAppearance: "menulist", appearance: "menulist" }}
                            value={editFormData.categoryId} 
                            onChange={e => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.name} className="bg-white text-[#111111]">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Diamond Type</label>
                        <select 
                            className="w-full bg-white border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
                            style={{ minHeight: "44px", WebkitAppearance: "menulist", appearance: "menulist" }}
                            value={editFormData.diamondType || "Lab Grown Diamond"}
                            onChange={e => setEditFormData({ ...editFormData, diamondType: e.target.value })}
                        >
                            <option value="Lab Grown Diamond">Lab Grown Diamond</option>
                            <option value="Natural Diamond">Natural Diamond</option>
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Metal/Material Description</label>
                        <input required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.metalType} onChange={e => setEditFormData({ ...editFormData, metalType: e.target.value })} />
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Quantity (Stock)</label>
                        <input type="number" required min="0" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.stockCount} onChange={e => setEditFormData({ ...editFormData, stockCount: e.target.value })} />
                    </div>

                    {/* Metal Checkboxes */}
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Available Metals</label>
                        <div className="flex gap-4">
                            {["Gold", "Silver", "Platinum"].map((metal) => (
                                <label key={metal} className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-2 hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="accent-[#111111]"
                                        checked={editFormData.availableMetals.includes(metal)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...editFormData.availableMetals, metal]
                                                : editFormData.availableMetals.filter((m: string) => m !== metal);
                                            setEditFormData({ ...editFormData, availableMetals: next });
                                        }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">{metal}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Price Inputs */}
                    {editFormData.availableMetals.includes("Gold") && (
                        <div className="md:col-span-3 border border-amber-100 bg-amber-50/60 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-1">Gold Karat Pricing</p>
                            <p className="text-[11px] text-amber-600/80 mb-4">Set prices for the enabled Gold karats.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(["10K", "14K", "18K", "22K"] as const).map((k) => (
                                    <div key={k}>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-655 mb-2">{k} Gold (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 55000"
                                            className="w-full bg-white border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-amber-400 border-amber-200 transition-colors"
                                            value={editFormData.karatPrices[k] ?? ""}
                                            onChange={e => setEditFormData({
                                                ...editFormData,
                                                karatPrices: { ...editFormData.karatPrices, [k]: e.target.value }
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {editFormData.availableMetals.includes("Silver") && (
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Silver Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors"
                                value={editFormData.silverPrice}
                                onChange={e => setEditFormData({ ...editFormData, silverPrice: e.target.value })}
                            />
                        </div>
                    )}

                    {editFormData.availableMetals.includes("Platinum") && (
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Platinum Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors"
                                value={editFormData.platinumPrice}
                                onChange={e => setEditFormData({ ...editFormData, platinumPrice: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Product Media</label>
                        {(() => {
                            let parsedImages: string[] = [];
                            let parsedVideos: string[] = [];
                            try {
                                const parsed = JSON.parse(editFormData.images || "[]");
                                if (Array.isArray(parsed)) {
                                    parsedImages = parsed.filter(url => !VIDEO_EXT_REGEX.test(url));
                                    parsedVideos = parsed.filter(url => VIDEO_EXT_REGEX.test(url));
                                }
                            } catch {}
                            return (
                                <AdminMediaManager
                                    uploadType="products"
                                    existingImages={parsedImages}
                                    existingVideos={parsedVideos}
                                    onMediaChange={({ images, videos }) => {
                                        const combined = [...images, ...videos];
                                        setEditFormData((prev: any) => ({
                                            ...prev,
                                            images: JSON.stringify(combined)
                                        }));
                                    }}
                                    onUploadingStatusChange={setIsUploading}
                                />
                            );
                        })()}
                    </div>

                    <div className="md:col-span-3"><label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Description</label>
                        <textarea required className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" rows={3} value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                    </div>

                    {/* SEO & Search Section */}
                    <div className="md:col-span-3 border-t border-gray-200 pt-6 mt-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-4">SEO & Search Optimization</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Search Tags (Comma-separated)</label>
                                <input placeholder="e.g. vintage, solitaire, gift" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.tags} onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Extra Search Keywords (Comma-separated)</label>
                                <input placeholder="e.g. unique band, proposal rings" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.extraKeywords} onChange={e => setEditFormData({ ...editFormData, extraKeywords: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SEO Custom Title (Optional)</label>
                                <input placeholder="Fallback: Product Name | Zynora Luxe" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.seoTitle} onChange={e => setEditFormData({ ...editFormData, seoTitle: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">SEO Custom Description (Optional)</label>
                                <input placeholder="Fallback: Product description" className="w-full bg-gray-50 border rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111] border-gray-200 transition-colors" value={editFormData.seoDescription} onChange={e => setEditFormData({ ...editFormData, seoDescription: e.target.value })} />
                            </div>
                        </div>

                        {/* Live SEO & Slug Preview */}
                        <div className="mt-6 p-5 bg-gray-50 border border-gray-200">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-4">Search Engine Result Preview</p>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 block mb-1">Slug / URL Preview:</span>
                                    <code className="text-xs text-amber-600 break-all select-all">
                                        https://zynoraluxe.com/product/{slugify(editFormData.name) || "product-name"}-{editingProduct.id.slice(-4)}
                                    </code>
                                </div>
                                <div className="border border-gray-200 bg-white p-4 rounded shadow-sm max-w-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">Z</div>
                                        <div className="text-xs text-gray-600 truncate">
                                            <span>Zynora Luxe</span>
                                            <span className="mx-1 text-gray-400">›</span>
                                            <span className="text-gray-500">product</span>
                                            <span className="mx-1 text-gray-400">›</span>
                                            <span>{slugify(editFormData.name) || "product-name"}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-blue-800 text-lg hover:underline cursor-pointer font-sans truncate">
                                        {editFormData.seoTitle || (editFormData.name ? `${editFormData.name} | Zynora Luxe` : "Product Name | Zynora Luxe")}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-sans line-clamp-2 mt-1">
                                        {editFormData.seoDescription || editFormData.description || "Enter a description or custom SEO description to see how it will display on search engines."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-3 border-t border-gray-200 pt-6">
                        <button type="button" onClick={() => { setEditingProduct(null); setEditFormData(null); }} className="bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-gray-50 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving || isUploading} className="bg-[#111111] text-white border border-transparent px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all hover:bg-[#C9A14A] hover:text-white">
                            {isSaving ? "Saving changes..." : (isUploading ? "Saving..." : "Update Product")}
                        </button>
                    </div>
                </form>
            )}

            <div className="w-full overflow-x-auto bg-white border border-gray-100 rounded-none shadow-sm custom-scrollbar pb-4 mt-8">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="p-5 font-bold">Product</th>
                            <th className="p-5 font-bold">SKU</th>
                            <th className="p-5 font-bold">Category</th>
                            <th className="p-5 font-bold">Price</th>
                            <th className="p-5 font-bold">Stock</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[0.95rem]">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest font-bold">No products found.</td></tr>
                        ) : filteredProducts.map((product) => {
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
                                    <td className="p-5 font-mono text-xs text-gray-700 font-bold uppercase">
                                        {product.sku || "SKU: Not assigned"}
                                    </td>
                                    <td className="p-5">
                                        <span className="text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md text-gray-700">{product.category.name}</span>
                                    </td>
                                    <td className="p-5 font-bold font-body text-[#111111] tracking-wide">₹{product.price.toLocaleString("en-IN")}</td>
                                    <td className="p-5 text-sm">{product.stockCount > 0 ? <span className="text-[#111111] font-bold uppercase tracking-widest text-[10px] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">{product.stockCount} In Stock</span> : <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">Out of Stock</span>}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => startEdit(product)} className="text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-[#C9A14A] hover:bg-amber-50 hover:border-amber-200 transition-colors bg-gray-50 px-4 py-2 rounded-md border border-gray-200">Edit</button>
                                            <button onClick={() => handleDelete(product.id)} className="text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors bg-gray-50 px-4 py-2 rounded-md border border-gray-200">Delete</button>
                                        </div>
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
