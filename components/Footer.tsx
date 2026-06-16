import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-[#121214] to-[#0B0B0C] text-white border-t border-[#D6B25E]/20">
            {/* Main Footer Content */}
            <div className="container-custom py-20 md:py-24 border-b border-[#D6B25E]/16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-10">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="block mb-6">
                            <Image src="/assets/logo.png" alt="Krishna Diamonds" width={140} height={50} className="object-contain" />
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                            Certified diamonds, handcrafted settings, and custom rings built for your modern jewelry journey.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" aria-label="Instagram" className="text-zinc-500 hover:text-[#D6B25E] transition-colors duration-500 no-link-underline">
                                <Instagram size={18} strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Facebook" className="text-zinc-500 hover:text-[#D6B25E] transition-colors duration-500 no-link-underline">
                                <Facebook size={18} strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="LinkedIn" className="text-zinc-500 hover:text-[#D6B25E] transition-colors duration-500 no-link-underline">
                                <Linkedin size={18} strokeWidth={1.5} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#D6B25E]">Explore</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Home</Link></li>
                            <li><Link href="/shop" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Shop Jewelry</Link></li>
                            <li><Link href="/diamonds" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Diamonds</Link></li>
                            <li><Link href="/customizer/step-1-diamond" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Custom Rings</Link></li>
                            <li><Link href="/ring-settings" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Ring Settings</Link></li>
                            <li><Link href="/about" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Our Story</Link></li>
                        </ul>
                    </div>

                    {/* Customer Care Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#D6B25E]">Support</h4>
                        <ul className="space-y-3">
                            <li><Link href="/customer-care" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Contact Us</Link></li>
                            <li><Link href="/b2b" className="text-[#D6B25E] text-sm hover:text-white transition-colors duration-500 font-medium">B2B Wholesale Program</Link></li>
                            <li><Link href="#" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Returns & Exchanges</Link></li>
                            <li><Link href="#" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Shipping Information</Link></li>
                            <li><Link href="#" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Jewelry Care</Link></li>
                            <li><Link href="#" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">Ring Size Guide</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="font-heading text-sm uppercase tracking-[0.22em] font-semibold mb-6 text-[#D6B25E]">Get In Touch</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <MapPin size={18} className="text-[#D6B25E]/70 mt-1 flex-shrink-0" />
                                <span className="text-zinc-400 text-sm leading-relaxed">
                                    Zynora Luxe Studio,<br />
                                    Surat Diamond District,<br />
                                    Gujarat, India
                                </span>
                            </li>
                            <li className="flex items-start gap-4">
                                <Phone size={18} className="text-[#D6B25E]/70 flex-shrink-0 mt-1" />
                                <div className="flex flex-col gap-1">
                                    <a href="tel:+919724627122" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">
                                        +91 97246 27122
                                    </a>
                                    <a href="tel:+919427143105" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">
                                        +91 94271 43105
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center gap-4">
                                <Mail size={18} className="text-[#D6B25E]/70 flex-shrink-0" />
                                <a href="mailto:luxezynora@gmail.com" className="text-zinc-400 text-sm hover:text-[#D6B25E] transition-colors duration-500">
                                    luxezynora@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="container-custom py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-xs">
                        &copy; {currentYear} Krishna Diamonds. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-zinc-500">
                        <Link href="#" className="hover:text-[#D6B25E] transition-colors duration-500">Privacy Policy</Link>
                        <Link href="#" className="hover:text-[#D6B25E] transition-colors duration-500">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
