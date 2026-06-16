"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { ArrowRight } from "lucide-react";
import { selectCardImage } from "@/lib/image-utils";

const CATEGORIES = ["Bracelet", "Ring", "Necklace", "Earrings", "Other Jewelry"];

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    images: string | string[] | null | undefined;
    category?: { name: string } | null;
}

interface InteractiveCategoryShowcaseProps {
    products: Product[];
}

const FALLBACKS: Record<string, any[]> = {
    "Bracelet": [
        { id: "f-b1", name: "Classic Tennis Bracelet", slug: "shop", price: 155000, fallbackImg: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80" },
        { id: "f-b2", name: "Diamond Line Bracelet", slug: "shop", price: 210000, fallbackImg: "https://images.unsplash.com/photo-1573408301145-b98c4af01158?auto=format&fit=crop&w=800&q=80" },
        { id: "f-b3", name: "Vintage Bangle", slug: "shop", price: 95000, fallbackImg: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80" },
    ],
    "Ring": [
        { id: "f-r1", name: "Solitaire Promise Ring", slug: "shop", price: 125000, fallbackImg: "https://images.unsplash.com/photo-1605100804763-247f6c9533f0?auto=format&fit=crop&w=800&q=80" },
        { id: "f-r2", name: "Eternity Band", slug: "shop", price: 85000, fallbackImg: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&w=800&q=80" },
        { id: "f-r3", name: "Sapphire Halo Ring", slug: "shop", price: 175000, fallbackImg: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80" },
    ],
    "Necklace": [
        { id: "f-n1", name: "Diamond Pendant", slug: "shop", price: 65000, fallbackImg: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80" },
        { id: "f-n2", name: "Pearl Strand", slug: "shop", price: 110000, fallbackImg: "https://images.unsplash.com/photo-1681926618485-3bc677ebd53f?auto=format&fit=crop&w=800&q=80" },
        { id: "f-n3", name: "Vintage Locket", slug: "shop", price: 45000, fallbackImg: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=80" },
    ],
    "Earrings": [
        { id: "f-e1", name: "Diamond Studs", slug: "shop", price: 145000, fallbackImg: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80" },
        { id: "f-e2", name: "Drop Earrings", slug: "shop", price: 195000, fallbackImg: "https://images.unsplash.com/photo-1629224316810-9d8805b95e76?auto=format&fit=crop&w=800&q=80" },
        { id: "f-e3", name: "Hoop Statement", slug: "shop", price: 65000, fallbackImg: "https://images.unsplash.com/photo-1616422285623-14df61788775?auto=format&fit=crop&w=800&q=80" },
    ],
    "Other Jewelry": [
        { id: "f-o1", name: "Gold Brooch", slug: "shop", price: 55000, fallbackImg: "https://images.unsplash.com/photo-1588444650733-d0767b753cb8?auto=format&fit=crop&w=800&q=80" },
        { id: "f-o2", name: "Luxury Watch", slug: "shop", price: 450000, fallbackImg: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80" },
        { id: "f-o3", name: "Cufflinks", slug: "shop", price: 35000, fallbackImg: "https://images.unsplash.com/photo-1603561596112-0a120531bdba?auto=format&fit=crop&w=800&q=80" },
    ],
};

function getCategoryProducts(category: string, products: Product[]) {
    const matches = products.filter(p => {
        const catName = p.category?.name?.toLowerCase() || "";
        const searchName = category.toLowerCase().replace("other jewelry", "other");
        if (searchName === "other jewelry" || searchName === "other") {
            return !["bracelet", "ring", "necklace", "earrings", "pendant"].some(c => catName.includes(c));
        }
        return catName.includes(searchName) || p.name.toLowerCase().includes(searchName);
    });

    const items = [...matches];
    const fallbackList = FALLBACKS[category] || FALLBACKS["Other Jewelry"];
    while (items.length < 3) {
        items.push(fallbackList[items.length % fallbackList.length]);
    }
    
    return items.slice(0, 3);
}

function ProductCard({ item, index }: { item: any; index: number }) {
    const usedImages = new Set<string>();
    let imageUrl = "";
    if ('fallbackImg' in item) {
        imageUrl = item.fallbackImg;
    } else {
        imageUrl = selectCardImage(item.images, usedImages, "jewelry", index, item.id, item.name);
    }

    return (
        <Link href={`/product/${item.slug}`} className="block">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#F8F6F2] mb-5 border border-black/5">
                <SmartImage
                    src={imageUrl}
                    alt={item.name}
                    fill
                    fallbackType="jewelry"
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.05]"
                />
            </div>
            <div className="text-center">
                <h3 className="text-[14px] font-medium text-[#111111] mb-1 leading-tight tracking-wide">{item.name}</h3>
                <p className="text-[13px] text-[#6B6B6B] font-light">₹{Number(item.price).toLocaleString("en-IN")}</p>
            </div>
        </Link>
    );
}

// ── Mobile Component ──
function MobileCategoryBlock({ category, products }: { category: string, products: Product[] }) {
    const displayItems = getCategoryProducts(category, products);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
        >
            <h3 className="text-[24px] tracking-wide uppercase text-[#111111] font-medium border-b border-black/5 pb-4">
                {category}
            </h3>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-8">
                 {displayItems.map((item, idx) => (
                      <div key={item.id} className="group cursor-pointer">
                          <ProductCard item={item} index={idx} />
                      </div>
                 ))}
            </div>
        </motion.div>
    );
}

// ── Main Component ──
export function InteractiveCategoryShowcase({ products }: InteractiveCategoryShowcaseProps) {
    const containerRef = useRef<HTMLElement>(null);
    const [activeStep, setActiveStep] = useState(0);

    const { scrollYProgress } = useScroll({ 
        target: containerRef, 
        offset: ["start start", "end end"] 
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // Divide 1.0 length into 5 zones
        if (latest < 0.2) setActiveStep(0);
        else if (latest < 0.4) setActiveStep(1);
        else if (latest < 0.6) setActiveStep(2);
        else if (latest < 0.8) setActiveStep(3);
        else setActiveStep(4);
    });

    const activeCategory = CATEGORIES[activeStep];
    const displayItems = getCategoryProducts(activeCategory, products);

    return (
        <section ref={containerRef} className="bg-white relative lg:min-h-[300vh]">
            
            {/* ── DESKTOP VIEW (Sticky Story) ── */}
            <div className="hidden lg:flex sticky top-0 h-screen flex-col justify-center w-full z-10 overflow-hidden">
                <div className="container-custom w-full">
                    <div className="grid grid-cols-12 gap-16">
                        
                        {/* LEFT SIDE: Progressive Reveal Categories */}
                        <div className="col-span-3 flex flex-col justify-center">
                            <h2 className="text-[12px] tracking-[0.1em] font-medium text-[#6B6B6B] uppercase mb-16">
                                Discover Collections
                            </h2>
                            <ul className="flex flex-col gap-6">
                                {CATEGORIES.map((category, index) => {
                                    const isVisible = activeStep >= index;
                                    const isActive = activeStep === index;
                                    return (
                                        <motion.li 
                                            key={category}
                                            initial={false}
                                            animate={{ 
                                                opacity: isVisible ? (isActive ? 1 : 0.25) : 0, 
                                                y: isVisible ? 0 : 30 
                                            }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                            <span 
                                                className={`text-[24px] uppercase tracking-wider block transition-all duration-500 ease-out ${
                                                    isActive 
                                                    ? "text-[#111111] font-medium translate-x-4" 
                                                    : "text-[#111111] font-normal"
                                                }`}
                                            >
                                                {category}
                                            </span>
                                        </motion.li>
                                    );
                                })}
                            </ul>

                            <div className="mt-16 pt-10 border-t border-black/5 opacity-80 hover:opacity-100 transition-opacity">
                                <Link href="/shop" className="inline-flex items-center gap-3 text-[13px] tracking-[0.15em] font-medium uppercase text-[#111111] hover:text-[#6B6B6B] transition-colors w-fit pb-1 border-b border-[#111111] hover:border-[#6B6B6B]">
                                    Explore Full Catalog <ArrowRight size={16} strokeWidth={1.5} />
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Animated Product Display */}
                        <div className="col-span-9 relative flex items-center min-h-[600px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }} // smooth exit upwards
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="grid grid-cols-3 gap-8 w-full absolute inset-x-0"
                                >
                                    {displayItems.map((item, index) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.15, duration: 0.7, ease: "easeOut" }}
                                            className="group cursor-pointer"
                                        >
                                            <ProductCard item={item} index={index} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── MOBILE VIEW (Sequential Stacking) ── */}
            <div className="lg:hidden flex flex-col py-24 w-full">
                <div className="container-custom space-y-24">
                    <div>
                        <h2 className="text-[12px] tracking-[0.1em] font-medium text-[#6B6B6B] uppercase mb-12">
                            Discover Collections
                        </h2>
                        <div className="space-y-20">
                            {CATEGORIES.map((category) => (
                                <MobileCategoryBlock key={category} category={category} products={products} />
                            ))}
                        </div>
                        <div className="mt-16 pt-10 border-t border-black/5">
                            <Link href="/shop" className="inline-flex items-center gap-3 text-[12px] tracking-[0.15em] font-medium uppercase text-[#111111] transition-colors pb-1 border-b border-[#111111]">
                                Explore Full Catalog <ArrowRight size={14} strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
}
