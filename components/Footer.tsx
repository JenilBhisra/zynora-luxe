import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#FAF8F4] text-[#1A1A1A] border-t border-[#EAEAEA]">
            {/* Main Footer Content */}
            <div className="container-custom py-20 md:py-24 border-b border-[#EAEAEA]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-10">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="block mb-6">
                            <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-[#1A1A1A] uppercase leading-none select-none">
                                ZYNORALUXE
                            </span>
                        </Link>
                        <p className="text-[#666666] text-sm leading-relaxed mb-6">
                            Certified diamonds, handcrafted settings, and custom rings built for your modern jewelry journey.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" aria-label="Instagram" className="text-[#666666] hover:text-[#C9A14A] transition-colors duration-500 no-link-underline">
                                <Instagram size={18} strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Facebook" className="text-[#666666] hover:text-[#C9A14A] transition-colors duration-500 no-link-underline">
                                <Facebook size={18} strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="LinkedIn" className="text-[#666666] hover:text-[#C9A14A] transition-colors duration-500 no-link-underline">
                                <Linkedin size={18} strokeWidth={1.5} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#C9A14A]">Explore</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Home</Link></li>
                            <li><Link href="/shop" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Shop Jewelry</Link></li>
                            <li><Link href="/diamonds" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Diamonds</Link></li>
                            <li><Link href="/customizer/step-1-diamond" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Custom Rings</Link></li>
                            <li><Link href="/ring-settings" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Ring Settings</Link></li>
                            <li><Link href="/about" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Our Story</Link></li>
                        </ul>
                    </div>

                    {/* Customer Care Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#C9A14A]">Support</h4>
                        <ul className="space-y-3">
                            <li><Link href="/customer-care" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Contact Us</Link></li>
                            <li><Link href="/customer-care" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">FAQs</Link></li>
                            <li><Link href="/delivery-tracking" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Track Order</Link></li>
                            <li><Link href="/customer-care" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Shipping & Returns</Link></li>
                            <li><Link href="/customer-care" className="text-[#666666] text-sm hover:text-[#C9A14A] transition-colors duration-500">Lifetime Warranty</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#C9A14A]">Showroom</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-[#666666] leading-relaxed">
                                <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-[#C9A14A]" />
                                <span>123 Couture Boulevard,<br />Luxury District, Mumbai</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#666666] items-center">
                                <Phone size={16} strokeWidth={1.5} className="shrink-0 text-[#C9A14A]" />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#666666] items-center">
                                <Mail size={16} strokeWidth={1.5} className="shrink-0 text-[#C9A14A]" />
                                <a href="mailto:concierge@zynoraluxe.com" className="hover:text-[#C9A14A] transition-colors">concierge@zynoraluxe.com</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="container-custom py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#666666] text-xs">
                        &copy; {currentYear} ZYNORALUXE. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-[#666666]">
                        <Link href="#" className="hover:text-[#C9A14A] transition-colors duration-500">Privacy Policy</Link>
                        <Link href="#" className="hover:text-[#C9A14A] transition-colors duration-500">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
