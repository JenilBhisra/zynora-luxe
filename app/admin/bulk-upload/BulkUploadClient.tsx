"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const listingTypes = [
    { id: "diamond", name: "Diamonds" },
    { id: "setting", name: "Ring Settings" },
    { id: "product", name: "Jewellery Products" }
];

export default function BulkUploadClient() {
    const [activeTab, setActiveTab] = useState("diamond");
    const [importMode, setImportMode] = useState("create"); // create vs update
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    
    const [previewData, setPreviewData] = useState<{
        totalRows: number;
        validCount: number;
        invalidCount: number;
        previewRows: any[];
    } | null>(null);

    const [importResult, setImportResult] = useState<{
        totalRows: number;
        createdCount: number;
        updatedCount: number;
        skippedCount: number;
        failedCount: number;
        errorReport: any[];
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        try {
            setLoading(true);
            setLoadingText("Generating template...");
            window.location.href = `/api/admin/bulk-upload/template?type=${activeTab}`;
            toast.success(`${listingTypes.find(t => t.id === activeTab)?.name} template download started.`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download template");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewData(null);
            setImportResult(null);
            toast.success(`Selected file: ${file.name}`);
        }
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileList = Array.from(files);
            setMediaFiles(prev => [...prev, ...fileList]);
            toast.success(`Added ${fileList.length} media files`);
        }
    };

    const uploadMediaFiles = async (): Promise<Record<string, string>> => {
        if (mediaFiles.length === 0) return {};
        
        const mapping: Record<string, string> = {};
        const uploadTypeMap: Record<string, string> = {
            diamond: "diamonds",
            setting: "settings",
            product: "products"
        };
        const uploadType = uploadTypeMap[activeTab] || "products";

        for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            setLoadingText(`Uploading media ${i + 1}/${mediaFiles.length}: ${file.name}...`);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", uploadType);
            formData.append("kind", file.type.startsWith("video") ? "video" : "image");

            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Failed to upload ${file.name}: ${errData.error || res.statusText}`);
            }

            const data = await res.json();
            mapping[file.name] = data.url;
        }

        return mapping;
    };

    const processExcelWithMediaMap = async (file: File, mediaMap: Record<string, string>): Promise<File> => {
        if (Object.keys(mediaMap).length === 0) return file;

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        const replaceKeys = ["imageurls", "videourls", "imageurl", "videourl", "imageUrl", "videoUrl", "imageUrls", "videoUrls"];

        const updatedData = jsonData.map(row => {
            const newRow = { ...row };
            for (const key of Object.keys(newRow)) {
                if (replaceKeys.includes(key.toLowerCase().trim())) {
                    const val = String(newRow[key] || "").trim();
                    if (val) {
                        const replacedParts = val.split(",").map(part => {
                            const trimmedPart = part.trim();
                            return mediaMap[trimmedPart] || trimmedPart;
                        });
                        newRow[key] = replacedParts.join(",");
                    }
                }
            }
            return newRow;
        });

        const newSheet = XLSX.utils.json_to_sheet(updatedData);
        workbook.Sheets[sheetName] = newSheet;
        const outBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
        return new File([outBuffer], file.name, { type: file.type });
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error("Please upload an Excel file first");
            return;
        }

        try {
            setLoading(true);
            setLoadingText("Uploading media files...");
            const mediaMap = await uploadMediaFiles();

            setLoadingText("Processing Excel data...");
            const processedFile = await processExcelWithMediaMap(selectedFile, mediaMap);

            setLoadingText("Validating rows...");
            const formData = new FormData();
            formData.append("file", processedFile);
            formData.append("type", activeTab);

            const res = await fetch("/api/admin/bulk-upload/preview", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to parse preview");
            }

            setPreviewData(data);
            setImportResult(null);
            toast.success("Validation preview loaded successfully.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to preview file");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to import");
            return;
        }

        try {
            setLoading(true);
            setLoadingText("Uploading media files...");
            const mediaMap = await uploadMediaFiles();

            setLoadingText("Processing Excel data...");
            const processedFile = await processExcelWithMediaMap(selectedFile, mediaMap);

            setLoadingText("Importing listings into database...");
            const formData = new FormData();
            formData.append("file", processedFile);
            formData.append("type", activeTab);
            formData.append("importMode", importMode);

            const res = await fetch("/api/admin/bulk-upload/import", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Import failed");
            }

            setImportResult(data);
            setPreviewData(null);
            setMediaFiles([]); // Clear media files after successful import
            toast.success("Bulk import execution completed.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Bulk import failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadErrorReport = () => {
        if (!importResult || !importResult.errorReport || importResult.errorReport.length === 0) return;

        try {
            const wb = XLSX.utils.book_new();
            const wsData = [
                ["Row Number", "SKU", "Listing Type", "Error Reason"],
                ...importResult.errorReport.map(err => [
                    err.rowNumber,
                    err.sku,
                    err.type,
                    err.reason
                ])
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Import Errors");
            XLSX.writeFile(wb, `zynoraluxe_bulk_import_errors_${activeTab}.xlsx`);
            toast.success("Error report exported.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate error report file");
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <header className="flex justify-between items-end mb-6">
                <div>
                    <p className="section-kicker mb-3">Inventory manager</p>
                    <h1 className="section-title text-zinc-900 mb-2 tracking-wide">Bulk Listing Upload</h1>
                    <p className="text-zinc-500 text-[0.95rem] font-light">
                        Upload custom templates to add or update multiple listings in bulk.
                    </p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {listingTypes.map(tab => (
                    <button
                        key={tab.id}
                        disabled={loading}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedFile(null);
                            setPreviewData(null);
                            setImportResult(null);
                        }}
                        className={`py-3 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === tab.id
                                ? "border-[#C9A14A] text-[#C9A14A] bg-gray-50/50"
                                : "border-transparent text-gray-500 hover:text-zinc-900"
                        } disabled:opacity-50`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side actions card */}
                <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-heading text-[#111111] border-b border-gray-100 pb-3">Actions</h3>
                    
                    {/* Template download */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">Step 1: Download Template</label>
                        <button
                            disabled={loading}
                            onClick={handleDownloadTemplate}
                            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-zinc-800 border border-gray-200 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-gray-100 hover:border-gray-300"
                        >
                            <Download size={14} /> Download Template
                        </button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">Step 2: Upload Excel File</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                        <div
                            onClick={triggerFileInput}
                            className="border-2 border-dashed border-gray-300 hover:border-[#C9A14A] p-6 text-center cursor-pointer transition-colors bg-gray-50/50 flex flex-col items-center justify-center gap-2"
                        >
                            <Upload className="text-gray-400" size={24} />
                            <span className="text-xs text-gray-600 font-medium">
                                {selectedFile ? selectedFile.name : "Choose or drag Excel file"}
                            </span>
                        </div>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">Step 3: Select Images/Videos (Optional)</label>
                        <input
                            type="file"
                            ref={mediaInputRef}
                            onChange={handleMediaChange}
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                        />
                        <div
                            onClick={() => mediaInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 hover:border-[#C9A14A] p-6 text-center cursor-pointer transition-colors bg-gray-50/50 flex flex-col items-center justify-center gap-2"
                        >
                            <Upload className="text-gray-400" size={24} />
                            <span className="text-xs text-gray-600 font-medium">
                                {mediaFiles.length > 0 ? `Selected ${mediaFiles.length} media files` : "Choose local image/video files"}
                            </span>
                        </div>
                        {mediaFiles.length > 0 && (
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 border border-gray-200 text-xs">
                                <span className="text-zinc-500 font-medium">Filename match active</span>
                                <button
                                    onClick={() => setMediaFiles([])}
                                    className="font-bold text-red-600 uppercase hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Import Settings */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">Step 4: Database Import Mode</label>
                        <select
                            disabled={loading}
                            value={importMode}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="w-full bg-white border border-gray-200 p-3 text-sm text-[#111111] outline-none focus:border-[#C9A14A] transition-colors cursor-pointer"
                        >
                            <option value="create">Create Only (Skip existing SKUs)</option>
                            <option value="update">Update Existing (Upsert on matching SKU)</option>
                        </select>
                    </div>

                    {/* Control Buttons */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                        <button
                            disabled={loading || !selectedFile}
                            onClick={handlePreview}
                            className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#C9A14A] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            Validate & Preview Data
                        </button>

                        <button
                            disabled={loading || !selectedFile}
                            onClick={handleImport}
                            className="w-full flex items-center justify-center gap-2 bg-[#C9A14A] text-white py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#B89039] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Play size={12} /> Import Listings
                        </button>
                    </div>
                </div>

                {/* Right side results view */}
                <div className="lg:col-span-2 space-y-6">
                    {loading && (
                        <div className="bg-white border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
                            <Loader2 className="animate-spin text-[#C9A14A]" size={36} />
                            <p className="text-zinc-600 font-medium tracking-wide text-sm">{loadingText}</p>
                        </div>
                    )}

                    {!loading && !previewData && !importResult && (
                        <div className="bg-white border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[300px] text-gray-400">
                            <FileSpreadsheet size={48} className="text-gray-300" />
                            <p className="text-sm font-light">Select a file and preview or validate the rows to begin.</p>
                        </div>
                    )}

                    {/* Validation preview container */}
                    {!loading && previewData && (
                        <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <h3 className="text-lg font-heading text-[#111111]">Validation Preview</h3>
                                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                                    <span className="text-gray-500">Total: {previewData.totalRows}</span>
                                    <span className="text-green-600">Valid: {previewData.validCount}</span>
                                    <span className="text-red-500">Invalid: {previewData.invalidCount}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/50">
                                            <th className="py-2.5 px-3">Row</th>
                                            <th className="py-2.5 px-3">SKU</th>
                                            <th className="py-2.5 px-3">Title</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Errors / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs text-zinc-700">
                                        {previewData.previewRows.map((row, idx) => (
                                            <tr key={idx} className={row.status === "INVALID" ? "bg-red-50/20" : ""}>
                                                <td className="py-2.5 px-3 font-semibold text-gray-500">{row.rowNumber}</td>
                                                <td className="py-2.5 px-3 font-mono font-medium">{row.sku}</td>
                                                <td className="py-2.5 px-3 max-w-[200px] truncate">{row.title}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 font-bold uppercase text-[9px] tracking-wide ${
                                                        row.status === "VALID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-red-600 max-w-[250px] truncate" title={row.errors.join("; ")}>
                                                    {row.errors.join("; ") || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Import result summary container */}
                    {!loading && importResult && (
                        <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <h3 className="text-lg font-heading text-[#111111]">Import Summary</h3>
                                {importResult.failedCount > 0 && (
                                    <button
                                        onClick={handleDownloadErrorReport}
                                        className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                                    >
                                        <AlertCircle size={12} /> Download Error Report
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <div className="border border-gray-100 p-4 text-center">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Rows</span>
                                    <span className="text-2xl font-serif text-zinc-800">{importResult.totalRows}</span>
                                </div>
                                <div className="border border-green-100 bg-green-50/10 p-4 text-center">
                                    <span className="block text-[10px] font-bold text-green-500 uppercase tracking-widest">Created</span>
                                    <span className="text-2xl font-serif text-green-700">{importResult.createdCount}</span>
                                </div>
                                <div className="border border-blue-100 bg-blue-50/10 p-4 text-center">
                                    <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest">Updated</span>
                                    <span className="text-2xl font-serif text-blue-700">{importResult.updatedCount}</span>
                                </div>
                                <div className="border border-gray-200 p-4 text-center">
                                    <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Skipped</span>
                                    <span className="text-2xl font-serif text-zinc-700">{importResult.skippedCount}</span>
                                </div>
                                <div className="border border-red-100 bg-red-50/10 p-4 text-center">
                                    <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest">Failed</span>
                                    <span className="text-2xl font-serif text-red-700">{importResult.failedCount}</span>
                                </div>
                            </div>

                            {importResult.errorReport.length > 0 ? (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                                        <AlertCircle size={14} /> Failed Rows Detail ({importResult.failedCount})
                                    </h4>
                                    <div className="overflow-y-auto max-h-[300px] border border-red-100 bg-red-50/5">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-red-100 bg-red-50/20 font-bold text-red-800">
                                                    <th className="py-2 px-3 w-16">Row</th>
                                                    <th className="py-2 px-3 w-28">SKU</th>
                                                    <th className="py-2 px-3">Failure Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-50 text-red-900/80 font-medium">
                                                {importResult.errorReport.map((err, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2 px-3 font-semibold text-red-700">{err.rowNumber}</td>
                                                        <td className="py-2 px-3 font-mono">{err.sku}</td>
                                                        <td className="py-2 px-3">{err.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-green-150 bg-green-50/40 p-5 flex items-center gap-3 text-green-800">
                                    <CheckCircle size={20} className="text-green-600 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-bold uppercase tracking-wider">All rows imported successfully!</p>
                                        <p className="opacity-90 mt-0.5">Database remains fully synced. No validation failures encountered.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
