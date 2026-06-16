"use client";

import { ForwardedRef, forwardRef, ReactNode } from "react";

type AnimationWrapperProps = {
    children: ReactNode;
    className?: string;
    heightClassName?: string;
};

export const AnimationWrapper = forwardRef(function AnimationWrapper(
    { children, className = "", heightClassName = "h-[260vh]" }: AnimationWrapperProps,
    ref: ForwardedRef<HTMLElement>,
) {
    return (
        <section ref={ref} className={`relative ${heightClassName} bg-[#09090A] ${className}`}>
            <div className="scroll-section-sticky overflow-hidden">{children}</div>
        </section>
    );
});
