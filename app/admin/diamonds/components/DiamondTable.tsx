/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Search, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import AdminMediaManager from "@/app/admin/components/AdminMediaManager";

const ITEMS_PER_PAGE = 10;

export function DiamondTable({ initialDiamonds }: { initialDiamonds: any[] }) {
    const [diamonds, setDiamonds] = useState(initialDiamonds);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal States
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form States
    const [editingDiamond, setEditingDiamond] = useState<any | null>(null);
    const [diamondToDelete, setDiamondToDelete] = useState<any | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        sku: "",
        shape: "Round",
        caratWeight: "1.0",
        cut: "Excellent",
        clarity: "VS1",
        color: "G",
        certification: "GIA",
        price: "150000",
        stockCount: "1",
        imageUrl: "",
        modelUrl: ""
    });

    // Computed filtering and pagination
    const filteredDiamonds = useMemo(() => {
        if (!searchQuery) return diamonds;
        const q = searchQuery.toLowerCase();
        return diamonds.filter(d =>
            d.shape.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            d.color.toLowerCase().includes(q) ||
            d.clarity.toLowerCase().includes(q) ||
            d.certification.toLowerCase().includes(q) ||
            (d.sku && d.sku.toLowerCase().includes(q))
        );
    }, [diamonds, searchQuery]);

    const totalPages = Math.ceil(filteredDiamonds.length / ITEMS_PER_PAGE);
    const currentDiamonds = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDiamonds.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredDiamonds, currentPage]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const openAddModal = () => {
        setEditingDiamond(null);
        setFormData({
            sku: "",
            shape: "Round", caratWeight: "1.0", cut: "Excellent", clarity: "VS1", color: "G", certification: "GIA", price: "150000", stockCount: "1", imageUrl: "", modelUrl: ""
        });
        setIsAddEditModalOpen(true);
    };

    const openEditModal = (diamond: any) => {
        setEditingDiamond(diamond);
        setFormData({
            sku: diamond.sku || "",
            shape: diamond.shape,
            caratWeight: diamond.caratWeight.toString(),
            cut: diamond.cut,
            clarity: diamond.clarity,
            color: diamond.color,
            certification: diamond.certification,
            price: diamond.price.toString(),
            stockCount: (diamond.stockCount ?? 1).toString(),
            imageUrl: diamond.imageUrl || "",
            modelUrl: diamond.modelUrl || ""
        });
        setIsAddEditModalOpen(true);
    };

    const openDeleteModal = (diamond: any) => {
        setDiamondToDelete(diamond);
        setIsDeleteModalOpen(true);
    };

    const toggleStock = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "AVAILABLE" ? "SOLD" : "AVAILABLE";
        try {
            const res = await fetch(`/api/admin/diamonds/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stockStatus: newStatus })
            });
            if (res.ok) {
                toast.success(`Marked as ${newStatus}`);
                setDiamonds(diamonds.map(d => d.id === id ? { ...d, stockStatus: newStatus } : d));
            } else {
                toast.error("Failed to update stock");
            }
        } catch {
            toast.error("Network error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading) {
            toast.error("Please wait until all uploads are complete.");
            return;
        }
        try {
            const isEditing = !!editingDiamond;
            const url = isEditing ? `/api/admin/diamonds/${editingDiamond.id}` : `/api/admin/diamonds`;
            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    caratWeight: parseFloat(formData.caratWeight),
                    stockCount: parseInt(formData.stockCount) || 1
                })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(isEditing ? "Diamond updated" : "Diamond added successfully");
                if (isEditing) {
                    setDiamonds(diamonds.map(d => d.id === editingDiamond.id ? data.diamond || { ...d, ...formData, price: parseFloat(formData.price), caratWeight: parseFloat(formData.caratWeight), stockCount: parseInt(formData.stockCount) || 1 } : d));
                } else {
                    setDiamonds([data.diamond, ...diamonds]);
                }
                setIsAddEditModalOpen(false);
            } else {
                toast.error(data.error || "Operation failed");
            }
        } catch {
            toast.error("Network error");
        }
    };

    const executeDelete = async () => {
        if (!diamondToDelete) {
            console.error("executeDelete called but diamondToDelete is null");
            return;
        }
        console.log("Delete diamond clicked, id:", diamondToDelete.id);
        try {
            const url = `/api/admin/diamonds/${diamondToDelete.id}`;
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
                toast.success("Diamond deleted");
                setDiamonds(prev => prev.filter(d => d.id !== diamondToDelete.id));
                setIsDeleteModalOpen(false);
                setDiamondToDelete(null);
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (err) {
            console.error("Delete diamond error:", err);
            toast.error("Network error");
        }
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
                        placeholder="Search shape, color, clarity, ID..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="pl-11 pr-4 py-3 w-full bg-white text-[#111111] border border-gray-200 rounded-none text-[0.95rem] focus:ring-2 focus:ring-gray-200 focus:border-[#111111] outline-none transition-all placeholder-soft-cream/30 shadow-sm "
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-[#111111] text-white border border-transparent hover:bg-[#C9A14A] hover:text-white px-6 py-3 rounded-none font-bold uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-1 whitespace-nowrap"
                >
                    + Add Diamond
                </button>
            </div>

            {/* TABLE */}
            <div className="w-full overflow-x-auto bg-white  border border-gray-100 shadow-sm rounded-none pb-4">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="p-5 font-bold">Image</th>
                            <th className="p-5 font-bold">SKU</th>
                            <th className="p-5 font-bold">Specs</th>
                            <th className="p-5 font-bold">Grading</th>
                            <th className="p-5 font-bold">Price</th>
                            <th className="p-5 font-bold">Status</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentDiamonds.length === 0 ? (
                            <tr><td colSpan={7} className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest font-bold">No diamonds match your search criteria.</td></tr>
                        ) : currentDiamonds.map((diamond) => (
                            <tr key={diamond.id} className="hover:bg-gray-100/50 transition-colors">
                                <td className="p-5">
                                    <div className="w-14 h-14 bg-gray-50 rounded-none overflow-hidden flex items-center justify-center border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
                                        {diamond.imageUrl ? (
                                            <Image src={diamond.imageUrl} alt={diamond.shape} width={56} height={56} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-300 text-[10px] uppercase font-bold tracking-widest">No Img</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 font-mono text-xs text-gray-700 font-bold uppercase">
                                    {diamond.sku || "SKU: Not assigned"}
                                </td>
                                <td className="p-5">
                                    <p className="font-bold text-[#111111] tracking-wide">{parseFloat(diamond.caratWeight).toFixed(2)}ct {diamond.shape}</p>
                                    <p className="text-[11px] text-gray-400 font-mono mt-1">ID: {diamond.id.slice(-6).toUpperCase()}</p>
                                </td>
                                <td className="p-5 text-[0.95rem] text-gray-700">
                                    <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C9A14A]"></span>{diamond.color} Color</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    {diamond.clarity} <span className="mx-2 text-gray-300">|</span> {diamond.cut}
                                    <br />
                                    <span className="text-[10px] font-bold text-gray-800 mt-2 inline-block bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">{diamond.certification}</span>
                                </td>
                                <td className="p-5 font-bold font-body text-[#111111] tracking-wide text-lg">
                                    ₹{parseFloat(diamond.price).toLocaleString("en-IN")}
                                </td>
                                <td className="p-5">
                                    <button
                                        onClick={() => toggleStock(diamond.id, diamond.stockStatus)}
                                        className={`text-[9px] font-bold px-3 py-1.5 rounded-full tracking-[0.15em] uppercase transition-colors border ${diamond.stockStatus === "AVAILABLE" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-200"
                                            }`}
                                    >
                                        {diamond.stockStatus}
                                    </button>
                                </td>
                                <td className="p-5 text-right space-x-3">
                                    <button onClick={() => openEditModal(diamond)} className="p-2 text-gray-400 hover:text-[#111111] transition-colors inline-block bg-gray-50 hover:bg-gray-200 rounded-none border border-gray-200" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => openDeleteModal(diamond)} className="p-2 text-gray-400 hover:text-red-600 transition-colors inline-block bg-gray-50 hover:bg-red-50 rounded-none border border-gray-200 hover:border-red-200" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100">
                        <span className="text-xs tracking-widest uppercase font-bold text-gray-400">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredDiamonds.length)} of {filteredDiamonds.length} items
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-none border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 hover:text-[#111111] transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                    // Make pagination adaptive
                                    let pageNum = idx + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 2 + idx;
                                    }
                                    if (pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-none text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-[#111111] border border-[#111111] text-white shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#111111] border border-transparent hover:border-gray-300'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-none border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 hover:text-[#111111] transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD/EDIT MODAL OVERLAY */}
            {isAddEditModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-4">
                    <div className="bg-white border border-gray-200 rounded-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <h3 className="text-2xl font-heading tracking-wide !text-[#111111]">
                                {editingDiamond ? "Edit Diamond" : "Register New Diamond"}
                            </h3>
                            <button onClick={() => setIsAddEditModalOpen(false)} className="text-gray-400 hover:text-[#111111] hover:bg-gray-100 p-2 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">SKU</label>
                                    <input 
                                        placeholder="e.g. ZL-DIA-001" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" 
                                        value={formData.sku || ""} 
                                        onChange={e => {
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                                            setFormData({ ...formData, sku: val });
                                        }} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Shape</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.shape} onChange={e => setFormData({ ...formData, shape: e.target.value })}>
                                        <option>Round</option>
                                        <option>Oval</option>
                                        <option>Emerald</option>
                                        <option>Cushion</option>
                                        <option>Elongated Cushion</option>
                                        <option>Pear</option>
                                        <option>Radiant</option>
                                        <option>Princess</option>
                                        <option>Marquise</option>
                                        <option>Asscher</option>
                                        <option>Heart</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Carat Weight</label>
                                    <input type="number" step="0.01" required className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.caratWeight} onChange={e => setFormData({ ...formData, caratWeight: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Price (₹)</label>
                                    <input type="number" required className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Color</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}>
                                        <option>D</option><option>E</option><option>F</option><option>G</option><option>H</option><option>I</option><option>J</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Clarity</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.clarity} onChange={e => setFormData({ ...formData, clarity: e.target.value })}>
                                        <option>FL</option><option>IF</option><option>VVS1</option><option>VVS2</option><option>VS1</option><option>VS2</option><option>SI1</option><option>SI2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Cut</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.cut} onChange={e => setFormData({ ...formData, cut: e.target.value })}>
                                        <option>Excellent</option><option>Very Good</option><option>Good</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Certification</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.certification} onChange={e => setFormData({ ...formData, certification: e.target.value })}>
                                        <option>GIA</option><option>IGI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Quantity (Stock)</label>
                                    <input type="number" required min="1" className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 text-sm text-[#111111] outline-none focus:border-[#111111]" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Diamond Media</label>
                                    <AdminMediaManager
                                        uploadType="diamonds"
                                        existingImages={formData.imageUrl ? [formData.imageUrl] : []}
                                        existingModel3d={formData.modelUrl || null}
                                        onMediaChange={({ images, model3d }) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                imageUrl: images[0] || "",
                                                modelUrl: model3d || ""
                                            }));
                                        }}
                                        onUploadingStatusChange={setIsUploading}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="px-6 py-3 rounded-none font-bold uppercase tracking-widest text-xs text-gray-600 hover:bg-gray-100 hover:text-[#111111] transition-colors" disabled={isUploading}>
                                    Cancel
                                </button>
                                <button type="submit" className="bg-[#111111] text-white border border-transparent hover:bg-[#C9A14A] hover:text-white px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5" disabled={isUploading}>
                                    {isUploading ? "Uploading..." : (editingDiamond ? "Save Changes" : "Save Diamond")}
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
                        <h3 className="text-xl font-heading tracking-wide !text-[#111111] mb-3">Delete Diamond?</h3>
                        <p className="text-[0.95rem] font-light text-gray-600 mb-8 leading-relaxed">
                            Are you sure you want to permanently delete this diamond records? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 rounded-none font-bold uppercase tracking-widest text-xs text-gray-600 bg-gray-50 hover:bg-gray-200 transition-colors border border-transparent">
                                Cancel
                            </button>
                            <button onClick={executeDelete} className="flex-1 bg-red-500 text-white border border-red-500 px-4 py-3 rounded-none font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
