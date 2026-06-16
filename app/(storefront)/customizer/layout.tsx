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
        <main className="min-h-screen pb-16 md:pb-24 pt-8 md:pt-12 text-white font-body transition-colors duration-1000">
            <Toaster position="top-center" richColors theme="dark" />

            {/* Header & Progress Bar — hidden on setting detail pages */}
            {!isDetailPage && (
                <div className="max-w-5xl mx-auto px-4 md:px-5 mb-8 md:mb-14">
                    <div className="text-center mb-6 md:mb-10">
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#D6B25E] mb-3">
                            Custom Ring Builder
                        </p>
                        <h1 className="text-2xl md:text-[32px] font-medium text-white mb-3 tracking-wide">
                            Design your perfect ring
                        </h1>
                        <p className="text-white/40 uppercase tracking-[0.2em] text-[9px] md:text-[10px]">
                            Follow the 3 steps to create your masterpiece
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                        {/* Background line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 -z-10" />
                        {/* Active line */}
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#D6B25E] -z-10 transition-all duration-700"
                            style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, index) => {
                            const isActive = currentStepIndex === index;
                            const isCompleted = currentStepIndex > index;
                            const canAccess = checkCanAccess(step.id);
                            return (
                                <Link
                                    href={step.path}
                                    key={step.id}
                                    onClick={(e) => handleStepClick(e, step.id)}
                                    className={`flex flex-col items-center group relative px-2 transition-opacity ${!canAccess ? "opacity-30" : "hover:opacity-100"}`}
                                    aria-disabled={!canAccess}
                                    tabIndex={!canAccess ? -1 : 0}
                                >
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 transition-all duration-500 z-10 ${
                                        isActive
                                            ? "border-[#D6B25E] bg-[#D6B25E] text-[#0B0B0C] shadow-[0_0_20px_rgba(214,178,94,0.35)] scale-110"
                                            : isCompleted
                                                ? "border-[#D6B25E] bg-[#D6B25E] text-[#0B0B0C]"
                                                : "border-white/20 bg-[#0B0B0C] text-white/40"
                                    }`}>
                                        {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : step.id}
                                    </div>
                                    <span className={`absolute -bottom-6 md:-bottom-8 whitespace-nowrap text-[8px] md:text-[9px] font-bold tracking-[0.15em] uppercase transition-colors duration-500 hidden sm:block ${
                                        isActive
                                            ? "text-[#D6B25E]"
                                            : isCompleted
                                                ? "text-white/70"
                                                : "text-white/25"
                                    }`}>
                                        {step.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-4 md:px-5 mt-6 md:mt-16 flex flex-col gap-6 md:gap-10 lg:gap-14">

                {/* Full-Width 3D Viewer — hidden on setting detail pages and step 2 */}
                {!hideViewer && (
                    <div className="w-full h-[260px] sm:h-[320px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden flex-shrink-0 z-10 transition-all duration-500 relative border border-white/6 bg-[#0B1715]">
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
