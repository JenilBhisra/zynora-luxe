"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useCustomizerStore } from "@/lib/customizer-store";

interface CustomizerProgressBarProps {
    currentStep: 1 | 2 | 3;
}

export function CustomizerProgressBar({ currentStep }: CustomizerProgressBarProps) {
    const { config } = useCustomizerStore();
    const hasDiamond = !!config.diamond;
    const hasSetting = !!config.setting;

    const steps = [
        {
            id: 1,
            name: "Diamond",
            label: "Choose Diamond",
            path: "/customizer/step-1-diamond",
            isCompleted: hasDiamond || currentStep > 1,
            isActive: currentStep === 1,
        },
        {
            id: 2,
            name: "Setting",
            label: "Choose Setting",
            path: "/customizer/step-2-setting",
            isCompleted: hasSetting || currentStep > 2,
            isActive: currentStep === 2,
            canAccess: hasDiamond,
        },
        {
            id: 3,
            name: "Complete",
            label: "Review Ring",
            path: "/customizer/step-3-review",
            isCompleted: currentStep > 3,
            isActive: currentStep === 3,
            canAccess: hasDiamond && hasSetting,
        },
    ];

    return (
        <div className="w-full bg-[#FAF8F4] border-b border-zinc-100 py-3 px-4 sticky top-14 z-40 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Active Selection Summary */}
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-medium tracking-wide">
                    {config.diamond && (
                        <div className="flex items-center gap-1">
                            <span className="text-[#C9A14A] font-bold">✓</span>
                            <span>{config.diamond.caratWeight.toFixed(2)}ct {config.diamond.shape} Diamond</span>
                        </div>
                    )}
                    {config.diamond && config.setting && (
                        <ChevronRight size={10} className="text-zinc-300 hidden sm:block" />
                    )}
                    {config.setting && (
                        <div className="flex items-center gap-1">
                            <span className="text-[#C9A14A] font-bold">✓</span>
                            <span>{config.setting.name} Setting</span>
                        </div>
                    )}
                    {!config.diamond && !config.setting && (
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A14A] font-semibold">Custom Ring Builder</span>
                    )}
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 md:gap-4 select-none">
                    {steps.map((step, index) => {
                        const canLink = step.id === 1 || (step.id === 2 && hasDiamond) || (step.id === 3 && hasDiamond && hasSetting);
                        
                        const element = (
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                                        step.isActive
                                            ? "bg-[#C9A14A] text-[#0B0B0C] shadow-sm"
                                            : step.isCompleted
                                            ? "bg-zinc-900 text-white"
                                            : "border border-zinc-200 text-zinc-400 bg-white"
                                    }`}
                                    style={{ width: "22px", height: "22px" }}
                                >
                                    {step.isCompleted ? <Check size={10} strokeWidth={3} /> : step.id}
                                </div>
                                <span
                                    className={`text-[9px] font-bold tracking-widest uppercase ${
                                        step.isActive
                                            ? "text-[#C9A14A]"
                                            : step.isCompleted
                                            ? "text-zinc-800"
                                            : "text-zinc-400"
                                    }`}
                                >
                                    {step.name}
                                </span>
                            </div>
                        );

                        return (
                            <div key={step.id} className="flex items-center">
                                {canLink ? (
                                    <Link href={step.path} className="hover:opacity-85 transition-opacity">
                                        {element}
                                    </Link>
                                ) : (
                                    <div className="opacity-50 cursor-not-allowed">
                                        {element}
                                    </div>
                                )}
                                {index < steps.length - 1 && (
                                    <ChevronRight size={11} className="mx-1 text-zinc-300" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
