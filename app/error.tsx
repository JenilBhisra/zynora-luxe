"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global application error boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-md w-full luxury-panel p-10 rounded-[24px] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#D6B25E]/10 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-[10px] tracking-[0.34em] font-medium text-[#D6B25E] uppercase mb-4 block">
                    Understated Luxury
                </span>
                
                <h1 className="text-3xl font-serif uppercase text-white mb-4">
                    An Error Occurred
                </h1>
                
                <p className="text-white/60 text-[14px] leading-relaxed mb-8">
                    We encountered an unexpected issue while loading this page. Our team has been notified.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => reset()}
                        className="w-full sm:w-auto px-6 py-3 bg-[#D6B25E] text-[#0B0B0C] hover:bg-[#E3C67C] font-semibold text-[12px] uppercase tracking-[0.15em]"
                    >
                        Try Again
                    </Button>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="w-full px-6 py-3 border-white/20 text-white hover:bg-white/5 font-semibold text-[12px] uppercase tracking-[0.15em]"
                        >
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
