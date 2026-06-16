"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/auth.client";
import Image from "next/image";
import { LayoutDashboard, Gem, Settings2, ShoppingBag, Users, LogOut as LogOutIcon, BarChart, Menu, X, Store, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const adminNav = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Diamonds", href: "/admin/diamonds", icon: Gem },
    { name: "Ring Settings", href: "/admin/ring-settings", icon: Settings2 },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Bespoke Requests", href: "/admin/customization-requests", icon: Sparkles },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
];

export default function AdminLayoutClient({ children, user }: { children: React.ReactNode, user: any }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="admin-denied-screen">
                <div className="admin-denied-icon">🔒</div>
                <p className="admin-denied-title">Access Denied</p>
                <p className="admin-denied-sub">Admins only.</p>
            </div>
        );
    }

    const currentRouteName = adminNav.find(item => item.href === pathname)?.name || "Admin Panel";
    const currentIcon = adminNav.find(item => item.href === pathname)?.icon || LayoutDashboard;
    const CurrentIcon = currentIcon;

    const handleLogout = async () => {
        await logOut();
        router.push("/");
    };

    return (
        <div className="admin-root">
            {/* Ambient background blobs */}
            <div className="admin-bg-blob admin-bg-blob-1" />
            <div className="admin-bg-blob admin-bg-blob-2" />

            {/* Mobile overlay */}
            {mobileNavOpen && (
                <button
                    onClick={() => setMobileNavOpen(false)}
                    className="admin-mobile-overlay"
                    aria-label="Close menu"
                />
            )}

            {/* ── Sidebar ─────────────────────────────── */}
            <aside className={`admin-sidebar ${mobileNavOpen ? "admin-sidebar--open" : ""}`}>
                {/* Logo */}
                <div className="admin-sidebar-brand">
                    <Link href="/admin" className="no-link-underline admin-brand-link">
                        <Image src="/assets/logo.png" alt="ZYNORA" width={90} height={28} className="object-contain admin-brand-logo" />
                        <span className="admin-brand-badge">ADMIN</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="admin-nav">
                    <p className="admin-nav-section-label">Navigation</p>
                    {adminNav.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileNavOpen(false)}
                                className={`admin-nav-item no-link-underline ${isActive ? "admin-nav-item--active" : ""}`}
                            >
                                <span className={`admin-nav-icon-wrap ${isActive ? "admin-nav-icon-wrap--active" : ""}`}>
                                    <item.icon size={16} />
                                </span>
                                <span className="admin-nav-label">{item.name}</span>
                                {isActive && <span className="admin-nav-active-dot" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-divider" />
                    <Link href="/" className="admin-footer-link no-link-underline">
                        <Store size={14} />
                        Back to Store
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="admin-logout-btn"
                    >
                        <LogOutIcon size={14} />
                        Secure Logout
                    </button>
                </div>
            </aside>

            {/* ── Main Area ────────────────────────────── */}
            <div className="admin-main">
                {/* Top Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <button
                            className="admin-mobile-menu-btn"
                            onClick={() => setMobileNavOpen(v => !v)}
                            aria-label="Toggle navigation"
                        >
                            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div className="admin-header-title-wrap">
                            <CurrentIcon size={18} className="admin-header-page-icon" />
                            <span className="admin-header-title">{currentRouteName}</span>
                        </div>
                    </div>

                    <div className="admin-header-right">
                        <div className="admin-user-chip">
                            <div className="admin-user-avatar">
                                {user.name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className="admin-user-info">
                                <p className="admin-user-name">{user.name}</p>
                                <p className="admin-user-email">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="admin-header-logout"
                            title="Logout"
                        >
                            <LogOutIcon size={16} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="admin-content custom-scrollbar">
                    <div className="admin-content-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
