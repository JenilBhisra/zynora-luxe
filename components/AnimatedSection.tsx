"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type AnimatedSectionProps<T extends ElementType = "section"> = {
    as?: T;
    children: ReactNode;
    className?: string;
    delay?: number;
    stagger?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
            when: "beforeChildren",
            staggerChildren: 0.08,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

export function AnimatedSection<T extends ElementType = "section">({
    as,
    children,
    className = "",
    delay = 0,
    stagger = false,
    ...props
}: AnimatedSectionProps<T>) {
    const prefersReducedMotion = useReducedMotion();
    const Component = (as || "section") as ElementType;

    const MotionComponent = motion.create(Component);

    return (
        <MotionComponent
            {...props}
            className={className}
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : "hidden"}
            whileInView={prefersReducedMotion ? { opacity: 1, y: 0 } : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay }}
        >
            {stagger ? <motion.div variants={itemVariants}>{children}</motion.div> : children}
        </MotionComponent>
    );
}