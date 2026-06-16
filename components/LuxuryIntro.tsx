"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function LuxuryIntro() {
    const [showIntro, setShowIntro] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname !== "/") return;

        const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
        const saveData = Boolean(connection?.saveData);
        const slowNetwork = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";

        const hasSeenIntro = sessionStorage.getItem("hasSeenLuxuryIntro");
        if (!hasSeenIntro && !saveData && !slowNetwork) {
            setTimeout(() => setShowIntro(true), 0);
            sessionStorage.setItem("hasSeenLuxuryIntro", "true");
        }
    }, [pathname]);

    if (!showIntro) return null;

    return (
        <AnimatePresence>
            {showIntro && (
                <motion.div
                    key="luxury-intro"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#faf9f6] overflow-hidden"
                >
                    {/* Deep radial background */}
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1.1 }}
                        transition={{ duration: prefersReducedMotion ? 0.2 : 1.6, ease: "easeOut" }}
                        className="absolute inset-0 bg-[#faf9f6] pointer-events-none"
                    />

                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                        transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="relative z-10 text-center flex flex-col items-center"
                        onAnimationComplete={() => {
                            setTimeout(() => setShowIntro(false), prefersReducedMotion ? 80 : 350);
                        }}
                    >
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: prefersReducedMotion ? 0.2 : 0.9, ease: "easeOut", delay: 0.15 }}
                            className="relative"
                        >
                            <Image src="/assets/logo.png" alt="ZYNORA LUXE" width={320} height={110} priority className="w-64 md:w-80 h-auto object-contain animate-pulse" />
                        </motion.div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: prefersReducedMotion ? 0.2 : 1, ease: "easeInOut", delay: prefersReducedMotion ? 0 : 0.5 }}
                            className="h-[1px] bg-black/20 mt-8 mx-auto w-32"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
