import { Footer } from "@/components/Footer";
import { LuxuryIntro } from "@/components/LuxuryIntro";
import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://krishnadiamonds.com"),
    title: {
        default: "Krishna Diamonds | Certified Diamonds and Custom Rings",
        template: "%s | Krishna Diamonds",
    },
    description: "Certified diamonds, handcrafted settings, and custom ring creation for modern luxury buyers.",
    keywords: [
        "Krishna Diamonds",
        "diamond jewelry",
        "engagement rings",
        "custom ring design",
        "certified diamonds",
        "luxury jewelry",
        "fine jewelry",
    ],
    openGraph: {
        title: "Krishna Diamonds | Certified Diamonds and Custom Rings",
        description: "Discover premium diamonds and ring customization at Krishna Diamonds.",
        type: "website",
        images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Krishna Diamonds",
        description: "Certified diamonds and bespoke ring craftsmanship.",
        images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80"],
    },
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <LuxuryIntro />
            <main className="min-h-screen bg-[#0B0B0C] text-white">{children}</main>
            <Footer />
        </>
    );
}
