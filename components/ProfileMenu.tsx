"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { User } from "lucide-react";

export function ProfileMenu() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-[#D6B25E]/30 flex items-center justify-center animate-pulse"></div>
        );
    }

    if (user) {
        return (
            <Link
                href="/account"
                aria-label="Account Settings"
                className="w-8 h-8 rounded-full border border-[#D6B25E]/40 text-[#E4E4E7] bg-[#0B0B0C] hover:border-[#D6B25E] hover:text-[#D6B25E] flex items-center justify-center text-sm font-semibold transition-colors"
            >
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </Link>
        );
    }

    return (
        <Link href="/login" aria-label="Account" className="text-[#E4E4E7] hover:text-[#D6B25E] transition-colors">
            <User size={18} />
        </Link>
    );
}

export default ProfileMenu;
