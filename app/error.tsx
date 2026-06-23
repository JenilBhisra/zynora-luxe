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
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-md w-full bg-white p-10 rounded-[24px] border border-zinc-200/60 shadow-xl relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#C9A14A]/10 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-[10px] tracking-[0.34em] font-bold text-[#C9A14A] uppercase mb-4 block">
                    Zynora Luxe
                </span>
                
                <h1 className="text-3xl font-serif uppercase text-zinc-900 mb-4">
                    An Error Occurred
                </h1>
                
                <p className="text-zinc-600 text-[14px] leading-relaxed mb-8">
                    We encountered an unexpected issue while loading this page. Our team has been notified.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => reset()}
                        className="w-full sm:w-auto px-6 py-3 bg-[#C9A14A] text-[#0B0B0C] hover:bg-[#B58F3B] hover:border-[#B58F3B] border border-[#C9A14A] font-semibold text-[12px] uppercase tracking-[0.15em] rounded-[10px]"
                    >
                        Try Again
                    </Button>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="w-full px-6 py-3 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-semibold text-[12px] uppercase tracking-[0.15em] rounded-[10px]"
                        >
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
