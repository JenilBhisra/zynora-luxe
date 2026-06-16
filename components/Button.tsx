import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "outline" | "filled" | "ghost";
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = "filled",
    fullWidth = false,
    className,
    ...props
}: ButtonProps) {

    const baseStyles = "inline-flex items-center justify-center px-6 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm uppercase tracking-[0.2em] cursor-pointer transition-all duration-600 ease-smooth relative overflow-hidden font-semibold rounded-[10px] min-h-[46px] active:scale-[0.985] before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-600 before:pointer-events-none group";

    const variants = {
        outline: "border border-[#D6B25E] text-[#D6B25E] bg-transparent hover:bg-[#C9A24A] hover:text-[#0B0B0C] hover:shadow-[0_14px_28px_rgba(201,162,74,0.28)] hover:scale-[1.03] before:bg-[linear-gradient(120deg,transparent_12%,rgba(255,255,255,0.35)_45%,transparent_78%)] hover:before:opacity-100 btn-gold-hover",
        filled: "bg-[#0B0B0C] text-white border border-[#D6B25E] hover:bg-[#C9A24A] hover:text-[#0B0B0C] hover:border-[#C9A24A] hover:shadow-[0_14px_30px_rgba(201,162,74,0.30)] hover:scale-[1.03] before:bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.34)_45%,transparent_78%)] hover:before:opacity-100 btn-gold-hover",
        ghost: "text-[#A1A1AA] border border-transparent hover:border-[#D6B25E]/50 hover:bg-[#D6B25E]/10 hover:text-[#D6B25E] hover:scale-[1.02] before:bg-[linear-gradient(120deg,transparent_15%,rgba(214,178,94,0.24)_45%,transparent_75%)] hover:before:opacity-100 premium-hover-lift",
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                fullWidth ? "w-full" : "",
                className
            )}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600 pointer-events-none" />
        </button>
    );
}
