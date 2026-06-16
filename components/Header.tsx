"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X as XIcon, ChevronRight, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useCart } from "./CartProvider";
import ProfileMenu from "./ProfileMenu";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { logOut } from "@/lib/auth.client";

const NAV_ITEMS = [
    { label: "Home", href: "/" },
    { label: "Customize Ring", href: "/customizer/step-1-diamond" },
    { label: "Diamonds", href: "/diamonds" },
    { label: "Shop", href: "/shop" },
    { label: "Customer Care", href: "/customer-care" },
    { label: "B2B Wholesale", href: "/b2b" },
];

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { cartCount } = useCart();
    const pathname = usePathname();
    const { user } = useAuth();

    const isAdmin = user && user.email?.toLowerCase() === "krishnadiamond404@gmail.com";

    const handleLogout = async () => {
        try {
            await logOut();
        } finally {
            try { window.localStorage.removeItem("krishna_current_user"); } catch {}
            setIsMobileMenuOpen(false);
            window.location.href = "/";
        }
    };

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (pathname?.startsWith("/admin")) {
        return null;
    }

    const isHomePage = pathname === "/";
    const headerClasses = isHomePage
        ? `fixed top-0 left-0 w-full z-[99999] [transform:translateZ(0)] h-16 md:h-20 flex items-center transition-all duration-500 ${isScrolled ? "bg-[#0B0B0C]/96 border-b border-[#D6B25E]/22 backdrop-blur-xl" : "bg-transparent border-b border-transparent shadow-none"}`
        : `sticky top-0 left-0 w-full z-[99999] [transform:translateZ(0)] h-16 md:h-20 flex items-center transition-all duration-500 ${isScrolled ? "bg-[#0B0B0C]/96 border-b border-[#D6B25E]/22 backdrop-blur-xl" : "bg-[#0B0B0C]/92 border-b border-[#D6B25E]/18 backdrop-blur-lg shadow-[0_12px_24px_rgba(0,0,0,0.22)]"}`;

    return (
        <>
            <motion.header 
                className={headerClasses}
            >
                <div className="w-full">
                    {/* ── DESKTOP layout ── */}
                    <div className="hidden lg:flex container-custom h-full justify-between items-center transition-[padding] duration-300">
                        {/* Left: Logo */}
                        <div className="flex-shrink-0 flex items-center pr-8">
                            <Link href="/" className="logo tracking-wide flex items-center transform transition-transform hover:scale-[1.02] duration-500 group relative">
                                <Image src="/assets/logo.png" alt="Krishna Diamonds" width={170} height={42} className="object-contain w-[170px] relative z-10" priority />
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-30 duration-600 rounded-sm" />
                            </Link>
                        </div>

                        {/* Center: Desktop Nav */}
                        <div className="flex flex-1 justify-center items-center gap-5 xl:gap-8">
                            {NAV_ITEMS.map((item) => {
                                const isActive = item.href === "/customizer/step-1-diamond"
                                    ? pathname.startsWith("/customizer")
                                    : pathname === item.href || pathname.startsWith(item.href + "/");

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`text-[12px] uppercase tracking-[0.22em] relative font-medium transition-colors duration-500 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:bg-[#D6B25E] after:transition-all after:duration-600 group ${isActive ? "after:w-full text-[#D6B25E]" : "text-[#E4E4E7] hover:text-[#D6B25E] after:w-0 hover:after:w-full"}`}
                                    >
                                        <span className="relative">
                                            {item.label}
                                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-700 pointer-events-none" />
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex-shrink-0 flex justify-end gap-6 items-center">
                            <div className="relative flex items-center">
                                <ProfileMenu />
                            </div>
                            <Link href="/cart" aria-label="Cart" className="text-[#E4E4E7] hover:text-[#D6B25E] transition-colors duration-300 relative p-1">
                                <ShoppingCart size={18} strokeWidth={1.5} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-[#D6B25E] text-[#0B0B0C] text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    {/* ── MOBILE layout: hamburger LEFT · logo CENTER · actions RIGHT ── */}
                    <div className="lg:hidden flex h-full items-center px-4">
                        {/* Left: Hamburger */}
                        <div className="flex-none">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-[#F4F4F5] hover:text-[#D6B25E] transition-colors p-2 -ml-2"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <XIcon size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex-1 flex justify-center">
                            <Link href="/" className="logo tracking-wide flex items-center group relative">
                                <Image src="/assets/logo.png" alt="Krishna Diamonds" width={130} height={34} className="object-contain relative z-10" priority />
                            </Link>
                        </div>

                        {/* Right: Cart + Profile */}
                        <div className="flex-none flex items-center gap-3">
                            <div className="relative flex items-center">
                                <ProfileMenu />
                            </div>
                            <Link href="/cart" aria-label="Cart" className="text-[#E4E4E7] hover:text-[#D6B25E] transition-colors duration-300 relative p-1">
                                <ShoppingCart size={20} strokeWidth={1.5} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-[#D6B25E] text-[#0B0B0C] text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45"
                            style={{ zIndex: 45 }}
                        />
                        <motion.nav
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[min(86vw,340px)] bg-[#0B0B0C] z-50 flex flex-col shadow-2xl border-r border-[#D6B25E]/20"
                        >
                            {/* Mobile Menu Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[#D6B25E]/20">
                                <Image src="/assets/logo.png" alt="Krishna Diamonds" width={120} height={40} className="object-contain" />
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-[#D6B25E] transition-colors p-1">
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Mobile Nav Links */}
                            <div className="flex-1 flex flex-col py-6">
                                {NAV_ITEMS.map((item, i) => {
                                    const isActive = item.href === "/customizer/step-1-diamond"
                                        ? pathname.startsWith("/customizer")
                                        : pathname === item.href;

                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`block px-8 py-4 text-sm uppercase tracking-[0.2em] font-medium transition-colors ${
                                                    isActive
                                                        ? "text-[#D6B25E] bg-[#D6B25E]/10 border-l-2 border-[#D6B25E]"
                                                        : "text-zinc-300 hover:text-[#D6B25E] hover:bg-white/5 border-l-2 border-transparent"
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Mobile Menu Footer */}
                            <div className="p-6 border-t border-[#D6B25E]/20 space-y-3">
                                {user ? (
                                    <div className="border-t border-zinc-800 pt-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                                                {user.displayName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
                                                <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            {isAdmin && (
                                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-[#D6B25E]/50 text-[#D6B25E] hover:text-[#0B0B0C] hover:bg-[#C9A24A] hover:border-[#C9A24A] transition-colors rounded-[8px]">
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors rounded-[8px]">
                                                My Account
                                            </Link>
                                            <button onClick={handleLogout} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/20 transition-colors rounded-[8px] cursor-pointer">
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-[#D6B25E]/50 text-[#D6B25E] hover:text-[#0B0B0C] hover:bg-[#C9A24A] hover:border-[#C9A24A] transition-colors rounded-[8px]">
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
