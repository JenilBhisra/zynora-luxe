"use client";

import { useAuth } from "@/components/AuthProvider";
import { logOut } from "@/lib/auth.client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Settings, User, Package, ChevronRight } from "lucide-react";

export default function AccountPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user && user.email?.toLowerCase() === "krishnadiamond404@gmail.com") {
            setIsAdmin(true);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 bg-[#0B0B0C] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-[#D6B25E] animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect or show not logged in
        router.push("/login");
        return null;
    }

    const handleLogout = async () => {
        try {
            await logOut();
        } finally {
            try { window.localStorage.removeItem("krishna_current_user"); } catch {}
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] pt-24 pb-12">
            <div className="container-custom max-w-4xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">My Account</h1>
                    <p className="text-white/50 text-sm">Manage your profile, orders, and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar / Profile Summary */}
                    <div className="md:col-span-1">
                        <div className="bg-[#121214] border border-[#D6B25E]/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <User size={100} />
                            </div>
                            
                            <div className="w-16 h-16 rounded-full bg-[#D6B25E]/10 border border-[#D6B25E]/30 flex items-center justify-center text-2xl font-bold text-[#D6B25E] mb-4">
                                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            
                            <h2 className="text-xl font-heading text-white mb-1">{user.displayName || "User"}</h2>
                            <p className="text-sm text-zinc-400 mb-4">{user.email}</p>
                            
                            {/* We don't expose role directly in Firebase user, but Admin Dashboard is protected server-side anyway */}
                            {false && (
                                <span className="inline-block text-[10px] font-bold text-[#0B0B0C] bg-[#D6B25E] px-2 py-0.5 rounded tracking-widest uppercase mb-6">
                                    Administrator
                                </span>
                            )}
                            
                            <div className="h-px bg-white/5 w-full my-6" />
                            
                            <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition-colors w-full group">
                                <div className="w-8 h-8 rounded-full bg-red-400/10 flex items-center justify-center group-hover:bg-red-400/20 transition-colors">
                                    <LogOut size={14} />
                                </div>
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="md:col-span-2 space-y-4">
                        
                        <Link href="/my-orders" className="block bg-[#121214] border border-white/10 hover:border-[#D6B25E]/40 rounded-2xl p-6 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#D6B25E]/10 flex items-center justify-center text-[#D6B25E]">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white group-hover:text-[#D6B25E] transition-colors">Order History</h3>
                                        <p className="text-sm text-white/40 mt-1">View your past orders and track their status.</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-white/20 group-hover:text-[#D6B25E] transition-colors" />
                            </div>
                        </Link>

                        <Link href="/account/settings" className="block bg-[#121214] border border-white/10 hover:border-[#D6B25E]/40 rounded-2xl p-6 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#D6B25E]/10 flex items-center justify-center text-[#D6B25E]">
                                        <Settings size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white group-hover:text-[#D6B25E] transition-colors">Account Settings</h3>
                                        <p className="text-sm text-white/40 mt-1">Update your password, name, and profile details.</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-white/20 group-hover:text-[#D6B25E] transition-colors" />
                            </div>
                        </Link>

                        {isAdmin && (
                            <Link href="/admin" className="block bg-gradient-to-r from-[#D6B25E]/10 to-transparent border border-[#D6B25E]/30 hover:border-[#D6B25E] rounded-2xl p-6 transition-all group mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#D6B25E] flex items-center justify-center text-[#0B0B0C]">
                                            <LayoutDashboard size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-[#D6B25E]">Admin Dashboard</h3>
                                            <p className="text-sm text-white/60 mt-1">Manage inventory, homepage assets, and store settings.</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-[#D6B25E]" />
                                </div>
                            </Link>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
