"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export function FadeIn({ children, delay = 0, className = "", shimmer = false }: { children: ReactNode, delay?: number, className?: string, shimmer?: boolean }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{
                duration: prefersReducedMotion ? 0.2 : 0.55,
                delay: delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={`${className} ${shimmer ? "shimmer-container" : ""}`}
        >
            {children}
            {shimmer && (
                <motion.div
                    className="shimmer-sweep pointer-events-none"
                    initial={{ left: "-100%" }}
                    whileInView={{ left: "200%" }}
                    viewport={{ once: true }}
                    transition={{ duration: prefersReducedMotion ? 0.4 : 1.2, delay: delay + 0.4, ease: "easeInOut" }}
                />
            )}
        </motion.div>
    );
}
