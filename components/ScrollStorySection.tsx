"use client";

import { ReactNode } from "react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

interface ScrollStorySectionProps {
    children: ReactNode;
    className?: string;
    bgColor?: string;
    isSticky?: boolean;
}

export function ScrollStorySection({
    children,
    className = "",
    bgColor = "bg-[#0B0B0C]",
    isSticky = false
}: ScrollStorySectionProps) {
    return (
        <AnimatedSection 
            className={`py-24 md:py-32 ${bgColor} ${isSticky ? 'story-section-frame' : ''} ${className}`}
        >
            {children}
        </AnimatedSection>
    );
}

export function StoryContent({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function RevealStep({ 
    children, 
    step = 1,
    className = "" 
}: { 
    children: ReactNode, 
    step?: number,
    className?: string 
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ 
                duration: 0.75, 
                delay: (step - 1) * 0.15,
                ease: [0.22, 1, 0.36, 1] 
            }}
            className={`reveal-step-${step} ${className}`}
        >
            {children}
        </motion.div>
    );
}
