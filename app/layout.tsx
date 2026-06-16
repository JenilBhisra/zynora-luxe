import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZYNORA LUXE | India's Trusted Diamond Destination",
  description: "Luxury classic diamond jewelry at ZYNORA LUXE. Crafted for a lifetime.",
  icons: {
    icon: "/assets/logo.png"
  }
};

import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import dynamic from "next/dynamic";

const AIConcierge = dynamic(() => import("@/components/AIConcierge").then(mod => mod.AIConcierge));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
            <AIConcierge />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
