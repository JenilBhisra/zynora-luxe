"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Image as ImageIcon, Edit3, Settings, 
    UploadCloud, Trash2, X, Check, Search, ChevronRight, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image-compression";

interface AdminStudioProps {
    isAdmin: boolean;
}

interface Diamond {
    id: string;
    shape: string;
    caratWeight: number;
    cut: string;
    color: string;
    clarity: string;
    price: number;
    imageUrl?: string;
}

interface Setting {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl?: string;
}

// All editable text fields for the homepage â€“ defined at module scope so they are accessible
// both in the render tree and in the handleSaveText handler.
const TEXT_FIELDS = [
    // Hero Section
    { key: "text:hero-badge", label: "Top Badge Text", default: "Certified diamonds \u2022 Bespoke rings \u2022 Hand-finished in India", group: "Hero Section", multi: false },
    { key: "text:hero-headline-1", label: "Headline \u2013 Line 1", default: "Crafted for", group: "Hero Section", multi: false },
    { key: "text:hero-headline-2", label: "Headline \u2013 Line 2", default: "the rarest moments", group: "Hero Section", multi: false },
    { key: "text:hero-subheadline", label: "Subheadline Paragraph", default: "An understated luxury experience for custom rings, certified diamonds, and heirloom jewelry with cinematic presentation and meticulous detail.", group: "Hero Section", multi: true },
    // Journey Scroll Scene
    { key: "text:scroll-1-kicker", label: "Frame 1 \u2013 Kicker", default: "Hero Scene", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-1-title", label: "Frame 1 \u2013 Title", default: "Design Your Signature Ring", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-1-body", label: "Frame 1 \u2013 Body", default: "A guided luxury journey that keeps focus on one meaningful choice at a time.", group: "Journey Scroll Scene", multi: true },
    { key: "text:scroll-2-kicker", label: "Frame 2 \u2013 Kicker", default: "Product Reveal", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-2-title", label: "Frame 2 \u2013 Title", default: "Your statement piece takes shape", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-2-body", label: "Frame 2 \u2013 Body", default: "Every silhouette is balanced for brilliance, comfort, and quiet confidence.", group: "Journey Scroll Scene", multi: true },
    { key: "text:scroll-3-kicker", label: "Frame 3 \u2013 Kicker", default: "Feature Highlight", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-3-title", label: "Frame 3 \u2013 Title", default: "Every detail is engineered to captivate", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-3-body", label: "Frame 3 \u2013 Body", default: "Close-up craftsmanship reveals premium finishing and proportion-led design.", group: "Journey Scroll Scene", multi: true },
    { key: "text:scroll-4-kicker", label: "Frame 4 \u2013 Kicker", default: "Detail Zoom", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-4-title", label: "Frame 4 \u2013 Title", default: "Precision meets emotional design", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-4-body", label: "Frame 4 \u2013 Body", default: "Refined metalwork and stone architecture build desire before action.", group: "Journey Scroll Scene", multi: true },
    { key: "text:scroll-5-kicker", label: "Frame 5 \u2013 Kicker", default: "Action Scene", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-5-title", label: "Frame 5 \u2013 Title", default: "Own the design that feels uniquely yours", group: "Journey Scroll Scene", multi: false },
    { key: "text:scroll-5-body", label: "Frame 5 \u2013 Body", default: "Continue to customization or certified diamonds with zero friction and immediate clarity.", group: "Journey Scroll Scene", multi: true },
    // Value Prop Section
    { key: "text:journey-kicker", label: "Section Kicker", default: "The Custom Journey", group: "Value Prop Section", multi: false },
    { key: "text:journey-headline", label: "Section Headline", default: "Create a ring as rare as the moment it marks", group: "Value Prop Section", multi: false },
    { key: "text:journey-body", label: "Section Body", default: "Design with certified stones, refined settings, and precious metals. Every step is deliberate, calm, and built for an effortless experience.", group: "Value Prop Section", multi: true },
    // Featured Collection
    { key: "text:featured-heading", label: "Section Heading", default: "Signature pieces, hand-selected", group: "Featured Collection", multi: false },
    // Trust Section
    { key: "text:trust-heading", label: "Section Heading", default: "Designed with certainty, delivered with care", group: "Trust Section", multi: false },
    { key: "text:trust-body", label: "Section Body", default: "Premium jewelry deserves a presentation that feels equally assured. Certified sourcing, insured delivery, and personal assistance guide every order.", group: "Trust Section", multi: true },
    // CTA Section
    { key: "text:cta-heading", label: "Section Heading", default: "Three ways to find your perfect piece", group: "CTA Section", multi: false },
    { key: "text:cta-body", label: "Section Body", default: "Whether you're creating a custom ring, exploring certified diamonds, or browsing signature pieces, we've designed a calm, intentional journey for you.", group: "CTA Section", multi: true },
];

interface TextFieldRowProps {
    field: typeof TEXT_FIELDS[0];
    initialValue: string;
    hasOverride: boolean;
    isSaving: boolean;
    onSave: (value: string) => void;
}

function TextFieldRow({ field, initialValue, hasOverride, isSaving, onSave }: TextFieldRowProps) {
    const [val, setVal] = useState(initialValue);

    useEffect(() => {
        setVal(initialValue);
    }, [initialValue]);

    return (
        <div className="border border-white/8 rounded-xl bg-white/3 p-3.5">
            <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-white/90">{field.label}</label>
                {hasOverride && (
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D6B25E]/20 text-[#D6B25E] font-bold">
                        ✓ Custom
                    </span>
                )}
            </div>
            {field.multi ? (
                <textarea
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-[#D6B25E]/60 resize-none transition-all leading-relaxed"
                    rows={3}
                />
            ) : (
                <input
                    type="text"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-[#D6B25E]/60 transition-all"
                />
            )}
            <div className="mt-2 flex items-center justify-end">
                <button
                    onClick={() => onSave(val)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C] transition-all font-bold uppercase tracking-wider text-[9px] disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
            </div>
        </div>
    );
}

export function AdminStudio({ isAdmin }: AdminStudioProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"homepage" | "diamonds" | "settings" | "text">("homepage");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const router = useRouter();

    // List of customizable homepage assets
    const [homepageAssets, setHomepageAssets] = useState<Record<string, string>>({});
    const [selectedHomepageKey, setSelectedHomepageKey] = useState<string>("hero-slide-1");

    // Inventory lists & searches
    const [diamonds, setDiamonds] = useState<Diamond[]>([]);
    const [settingsList, setSettingsList] = useState<Setting[]>([]);
    const [diamondSearch, setDiamondSearch] = useState("");
    const [settingSearch, setSettingSearch] = useState("");
    
    const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null);
    const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);

    // Text content editor state
    const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
    const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAdmin) return;

        // Fetch homepage overrides
        fetch("/api/admin/homepage")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.assets) {
                    setHomepageAssets(data.assets);
                }
            })
            .catch(err => console.error("Error loading homepage assets", err));

        // Fetch inventory lists for dropdowns
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSettingsList(data);
            })
            .catch(err => console.error("Error loading settings", err));

        // Fetch diamonds
        fetch("/api/diamonds?limit=100")
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.diamonds)) {
                    setDiamonds(data.diamonds);
                }
            })
            .catch(err => console.error("Error loading diamonds", err));
    }, [isAdmin]);

    // Handle incoming visual/in-place edit triggers from the home page
    useEffect(() => {
        const handleVisualEditTrigger = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { type, key, item } = customEvent.detail;
            
            if (type === "homepage") {
                setActiveTab("homepage");
                setSelectedHomepageKey(key);
            } else if (type === "diamond") {
                setActiveTab("diamonds");
                setSelectedDiamond(item);
            } else if (type === "setting") {
                setActiveTab("settings");
                setSelectedSetting(item);
            }
            
            setIsOpen(true);
        };

        window.addEventListener("zynora-edit-asset", handleVisualEditTrigger);
        return () => {
            window.removeEventListener("zynora-edit-asset", handleVisualEditTrigger);
        };
    }, []);

    // Broadcast edit mode changes so other sections can show visual edit badges
    const toggleEditMode = () => {
        const nextState = !isEditMode;
        setIsEditMode(nextState);
        
        // Expose to window and trigger change event
        (window as any).__zynora_edit_mode = nextState;
        window.dispatchEvent(new CustomEvent("zynora-edit-mode-changed", { detail: { active: nextState } }));
        
        if (nextState) {
            toast.success("Studio Edit Mode Activated. Click any pencil icon on the page to customize.", {
                style: { background: "#0B0B0C", border: "1px solid #D6B25E", color: "#fff" }
            });
        } else {
            toast.info("Studio Edit Mode Deactivated.");
        }
    };

    // Save a text field value to the DB (reuses the same SiteAsset key-value store)
    const handleSaveText = async (key: string, value: string) => {
        setSavingKeys(prev => new Set(prev).add(key));
        try {
            const res = await fetch("/api/admin/homepage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, url: value })
            });
            if (!res.ok) throw new Error("Save failed");
            setHomepageAssets(prev => ({ ...prev, [key]: value }));
            toast.success("Text saved!", { style: { background: "#0B0B0C", border: "1px solid #D6B25E", color: "#fff" } });
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to save text.");
        } finally {
            setSavingKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
        }
    };

    if (!isAdmin) return null;

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        // Size check (max 50MB for images)
        if (rawFile.size > 50 * 1024 * 1024) {
            toast.error("File exceeds 50MB size limit.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);
        
        try {
            const file = await compressImage(rawFile);
            
            // 1. Upload file using the admin upload API
            const formData = new FormData();
            formData.append("file", file);
            
            // Map active panel tab to upload directory types
            let uploadType = "products";
            if (activeTab === "diamonds") uploadType = "diamonds";
            if (activeTab === "settings") uploadType = "settings";
            if (activeTab === "homepage") uploadType = "homepage";
            
            formData.append("type", uploadType);
            formData.append("kind", "image");

            // Pass previousUrl to delete the older image and prevent database bloating
            let prevUrl = "";
            if (activeTab === "homepage" && homepageAssets[selectedHomepageKey]) {
                prevUrl = homepageAssets[selectedHomepageKey];
            } else if (activeTab === "diamonds" && selectedDiamond?.imageUrl) {
                prevUrl = selectedDiamond.imageUrl;
            } else if (activeTab === "settings" && selectedSetting?.imageUrl) {
                prevUrl = selectedSetting.imageUrl;
            }
            if (prevUrl && prevUrl.startsWith("/uploads/")) {
                formData.append("previousUrl", prevUrl);
            }

            setUploadProgress(30);

            const uploadRes = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.error || "Upload failed");
            }

            const uploadData = await uploadRes.json();
            const uploadedUrl = uploadData.url;

            setUploadProgress(70);

            // 2. Perform DB Updates
            if (activeTab === "homepage") {
                // Save custom homepage asset link
                const saveRes = await fetch("/api/admin/homepage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: selectedHomepageKey, url: uploadedUrl })
                });

                if (!saveRes.ok) throw new Error("Failed to save homepage override in database.");
                
                // Update local homepage assets state
                setHomepageAssets(prev => ({ ...prev, [selectedHomepageKey]: uploadedUrl }));
                toast.success("Homepage asset replaced successfully!", {
                    style: { background: "#0B0B0C", border: "1px solid #D6B25E", color: "#fff" }
                });
                router.refresh();

            } else if (activeTab === "diamonds" && selectedDiamond) {
                // Update specific diamond imageUrl in DB
                const saveRes = await fetch(`/api/admin/diamonds/${selectedDiamond.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: uploadedUrl })
                });

                if (!saveRes.ok) throw new Error("Failed to update diamond record.");
                
                // Update states
                setSelectedDiamond(prev => prev ? { ...prev, imageUrl: uploadedUrl } : null);
                setDiamonds(prev => prev.map(d => d.id === selectedDiamond.id ? { ...d, imageUrl: uploadedUrl } : d));
                toast.success(`Default photo updated for ${selectedDiamond.shape} Diamond (${selectedDiamond.caratWeight}ct)!`, {
                    style: { background: "#0B0B0C", border: "1px solid #D6B25E", color: "#fff" }
                });
                router.refresh();

            } else if (activeTab === "settings" && selectedSetting) {
                // Update specific setting default imageUrl in DB
                const saveRes = await fetch(`/api/admin/settings/${selectedSetting.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: uploadedUrl })
                });

                if (!saveRes.ok) throw new Error("Failed to update setting record.");
                
                // Update states
                setSelectedSetting(prev => prev ? { ...prev, imageUrl: uploadedUrl } : null);
                setSettingsList(prev => prev.map(s => s.id === selectedSetting.id ? { ...s, imageUrl: uploadedUrl } : s));
                toast.success(`Default photo updated for ${selectedSetting.name} Setting!`, {
                    style: { background: "#0B0B0C", border: "1px solid #D6B25E", color: "#fff" }
                });
                router.refresh();
            }

            setUploadProgress(100);
        } catch (err: any) {
            console.error("Reallocation error:", err);
            toast.error(err.message || "An error occurred during updating.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (e.target) e.target.value = ""; // clear file input
        }
    };

    // Filter logic for lists - Memoized to prevent lagging
    const filteredDiamonds = useMemo(() => {
        return diamonds.filter(d => 
            `${d.shape} ${d.caratWeight}ct ${d.color} ${d.clarity}`.toLowerCase().includes(diamondSearch.toLowerCase())
        );
    }, [diamonds, diamondSearch]);

    const filteredSettings = useMemo(() => {
        return settingsList.filter(s => 
            s.name.toLowerCase().includes(settingSearch.toLowerCase()) || 
            s.category.toLowerCase().includes(settingSearch.toLowerCase())
        );
    }, [settingsList, settingSearch]);

    const homepageKeys = [
        // â”€â”€ Hero Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        { key: "hero-slide-1", label: "Hero Slider â€“ Image 1", defaultUrl: "/products/ring-2.jpg", group: "Hero Slider" },
        { key: "hero-slide-2", label: "Hero Slider â€“ Image 2", defaultUrl: "/products/earrings-1.jpg", group: "Hero Slider" },
        { key: "hero-slide-3", label: "Hero Slider â€“ Image 3", defaultUrl: "/uploads/diamonds/diamond-1774253879693-464841660.webp", group: "Hero Slider" },
        // â”€â”€ Section Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        { key: "journey-image", label: "Value Prop Main Image", defaultUrl: "/products/ring-2.jpg", group: "Section Banners" },
        { key: "journey-image-2", label: "Value Prop Detail Image", defaultUrl: "/products/earrings-1.jpg", group: "Section Banners" },
        { key: "journey-image-3", label: "Value Prop Secondary Image", defaultUrl: "/products/loose-diamond.jpg", group: "Section Banners" },
        // â”€â”€ Journey Scroll Scene â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        { key: "scroll-scene-1", label: "Scroll Scene â€“ Frame 1 (Hero Scene)", defaultUrl: "/products/ring-2.jpg", group: "Journey Scroll Scene" },
        { key: "scroll-scene-2", label: "Scroll Scene â€“ Frame 2 (Product Reveal)", defaultUrl: "/products/ring-2.jpg", group: "Journey Scroll Scene" },
        { key: "scroll-scene-3", label: "Scroll Scene â€“ Frame 3 (Feature Highlight)", defaultUrl: "/products/ring-2.jpg", group: "Journey Scroll Scene" },
        { key: "scroll-scene-4", label: "Scroll Scene â€“ Frame 4 (Detail Zoom)", defaultUrl: "/products/ring-2.jpg", group: "Journey Scroll Scene" },
        { key: "scroll-scene-5", label: "Scroll Scene â€“ Frame 5 (Action Scene)", defaultUrl: "/products/ring-2.jpg", group: "Journey Scroll Scene" },
        // â”€â”€ Category Gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        { key: "category-rings", label: "Category Panel â€“ Rings", defaultUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80", group: "Category Gallery" },
        { key: "category-earrings", label: "Category Panel â€“ Earrings", defaultUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80", group: "Category Gallery" },
        { key: "category-necklaces", label: "Category Panel â€“ Necklaces", defaultUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=80", group: "Category Gallery" },
        { key: "category-diamonds", label: "Category Panel â€“ Diamonds", defaultUrl: "/products/loose-diamond.jpg", group: "Category Gallery" },
        // â”€â”€ Featured Product Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        { key: "featured-product-1", label: "Featured Product Card 1", defaultUrl: "/products/ring-2.jpg", group: "Featured Products" },
        { key: "featured-product-2", label: "Featured Product Card 2", defaultUrl: "/products/ring-2.jpg", group: "Featured Products" },
        { key: "featured-product-3", label: "Featured Product Card 3", defaultUrl: "/products/ring-2.jpg", group: "Featured Products" },
        { key: "featured-product-4", label: "Featured Product Card 4", defaultUrl: "/products/ring-2.jpg", group: "Featured Products" },
        { key: "featured-collection-bg", label: "Featured Collection Background Image", defaultUrl: "/images/about2.jpg", group: "Featured Products" },
    ];

    const currentHomepageOverride = homepageAssets[selectedHomepageKey] || "";
    const activeHomepageItem = homepageKeys.find(item => item.key === selectedHomepageKey);

    return (
        <>
            {/* â”€â”€ Studio Portal Floating Control Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3">
                <button
                    onClick={toggleEditMode}
                    className="flex items-center gap-2.5 px-6 py-4 rounded-full font-bold uppercase tracking-[0.16em] text-[11px] bg-[#C9A14A] text-[#1A1A1A] hover:bg-[#B58F3B] transition-all duration-500 shadow-2xl relative overflow-hidden group border border-[#C9A14A]/20"
                >
                    <Edit3 size={14} color="#1A1A1A" className={isEditMode ? "animate-pulse" : ""} />
                    <span>{isEditMode ? "Edit Mode Enabled" : "Enable Edit Mode"}</span>
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 duration-500" />
                </button>

                {isEditMode && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsOpen(true)}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#C9A14A] text-[#1A1A1A] hover:bg-[#B58F3B] border border-[#C9A14A]/20 transition-colors shadow-2xl"
                        title="Open Design Studio Panel"
                    >
                        <Settings size={18} color="#1A1A1A" className="animate-spin" style={{ animationDuration: "12s" }} />
                    </motion.button>
                )}
            </div>

            {/* â”€â”€ Visual Design Studio Side Panel / Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-end p-0 md:p-6 bg-black/60 backdrop-blur-sm">
                        {/* Overlay backdrop click to close */}
                        <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                        {/* Glassmorphic Drawer panel */}
                        <motion.div
                            initial={{ x: "100%", opacity: 0.9 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0.9 }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="relative w-full md:max-w-2xl h-full max-h-screen bg-[#0C0C0D] border-l md:border border-white/10 shadow-2xl flex flex-col overflow-hidden transform-gpu"
                        >

                            {/* Header */}
                            <div className="relative z-10 px-6 py-5 border-b border-white/8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#D6B25E]/10 flex items-center justify-center text-[#D6B25E]">
                                        <Sparkles size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-semibold text-white tracking-[0.06em]">Zynora Admin Studio</h2>
                                        <p className="text-[11px] text-white/50 tracking-wider">VISUAL CURATION & PHOTO MANAGER</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="relative z-10 px-6 pt-3 flex gap-2 border-b border-white/6 bg-[#0E0E10]/40">
                                {[
                                    { id: "homepage", label: "Homepage Assets", icon: ImageIcon },
                                    { id: "diamonds", label: "Diamonds Inventory", icon: Sparkles },
                                    { id: "settings", label: "Ring Settings", icon: Settings },
                                    { id: "text", label: "Text Content", icon: Edit3 },
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-wider font-semibold border-b-2 transition-all ${
                                                isActive 
                                                    ? "border-[#D6B25E] text-[#D6B25E]" 
                                                    : "border-transparent text-white/50 hover:text-white/80"
                                            }`}
                                        >
                                            <Icon size={13} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/jpeg,image/png,image/webp" 
                                    className="hidden" 
                                />

                                {/* â”€â”€ Homepage Asset Customizer Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                                {activeTab === "homepage" && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-[0.2em] text-white/60 mb-3">Select Asset to Replace</label>
                                            <div className="space-y-4">
                                                {/* Group keys by their group property */}
                                                {Array.from(new Set(homepageKeys.map(k => k.group))).map(group => (
                                                    <div key={group}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[9px] uppercase tracking-[0.22em] text-[#D6B25E]/80 font-bold">{group}</span>
                                                            <div className="flex-1 h-px bg-[#D6B25E]/15" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {homepageKeys.filter(k => k.group === group).map((item) => {
                                                                const isSelected = selectedHomepageKey === item.key;
                                                                const hasOverride = !!homepageAssets[item.key];
                                                                return (
                                                                    <button
                                                                        key={item.key}
                                                                        onClick={() => setSelectedHomepageKey(item.key)}
                                                                        className={`p-3 rounded-xl border text-left transition-all ${
                                                                            isSelected 
                                                                                ? "bg-[#D6B25E]/8 border-[#D6B25E]" 
                                                                                : "bg-white/3 border-white/8 hover:border-white/18 hover:bg-white/5"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-[11px] font-medium text-white leading-tight">{item.label}</span>
                                                                            {hasOverride && (
                                                                                <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D6B25E]/20 text-[#D6B25E] font-bold ml-1 flex-shrink-0">âœ“ Custom</span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[9px] text-white/35 block overflow-hidden text-ellipsis whitespace-nowrap">
                                                                            {hasOverride ? "ðŸŸ¢ Overridden" : "âšª Default asset"}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>


                                        {/* Preview Card */}
                                        <div className="border border-white/10 rounded-2xl bg-[#09090A]/80 p-5 overflow-hidden relative">
                                            <span className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-bold mb-3">Live Thumbnail Preview</span>
                                            
                                            <div className="relative aspect-video rounded-xl bg-black border border-white/6 overflow-hidden flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentHomepageOverride || activeHomepageItem?.defaultUrl}
                                                    alt="Asset Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[13px] font-medium text-white">{activeHomepageItem?.label}</p>
                                                    <p className="text-[11px] text-white/50 mt-0.5">
                                                        {currentHomepageOverride ? "Using customized override image." : "Using default pre-loaded asset."}
                                                    </p>
                                                    <p className="text-[9px] text-[#D6B25E]/80 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                                        <Check size={10} /> Auto-saves on upload
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={handleUploadClick}
                                                    disabled={isUploading}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C] transition-all font-semibold uppercase tracking-wider text-[10px] disabled:opacity-50"
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 size={13} className="animate-spin" />
                                                            <span>Uploading...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud size={13} />
                                                            <span>Replace Photo</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {isUploading && (
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                                                    <motion.div 
                                                        className="h-full bg-[#D6B25E]" 
                                                        animate={{ width: `${uploadProgress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ Diamonds Inventory Media Editor Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                                {activeTab === "diamonds" && (
                                    <div className="space-y-6">
                                        {/* Search Filter */}
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={15} />
                                            <input
                                                type="text"
                                                placeholder="Search Diamond by shape, weight, color..."
                                                value={diamondSearch}
                                                onChange={(e) => setDiamondSearch(e.target.value)}
                                                className="w-full bg-white/4 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#D6B25E]/60 focus:bg-white/6 transition-all"
                                            />
                                        </div>

                                        {/* Search list display */}
                                        {!selectedDiamond ? (
                                            <div>
                                                <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Diamonds Directory ({filteredDiamonds.length} items)</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto custom-scrollbar border border-white/6 rounded-xl bg-white/2 p-2">
                                                    {filteredDiamonds.slice(0, 40).map((diamond) => (
                                                        <button
                                                            key={diamond.id}
                                                            onClick={() => setSelectedDiamond(diamond)}
                                                            className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-white/8 hover:bg-white/4 text-left transition-all"
                                                        >
                                                            <div className="w-12 h-12 bg-black border border-white/10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                                                {diamond.imageUrl ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={diamond.imageUrl} alt={diamond.shape} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[14px]">ðŸ’Ž</span>
                                                                )}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h4 className="text-[12px] font-medium text-white truncate">{diamond.caratWeight}ct {diamond.shape}</h4>
                                                                <p className="text-[10px] text-white/40 mt-0.5 truncate">{diamond.color} â€¢ {diamond.clarity} â€¢ {diamond.cut}</p>
                                                            </div>
                                                            <ChevronRight size={13} className="ml-auto text-white/20" />
                                                        </button>
                                                    ))}
                                                    {filteredDiamonds.length === 0 && (
                                                        <div className="col-span-2 py-8 text-center text-white/40 text-[12px]">
                                                            No matching diamonds found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Diamond Selected - Show Upload & Edit controls
                                            <div className="border border-white/10 rounded-2xl bg-[#09090A]/80 p-5 relative overflow-hidden">
                                                <button
                                                    onClick={() => setSelectedDiamond(null)}
                                                    className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-[#D6B25E] font-bold border border-[#D6B25E]/20 hover:border-[#D6B25E] rounded-md px-2.5 py-1.5 transition-colors"
                                                >
                                                    â† Back to List
                                                </button>

                                                <span className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-bold mb-3">Diamond media Override</span>
                                                
                                                <div className="flex flex-col sm:flex-row gap-5 items-stretch">
                                                    <div className="relative w-full sm:w-44 aspect-square rounded-xl bg-black border border-white/6 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {selectedDiamond.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={selectedDiamond.imageUrl}
                                                                alt={selectedDiamond.shape}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="text-center text-white/30 p-4">
                                                                <span className="text-[32px] block mb-1">ðŸ’Ž</span>
                                                                <span className="text-[9px] uppercase tracking-wider">No Image Configured</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col justify-between py-1">
                                                        <div>
                                                            <h3 className="text-[17px] font-medium text-white">{selectedDiamond.caratWeight} Carat {selectedDiamond.shape} Diamond</h3>
                                                            <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">
                                                                Color: {selectedDiamond.color} | Clarity: {selectedDiamond.clarity} | Cut: {selectedDiamond.cut}
                                                            </p>
                                                            <p className="text-[12px] text-white/80 font-mono mt-3">
                                                                Price: Rs {Number(selectedDiamond.price).toLocaleString("en-IN")}
                                                            </p>
                                                        </div>

                                                        <div className="mt-6 flex flex-wrap gap-2.5">
                                                            <button
                                                                onClick={handleUploadClick}
                                                                disabled={isUploading}
                                                                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C] transition-all font-semibold uppercase tracking-wider text-[10px]"
                                                            >
                                                                {isUploading ? (
                                                                    <>
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                        <span>Uploading...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UploadCloud size={13} />
                                                                        <span>Upload Photo</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isUploading && (
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                                                        <motion.div 
                                                            className="h-full bg-[#D6B25E]" 
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* â”€â”€ Settings Inventory Media Editor Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                                {activeTab === "settings" && (
                                    <div className="space-y-6">
                                        {/* Search Filter */}
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={15} />
                                            <input
                                                type="text"
                                                placeholder="Search Setting by name or category..."
                                                value={settingSearch}
                                                onChange={(e) => setSettingSearch(e.target.value)}
                                                className="w-full bg-white/4 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#D6B25E]/60 focus:bg-white/6 transition-all"
                                            />
                                        </div>

                                        {/* Search list display */}
                                        {!selectedSetting ? (
                                            <div>
                                                <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Ring Settings Directory ({filteredSettings.length} items)</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto custom-scrollbar border border-white/6 rounded-xl bg-white/2 p-2">
                                                    {filteredSettings.map((setting) => (
                                                        <button
                                                            key={setting.id}
                                                            onClick={() => setSelectedSetting(setting)}
                                                            className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-white/8 hover:bg-white/4 text-left transition-all"
                                                        >
                                                            <div className="w-12 h-12 bg-black border border-white/10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                                                {setting.imageUrl ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={setting.imageUrl} alt={setting.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[14px]">ðŸ’</span>
                                                                )}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h4 className="text-[12px] font-medium text-white truncate">{setting.name}</h4>
                                                                <p className="text-[10px] text-white/40 mt-0.5 truncate">{setting.category}</p>
                                                            </div>
                                                            <ChevronRight size={13} className="ml-auto text-white/20" />
                                                        </button>
                                                    ))}
                                                    {filteredSettings.length === 0 && (
                                                        <div className="col-span-2 py-8 text-center text-white/40 text-[12px]">
                                                            No matching settings found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Setting Selected - Show Upload & Edit controls
                                            <div className="border border-white/10 rounded-2xl bg-[#09090A]/80 p-5 relative overflow-hidden">
                                                <button
                                                    onClick={() => setSelectedSetting(null)}
                                                    className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-[#D6B25E] font-bold border border-[#D6B25E]/20 hover:border-[#D6B25E] rounded-md px-2.5 py-1.5 transition-colors"
                                                >
                                                    â† Back to List
                                                </button>

                                                <span className="block text-[10px] uppercase tracking-widest text-[#D6B25E] font-bold mb-3">Ring Setting media Override</span>
                                                
                                                <div className="flex flex-col sm:flex-row gap-5 items-stretch">
                                                    <div className="relative w-full sm:w-44 aspect-square rounded-xl bg-black border border-white/6 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {selectedSetting.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={selectedSetting.imageUrl}
                                                                alt={selectedSetting.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="text-center text-white/30 p-4">
                                                                <span className="text-[32px] block mb-1">ðŸ’</span>
                                                                <span className="text-[9px] uppercase tracking-wider">No Image Configured</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col justify-between py-1">
                                                        <div>
                                                            <h3 className="text-[17px] font-medium text-white">{selectedSetting.name}</h3>
                                                            <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">
                                                                Style Category: {selectedSetting.category}
                                                            </p>
                                                            <p className="text-[12px] text-white/80 font-mono mt-3">
                                                                Price: Rs {Number(selectedSetting.price).toLocaleString("en-IN")}
                                                            </p>
                                                        </div>

                                                        <div className="mt-6 flex flex-wrap gap-2.5">
                                                            <button
                                                                onClick={handleUploadClick}
                                                                disabled={isUploading}
                                                                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C] transition-all font-semibold uppercase tracking-wider text-[10px]"
                                                            >
                                                                {isUploading ? (
                                                                    <>
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                        <span>Uploading...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UploadCloud size={13} />
                                                                        <span>Upload Photo</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isUploading && (
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                                                        <motion.div 
                                                            className="h-full bg-[#D6B25E]" 
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Text Content Editor Tab ────────────────────────────── */}
                                {activeTab === "text" && (
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#D6B25E]/5 border border-[#D6B25E]/20">
                                            <span className="text-[#D6B25E] mt-0.5"><Sparkles size={13} /></span>
                                            <p className="text-[11px] text-white/60 leading-relaxed">Edit any text below and click <strong className="text-white">Save</strong> to update it live. Changes take effect on the next page load.</p>
                                        </div>
                                        {Array.from(new Set(TEXT_FIELDS.map(f => f.group))).map(group => (
                                            <div key={group}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[9px] uppercase tracking-[0.22em] text-[#D6B25E]/80 font-bold">{group}</span>
                                                    <div className="flex-1 h-px bg-[#D6B25E]/15" />
                                                </div>
                                                <div className="space-y-2.5">
                                                    {TEXT_FIELDS.filter(f => f.group === group).map(field => {
                                                        const displayValue = textDrafts[field.key] !== undefined
                                                            ? textDrafts[field.key]
                                                            : (homepageAssets[field.key] || field.default);
                                                        const hasOverride = !!homepageAssets[field.key];
                                                        const isSaving = savingKeys.has(field.key);
                                                        return (
                                                             <TextFieldRow
                                                                 key={field.key}
                                                                 field={field}
                                                                 initialValue={displayValue}
                                                                 hasOverride={hasOverride}
                                                                 isSaving={isSaving}
                                                                 onSave={(val) => handleSaveText(field.key, val)}
                                                             />
                                                         );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>{/* end: flex-1 overflow-y-auto scrollable content area */}

                            {/* Footer info */}
                            <div className="relative z-10 p-5 bg-[#080809] border-t border-white/6 flex items-center justify-between text-[11px] text-white/40">
                                <span>Double-check files before hitting save.</span>
                                <span className="text-[#D6B25E]/60 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6B25E] animate-pulse" />
                                    Authorized Portal
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
