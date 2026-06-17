"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { User } from "lucide-react";

export function ProfileMenu() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div 
                style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
                className="bg-[#FAF8F4] border border-[#EAEAEA] animate-pulse"
            ></div>
        );
    }

    if (user) {
        return (
            <Link
                href="/account"
                aria-label="Account Settings"
                style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
                className="border border-[#EAEAEA] text-[#1A1A1A] bg-[#FAF8F4] hover:border-[#C9A14A] hover:text-[#C9A14A] transition-colors"
            >
                <User size={18} strokeWidth={1.5} />
            </Link>
        );
    }

    return (
        <Link 
            href="/login" 
            aria-label="Account" 
            style={{
                width: "38px",
                height: "38px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
            className="border border-[#EAEAEA] text-[#1A1A1A] bg-[#FAF8F4] hover:border-[#C9A14A] hover:text-[#C9A14A] transition-colors"
        >
            <User size={18} strokeWidth={1.5} />
        </Link>
    );
}

export default ProfileMenu;
