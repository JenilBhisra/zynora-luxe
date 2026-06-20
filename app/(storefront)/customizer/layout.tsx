"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Toaster, toast } from 'sonner';
import { useCustomizerStore } from "@/lib/customizer-store";
import dynamic from "next/dynamic";

const RingViewer = dynamic(() => import('@/components/3d/RingViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B1715] animate-pulse text-white/30">
            <div className="w-16 h-16 mb-4 rounded-full border-2 border-[#D6B25E]/20 border-t-[#D6B25E] animate-spin" />
            <p className="text-[10px] uppercase tracking-widest font-semibold">Loading Customizer...</p>
        </div>
    )
});

const steps = [
    { id: 1, name: "Choose Diamond", path: "/customizer/step-1-diamond" },
    { id: 2, name: "Choose Setting", path: "/customizer/step-2-setting" },
    { id: 3, name: "Review", path: "/customizer/step-3-review" },
];

export default function CustomizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const currentStepIndex = steps.findIndex((s) => s.path === pathname);
    const { config } = useCustomizerStore();
    const isDetailPage = pathname.startsWith("/customizer/setting/");
    const hideViewer = isDetailPage || pathname === "/customizer/step-1-diamond" || pathname === "/customizer/step-2-setting";

    const checkCanAccess = (stepId: number) => {
        if (stepId === 1) return true;                                          // Diamond: always
        if (stepId === 2) return !!config.diamond;                              // Setting: needs diamond
        if (stepId === 3) return !!config.diamond && !!config.setting;          // Review: needs diamond + setting
        return false;
    };

    const handleStepClick = (e: React.MouseEvent, stepId: number) => {
        if (!checkCanAccess(stepId)) {
            e.preventDefault();
            toast.error("Please complete the previous steps first.");
        }
    };

    return (
        <main className="min-h-screen pb-16 md:pb-24 text-zinc-900 bg-white font-body">
            <Toaster position="top-center" richColors theme="light" />

            {/* Header & Progress Bar — hidden on setting detail pages */}
            {!isDetailPage && (
                <div className="w-full max-w-none px-4 md:px-[40px] lg:px-[70px] mt-6 md:mt-8">
                    <div className="text-center mb-6 md:mb-10 max-w-4xl mx-auto px-4 mt-6">
                        <h1 className="text-2xl md:text-[36px] font-medium text-zinc-900 mb-4 tracking-wide font-serif leading-tight">
                            Design Your Own Engagement Ring
                        </h1>
                        <p className="text-zinc-500 text-sm md:text-[15px] font-light max-w-3xl mx-auto leading-relaxed">
                            Forever has a nice ring to it. It all starts by selecting a setting and your dream diamond to create your made-to-order design engagement ring.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full border border-zinc-200 bg-white grid grid-cols-4 select-none rounded-none overflow-hidden h-[60px] md:h-[72px] mb-8 md:mb-12">
                        {/* Box 0: Design Your Ring */}
                        <div className="flex items-center justify-center bg-zinc-50 border-r border-zinc-200 px-2 text-center">
                            <span className="font-serif font-semibold text-zinc-800 text-[10px] md:text-sm uppercase tracking-wider leading-tight">
                                <span className="hidden sm:inline">Design Your Ring</span>
                                <span className="inline sm:hidden">Design</span>
                            </span>
                        </div>

                        {/* Box 1, 2, 3: Steps */}
                        {[
                            { id: 1, name: "Choose Diamond", mobileName: "1. Diamond", path: "/customizer/step-1-diamond" },
                            { id: 2, name: "Choose Setting", mobileName: "2. Setting", path: "/customizer/step-2-setting" },
                            { id: 3, name: "Complete Ring", mobileName: "3. Complete", path: "/customizer/step-3-review" },
                        ].map((step, index) => {
                            const isActive = currentStepIndex === index;
                            const isCompleted = currentStepIndex > index;
                            const canAccess = checkCanAccess(step.id);
                            return (
                                <Link
                                    href={step.path}
                                    key={step.id}
                                    onClick={(e) => handleStepClick(e, step.id)}
                                    className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 px-2 border-r border-zinc-200 last:border-r-0 transition-colors ${
                                        isActive 
                                            ? "bg-white border-b-[3px] border-[#C9A14A] text-zinc-900" 
                                            : isCompleted 
                                                ? "bg-white text-zinc-800 hover:bg-zinc-50" 
                                                : "bg-white text-zinc-400 opacity-50 cursor-not-allowed"
                                    }`}
                                    aria-disabled={!canAccess}
                                    tabIndex={!canAccess ? -1 : 0}
                                >
                                    <div className="text-center md:text-left">
                                        <span className="font-medium text-[10px] md:text-[13px] block md:inline uppercase tracking-wide">
                                            {step.mobileName}
                                        </span>
                                        {step.id === 2 && (
                                            <span className="block text-[9px] text-[#C9A14A] underline font-semibold mt-0.5 tracking-wider hidden md:block">
                                                {config.setting ? "Change Setting" : "Browse Settings"}
                                            </span>
                                        )}
                                        {step.id === 3 && (
                                            <span className="block text-[9px] text-zinc-400 font-medium mt-0.5 tracking-wider hidden md:block">
                                                Select Ring Size
                                            </span>
                                        )}
                                    </div>
                                    <div className="hidden sm:block">
                                        {step.id === 1 && (
                                            <svg className={`w-5 h-5 ${isActive ? 'text-[#C9A14A]' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M6 3h12l4 6-10 12L2 9z" />
                                                <path d="M11 3l-3 6 4 12" />
                                                <path d="M13 3l3 6-4 12" />
                                                <path d="M2 9h20" />
                                            </svg>
                                        )}
                                        {step.id === 2 && (
                                            <svg className={`w-5 h-5 ${isActive ? 'text-[#C9A14A]' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="14" r="6" />
                                                <path d="M12 8l-2-2h4z" />
                                                <circle cx="12" cy="8" r="1" fill="currentColor" />
                                            </svg>
                                        )}
                                        {step.id === 3 && (
                                            <svg className={`w-5 h-5 ${isActive ? 'text-[#C9A14A]' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="15" r="5" />
                                                <path d="M12 10l-2-2h4z" />
                                                <path d="M10 8h4L12 4z" />
                                            </svg>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="w-full max-w-none px-4 md:px-[40px] lg:px-[70px] mt-6 flex flex-col gap-6">

                {/* Full-Width 3D Viewer — hidden on setting detail pages and step 2 */}
                {!hideViewer && (
                    <div className="w-full h-[260px] sm:h-[320px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden flex-shrink-0 z-10 transition-all duration-500 relative border border-zinc-150 bg-[#FAF8F4]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,143,131,0.04)_0%,transparent_70%)] pointer-events-none" />
                        <RingViewer />
                    </div>
                )}

                {/* Steps Content Panel */}
                <div className="w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </main>
    );
}
