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
                            if (!Array.isArray(shapes) || shapes.length === 0) return true;
                            return shapes.includes(selectedDiamond.shape);
                        } catch {
                            return true;
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
    }, [selectedDiamond]);

    const handleSelectSetting = (setting: Setting) => {
        setSetting(setting);
        router.push("/customizer/step-3-review");
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse flex flex-col overflow-hidden luxury-shell rounded-xl border border-zinc-150 p-4 bg-white">
                        <div className="aspect-[4/5] bg-zinc-100 mb-5 relative overflow-hidden rounded-lg" />
                        <div className="h-4 bg-zinc-200 w-2/3 mb-2 mx-auto" />
                        <div className="h-4 bg-zinc-100 w-1/3 mb-5 mx-auto" />
                        <div className="h-10 bg-zinc-100 w-full mt-auto rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700 text-zinc-950 bg-white">
            <AnimatedSection className="mb-6 text-center block md:hidden">
                <h2 className="text-xl font-serif text-zinc-900 font-medium tracking-wide">Choose Your Setting</h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {settings.map((setting, index) => {
                    const imgSrc = setting.imageUrl || "";

                    return (
                        <AnimatedSection
                            key={setting.id}
                            as="div"
                            className={`group flex flex-col h-full luxury-shell p-4 transition-all duration-300 relative rounded-xl bg-white border border-zinc-100 ${
                                selectedSetting?.id === setting.id ? "ring-1 ring-[#C9A14A]/40 border-zinc-250 shadow-sm" : "hover:shadow-md hover:border-zinc-250"
                            }`}
                            delay={index * 0.04}
                        >
                            {/* Image Container — click navigates to detail page */}
                            <div
                                className="relative aspect-[4/5] w-full bg-zinc-50 mb-4 overflow-hidden flex items-center justify-center p-6 rounded-lg cursor-pointer border border-zinc-100"
                                onClick={() => router.push(`/setting/${setting.id}?mode=customizer`)}
                                title="Click to view details"
                            >
                                {imgSrc ? (
                                    <SmartImage
                                        src={imgSrc}
                                        alt={setting.name}
                                        fill
                                        fallbackType="setting"
                                        imageKey={setting.id}
                                        className="object-contain opacity-95 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-zinc-300 text-xs uppercase tracking-widest font-bold">
                                        No Image
                                    </div>
                                )}
                                {/* View detail hint overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-zinc-900/10 transition-all duration-300 flex items-center justify-center rounded-lg">
                                    <span className="text-white text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-900/90 px-3 py-1.5 rounded-full">
                                        View Details
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-grow text-center px-1">
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-1.5 block">
                                    {setting.category}
                                </span>
                                <h3 className="text-base font-serif font-medium text-zinc-900 mb-1 line-clamp-1 group-hover:text-[#C9A14A] transition-colors">
                                    {setting.name}
                                </h3>
                                <p className="text-xs text-zinc-500 mb-4 font-normal line-clamp-2 leading-relaxed">
                                    {setting.description}
                                </p>

                                <div className="mt-auto pt-2 flex flex-col w-full relative z-10">
                                    <span className="text-sm font-bold text-zinc-900 mb-3 block">
                                        {formatPrice(setting.price)}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectSetting(setting);
                                        }}
                                        className={`w-full py-2.5 rounded-md text-[10px] uppercase tracking-widest font-bold transition-all duration-300 ${
                                            selectedSetting?.id === setting.id
                                                ? "bg-zinc-900 text-white border border-zinc-900"
                                                : "bg-white text-zinc-800 border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50"
                                        }`}
                                    >
                                        {selectedSetting?.id === setting.id ? "Selected" : "Select Setting"}
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
