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
    
    const [isCustomizerMode, setIsCustomizerMode] = useState(false);
    useEffect(() => {
        setIsCustomizerMode(
            (typeof window !== "undefined" && window.location.search.includes("mode=customizer")) || 
            (pathname?.startsWith("/customizer") ?? false)
        );
    }, [pathname]);

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

    // Set header height custom property dynamically for hero calculations
    useEffect(() => {
        const updateHeaderHeight = () => {
            const headerElement = document.querySelector("header");
            if (headerElement) {
                document.documentElement.style.setProperty(
                    "--header-height",
                    `${headerElement.offsetHeight}px`
                );
            }
        };
        
        updateHeaderHeight();
        // Run a second time after a brief delay to ensure layout has settled
        const timer = setTimeout(updateHeaderHeight, 150);
        
        window.addEventListener("resize", updateHeaderHeight);
        return () => {
            window.removeEventListener("resize", updateHeaderHeight);
            clearTimeout(timer);
        };
    }, []);

    if (pathname?.startsWith("/admin")) {
        return null;
    }

    const headerClasses = `sticky top-0 left-0 w-full z-[99999] [transform:translateZ(0)] h-16 lg:h-[120px] flex items-center transition-all duration-500 bg-white border-b border-[#EAEAEA] shadow-[0_2px_12px_rgba(0,0,0,0.02)]`;

    return (
        <>
            <motion.header 
                className={headerClasses}
            >
                <div className="w-full flex flex-col justify-center">
                    {/* ── DESKTOP layout ── */}
                    <div className="hidden lg:flex flex-col w-full">
                        {/* Row 1: Centered Logo + Absolutely Aligned Right Icons */}
                        <div className="relative flex items-center justify-center w-full px-12 py-3 h-[60px]">
                            {/* Center Logo */}
                            <Link href="/" className="logo flex items-center">
                                <span 
                                    className="font-serif uppercase leading-none select-none"
                                    style={{
                                        fontSize: "40px",
                                        letterSpacing: "0.08em",
                                        fontWeight: "500",
                                        color: "#1A1A1A"
                                    }}
                                >
                                    ZYNORALUXE
                                </span>
                            </Link>

                            {/* Right Icons: Account + Cart aligned absolute right */}
                            <div 
                                style={{
                                    position: "absolute",
                                    right: "32px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "18px",
                                    height: "60px"
                                }}
                            >
                                {/* Account circle */}
                                <div 
                                    style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "999px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <ProfileMenu />
                                </div>
                                {/* Cart icon */}
                                <Link 
                                    href="/cart" 
                                    aria-label="Cart" 
                                    style={{
                                        width: "22px",
                                        height: "22px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative"
                                    }}
                                    className="text-[#1A1A1A] hover:text-[#C9A14A] transition-colors duration-300"
                                >
                                    <ShoppingCart size={20} strokeWidth={1.5} style={{ width: "22px", height: "22px" }} />
                                    {cartCount > 0 && (
                                        <span 
                                            className="absolute bg-[#C9A14A] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                                            style={{
                                                top: "-10px",
                                                right: "-10px"
                                            }}
                                        >
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>

                        {/* Row 2: Centered Navigation Menu */}
                        <div className="flex justify-center items-center gap-8 py-3.5 border-t border-[#EAEAEA] w-full">
                            {NAV_ITEMS.map((item) => {
                                const isActive = item.href === "/customizer/step-1-diamond"
                                    ? isCustomizerMode
                                    : !isCustomizerMode && (pathname === item.href || pathname.startsWith(item.href + "/"));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`text-[13px] uppercase tracking-[0.14em] relative font-medium transition-colors duration-500 after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-[1.5px] after:bg-[#C9A14A] after:transition-all after:duration-600 group ${isActive ? "after:w-full text-[#C9A14A]" : "text-[#1A1A1A] hover:text-[#C9A14A] after:w-0 hover:after:w-full"}`}
                                    >
                                        <span className="relative">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── MOBILE layout: hamburger LEFT · logo CENTER · actions RIGHT ── */}
                    <div className="lg:hidden flex h-16 w-full items-center px-4 justify-between bg-white">
                        {/* Left: Hamburger */}
                        <div className="w-1/4 flex justify-start">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-[#1A1A1A] hover:text-[#C9A14A] transition-colors p-2"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <XIcon size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {/* Center: Logo */}
                        <div className="w-2/4 flex justify-center">
                            <Link href="/" className="logo flex items-center">
                                <span 
                                    className="font-serif uppercase leading-none select-none"
                                    style={{
                                        fontSize: "24px",
                                        letterSpacing: "0.08em",
                                        fontWeight: "500",
                                        color: "#1A1A1A"
                                    }}
                                >
                                    ZYNORALUXE
                                </span>
                            </Link>
                        </div>

                        {/* Right: Cart + Profile */}
                        <div className="w-1/4 flex justify-end items-center gap-[18px]">
                            <div 
                                style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "999px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <ProfileMenu />
                            </div>
                            <Link 
                                href="/cart" 
                                aria-label="Cart" 
                                style={{
                                    width: "22px",
                                    height: "22px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative"
                                }}
                                className="text-[#1A1A1A] hover:text-[#C9A14A] transition-colors duration-300"
                            >
                                <ShoppingCart size={20} strokeWidth={1.5} style={{ width: "22px", height: "22px" }} />
                                {cartCount > 0 && (
                                    <span 
                                        className="absolute bg-[#C9A14A] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                                        style={{
                                            top: "-10px",
                                            right: "-10px"
                                        }}
                                    >
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45"
                            style={{ zIndex: 45 }}
                        />
                        <motion.nav
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[min(86vw,340px)] bg-white z-50 flex flex-col shadow-2xl border-r border-[#EAEAEA]"
                        >
                            {/* Mobile Menu Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA]">
                                <span 
                                    className="font-serif uppercase leading-none select-none"
                                    style={{
                                        fontSize: "24px",
                                        letterSpacing: "0.08em",
                                        fontWeight: "500",
                                        color: "#1A1A1A"
                                    }}
                                >
                                    ZYNORALUXE
                                </span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#666666] hover:text-[#C9A14A] transition-colors p-1">
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Mobile Nav Links */}
                            <div className="flex-1 flex flex-col py-6">
                                {NAV_ITEMS.map((item, i) => {
                                    const isActive = item.href === "/customizer/step-1-diamond"
                                        ? isCustomizerMode
                                        : !isCustomizerMode && (pathname === item.href || pathname.startsWith(item.href + "/"));

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
                                                        ? "text-[#C9A14A] bg-[#FAF8F4] border-l-2 border-[#C9A14A]"
                                                        : "text-[#1A1A1A] hover:text-[#C9A14A] hover:bg-zinc-50 border-l-2 border-transparent"
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Mobile Menu Footer */}
                            <div className="p-6 border-t border-[#EAEAEA] space-y-3">
                                {user ? (
                                    <div className="border-t border-[#EAEAEA] pt-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-[#1A1A1A] font-medium border border-[#EAEAEA]">
                                                {user.displayName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-[#1A1A1A] text-sm font-medium truncate">{user.displayName}</p>
                                                <p className="text-[#666666] text-xs truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            {isAdmin && (
                                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-[#C9A14A]/50 text-[#C9A14A] hover:text-white hover:bg-[#C9A14A] hover:border-[#C9A14A] transition-colors rounded-[8px]">
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-[#EAEAEA] text-[#1A1A1A] hover:bg-zinc-50 transition-colors rounded-[8px]">
                                                My Account
                                            </Link>
                                            <button onClick={handleLogout} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-red-500/20 text-red-500 hover:text-white hover:bg-red-500/10 transition-colors rounded-[8px] cursor-pointer">
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center w-full py-2.5 text-xs uppercase tracking-widest font-bold border border-[#C9A14A]/50 text-[#C9A14A] hover:text-white hover:bg-[#C9A14A] hover:border-[#C9A14A] transition-colors rounded-[8px]">
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
