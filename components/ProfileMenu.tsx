"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { User } from "lucide-react";

export function ProfileMenu() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#EAEAEA] flex items-center justify-center animate-pulse"></div>
        );
    }

    if (user) {
        return (
            <Link
                href="/account"
                aria-label="Account Settings"
                className="w-8 h-8 rounded-full border border-[#EAEAEA] text-[#1A1A1A] bg-[#FAF8F4] hover:border-[#C9A14A] hover:text-[#C9A14A] flex items-center justify-center text-sm font-medium transition-colors"
            >
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </Link>
        );
    }

    return (
        <Link href="/login" aria-label="Account" className="text-[#1A1A1A] hover:text-[#C9A14A] transition-colors p-1 flex items-center justify-center">
            <User size={18} strokeWidth={1.5} />
        </Link>
    );
}

export default ProfileMenu;
