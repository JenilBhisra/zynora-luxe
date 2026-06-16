"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Setting } from "@prisma/client";
import { useCustomizerStore } from "@/lib/customizer-store";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";

// currency formatter
const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function Step2SettingPage() {
    const router = useRouter();
    const setSetting = useCustomizerStore((state) => state.setSetting);
    const selectedSetting = useCustomizerStore((state) => state.config.setting);
    const selectedDiamond = useCustomizerStore((state) => state.config.diamond);

    const [settings, setSettings] = useState<Setting[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Step 2 requires diamond to be selected first
    useEffect(() => {
        if (!selectedDiamond) {
            router.push("/customizer/step-1-diamond");
        }
    }, [selectedDiamond, router]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                
                // Filter settings based on selected diamond shape
                if (selectedDiamond?.shape) {
                    const filtered = data.filter((setting: any) => {
                        try {
                            const shapes = JSON.parse(setting.supportedShapes || "[]");
                            if (!Array.isArray(shapes) || shapes.length === 0) return true; // If no shapes defined, assume it supports all (or change to false if you want strict)
                            return shapes.includes(selectedDiamond.shape);
                        } catch {
                            return true; // fallback
                        }
                    });
                    setSettings(filtered);
                } else {
                    setSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSelectSetting = (setting: Setting) => {
        setSetting(setting);
        router.push("/customizer/step-3-review");
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse flex flex-col overflow-hidden luxury-shell rounded-[22px] p-4">
                        <div className="aspect-[4/5] bg-white/6 mb-5 relative overflow-hidden rounded-[16px]" />
                        <div className="h-4 bg-white/8 w-2/3 mb-2 mx-auto" />
                        <div className="h-4 bg-white/6 w-1/3 mb-5 mx-auto" />
                        <div className="h-10 bg-white/6 w-full mt-auto rounded-[12px]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700 text-white">
            <AnimatedSection className="mb-8 text-center block md:hidden">
                <h2 className="text-[28px] font-medium text-white">Choose Your Setting</h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {settings.map((setting, index) => {
                    const imgSrc = setting.imageUrl || "";

                    return (
                        <AnimatedSection
                            key={setting.id}
                            as="div"
                            className={`group flex flex-col h-full luxury-shell p-4 transition-all duration-[1.5s] ease-out relative rounded-[22px] ${selectedSetting?.id === setting.id ? "ring-1 ring-[#D6B25E]/50" : "hover:shadow-lg"}`}
                            delay={index * 0.06}
                        >
                            {/* Image Container — click navigates to detail page */}
                            <div
                                className="relative aspect-[4/5] w-full bg-black/20 mb-5 overflow-hidden flex items-center justify-center p-6 rounded-[16px] cursor-pointer"
                                onClick={() => router.push(`/setting/${setting.id}`)}
                                title="Click to view details"
                            >
                                {imgSrc ? (
                                    <SmartImage
                                        src={imgSrc}
                                        alt={setting.name}
                                        fill
                                        fallbackType="setting"
                                        imageKey={setting.id}
                                        className="object-contain opacity-90 transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-white/20 text-xs uppercase tracking-widest font-bold">
                                        No Image
                                    </div>
                                )}
                                {/* View detail hint overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center rounded-[16px]">
                                    <span className="text-white text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 px-3 py-1.5 rounded-full">
                                        View Details
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-grow text-center px-2">
                                <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-white/50 mb-2 block">
                                    {setting.category}
                                </span>
                                <h3 className="text-[18px] font-medium text-white mb-1 line-clamp-1">
                                    {setting.name}
                                </h3>
                                <p className="text-[14px] text-white/65 mb-5 font-normal line-clamp-2">
                                    {setting.description}
                                </p>

                                <div className="mt-auto pt-4 flex flex-col w-full relative z-10">
                                    <span className="text-[15px] font-medium text-white mb-4 block">
                                        {formatPrice(setting.price)}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectSetting(setting);
                                        }}
                                        className={`w-full py-3 text-[14px] uppercase tracking-[0.1em] font-medium transition-all duration-300 ${
                                            selectedSetting?.id === setting.id
                                                ? "bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C]"
                                                : "bg-transparent text-white border border-white/15 hover:border-[#D6B25E] hover:text-white hover:bg-white/6"
                                        }`}
                                    >
                                        {selectedSetting?.id === setting.id ? "Selected" : "Select"}
                                    </button>
                                </div>
                            </div>
                        </AnimatedSection>
                    );
                })}
            </div>
        </div>
    );
}
