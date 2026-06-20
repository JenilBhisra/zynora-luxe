import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://zynoraluxe.com"),
    title: {
        default: "ZYNORA LUXE | Lab Grown Diamond Jewelry",
        template: "%s | ZYNORA LUXE",
    },
    description: "Certified diamonds, handcrafted settings, and custom ring creation for modern luxury buyers.",
    keywords: [
        "ZYNORA LUXE",
        "diamond jewelry",
        "Engagement Ring",
        "custom ring design",
        "certified diamonds",
        "luxury jewelry",
        "fine jewelry",
    ],
    openGraph: {
        title: "ZYNORA LUXE | Lab Grown Diamond Jewelry",
        description: "Discover premium diamonds and ring customization at ZYNORA LUXE.",
        type: "website",
        images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80"],
    },
    twitter: {
        card: "summary_large_image",
        title: "ZYNORA LUXE",
        description: "Certified diamonds and bespoke ring craftsmanship.",
        images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80"],
    },
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <main className="min-h-screen bg-white text-[#1A1A1A]">{children}</main>
            <Footer />
        </>
    );
}
