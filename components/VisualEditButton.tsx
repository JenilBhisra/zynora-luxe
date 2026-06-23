"use client";

import { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface VisualEditButtonProps {
    type: "homepage" | "diamond" | "setting";
    assetKey?: string;
    item?: any;
    className?: string;
}

export function VisualEditButton({ type, assetKey, item, className = "" }: VisualEditButtonProps) {
    const { user, loading } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Initialize state from window flag
        setIsVisible(!!(window as any).__zynora_edit_mode);

        const handleEditModeChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            setIsVisible(!!customEvent.detail.active);
        };

        window.addEventListener("zynora-edit-mode-changed", handleEditModeChange);
        return () => {
            window.removeEventListener("zynora-edit-mode-changed", handleEditModeChange);
        };
    }, []);

    const isAdmin = user?.email?.toLowerCase() === "krishnadiamond404@gmail.com";
    if (loading || !isAdmin || !isVisible) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        window.dispatchEvent(new CustomEvent("zynora-edit-asset", {
            detail: { type, key: assetKey, item }
        }));
    };

    return (
        <button
            onClick={handleClick}
            className={`absolute top-4 left-4 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-[#0B0B0C]/80 hover:bg-[#D6B25E] text-[#D6B25E] hover:text-[#0B0B0C] border border-[#D6B25E]/40 hover:border-[#D6B25E] shadow-lg backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 ${className}`}
            title={`Customize ${type === "homepage" ? "this banner image" : "this item photo"}`}
        >
            <Edit3 size={13} />
        </button>
    );
}
