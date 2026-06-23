import { Metadata } from "next";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { FadeIn } from "@/components/FadeIn";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { selectCardImage } from "@/lib/image-utils";
import { HeroSlider } from "@/components/HeroSlider";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

// Dynamically import heavy below-the-fold components
const InteractiveCategoryGallery = nextDynamic(() => import("@/components/InteractiveCategoryGallery").then(mod => mod.InteractiveCategoryGallery));
const DiamondShapeSection = nextDynamic(() => import("@/components/DiamondShapeSection").then(mod => mod.DiamondShapeSection));
const ScrollScene = nextDynamic(() => import("@/components/animation/ScrollScene").then(mod => mod.ScrollScene), {
    loading: () => <div className="min-h-screen bg-white flex items-center justify-center text-[#1A1A1A]/40 font-serif tracking-[0.2em] text-xs uppercase animate-pulse">Loading Storyline...</div>
});
const AdminStudio = nextDynamic(() => import("@/components/AdminStudio").then(mod => mod.AdminStudio));

import { VisualEditButton } from "@/components/VisualEditButton";

const prisma = new PrismaClient();

export const metadata: Metadata = {
    title: "Zynora Luxe | Lab Grown Diamond Jewelry",
    description: "Zynora Luxe (also known as ZynoraLuxe) is a premier luxury jewelry brand offering lab grown diamond engagement rings, pendants, bracelets, earrings, necklaces, and custom fine jewelry.",
    keywords: [
        "Zynora Luxe",
        "ZynoraLuxe",
        "Zynora",
        "zynoraluxe.com",
        "lab grown diamond jewelry",
        "custom diamond jewelry",
        "luxury jewelry",
        "engagement rings"
    ],
    alternates: {
        canonical: "https://zynoraluxe.com",
    }
};

export const revalidate = 300;

// Cached Prisma queries with select limits (take restricted to 4 for featured products)
const getCachedFeaturedProducts = unstable_cache(
    async () => {
        return prisma.product.findMany({
            where: { isFeatured: true },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
            }
        });
    },
    ["featured-products"],
    { revalidate: 300, tags: ["featured-products"] }
);

const getCachedFeaturedDiamonds = unstable_cache(
    async () => {
        return prisma.diamond.findMany({
            where: { stockStatus: "AVAILABLE" },
            orderBy: [{ caratWeight: "desc" }, { createdAt: "desc" }],
            take: 4,
            select: {
                id: true,
            }
        });
    },
    ["featured-diamonds"],
    { revalidate: 300, tags: ["featured-diamonds"] }
);

const getCachedFeaturedSettings = unstable_cache(
    async () => {
        return prisma.setting.findMany({
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
                id: true,
            }
        });
    },
    ["featured-settings"],
    { revalidate: 300, tags: ["featured-settings"] }
);

export default async function HomePage() {
    // Query site assets immediately (resolved from DB - only homepage specific keys)
    const homepageAssetKeys = [
        "hero-slide-1",
        "hero-slide-1-mobile",
        "category-engagement-ring",
        "category-pendant",
        "category-bracelet-and-watch",
        "category-earrings",
        "category-necklace",
        "diamond-shape-main-image",
        "journey-image",
        "journey-image-2",
        "journey-image-3",
        "text:journey-kicker",
        "text:journey-headline",
        "text:journey-body",
        "featured-collection-bg",
        "text:featured-heading",
        "text:trust-heading",
        "text:trust-body",
        "text:cta-heading",
        "text:cta-body"
    ];

    const siteAssets = await prisma.siteAsset.findMany({
        where: {
            key: {
                in: homepageAssetKeys
            }
        },
        select: {
            key: true,
            url: true
        }
    });
    const assetsMap = siteAssets.reduce((acc: Record<string, string>, asset) => {
        acc[asset.key] = asset.url;
        return acc;
    }, {});

    // Prune assets passed to HeroSlider (only hero slide 1 desktop + mobile)
    const heroSlides = {
        "hero-slide-1": assetsMap["hero-slide-1"],
        "hero-slide-1-mobile": assetsMap["hero-slide-1-mobile"],
    };

    // Prune assets passed to category gallery (only category images)
    const categoryImages = {
        "category-engagement-ring": assetsMap["category-engagement-ring"],
        "category-pendant": assetsMap["category-pendant"],
        "category-bracelet-and-watch": assetsMap["category-bracelet-and-watch"],
        "category-earrings": assetsMap["category-earrings"],
        "category-necklace": assetsMap["category-necklace"],
    };

    // Prune assets passed to DiamondShapeSection (main image only, icons and hovers are client-side dynamic)
    const shapeImages: Record<string, string> = {
        "diamond-shape-main-image": assetsMap["diamond-shape-main-image"] || ""
    };

    // Prune assets passed to ScrollScene (scroll-scene images and scroll-scene text - loaded client-side now)
    const scrollImages: Record<string, string> = {};
    const scrollText: Record<string, string> = {};

    // Prune assets used directly inside HomeContent to prevent serializing the full assetsMap
    const homeContentAssets = {
        "journey-image": assetsMap["journey-image"],
        "journey-image-2": assetsMap["journey-image-2"],
        "journey-image-3": assetsMap["journey-image-3"],
        "text:journey-kicker": assetsMap["text:journey-kicker"],
        "text:journey-headline": assetsMap["text:journey-headline"],
        "text:journey-body": assetsMap["text:journey-body"],
        "featured-collection-bg": assetsMap["featured-collection-bg"],
        "text:featured-heading": assetsMap["text:featured-heading"],
        "text:trust-heading": assetsMap["text:trust-heading"],
        "text:trust-body": assetsMap["text:trust-body"],
        "text:cta-heading": assetsMap["text:cta-heading"],
        "text:cta-body": assetsMap["text:cta-body"],
    };

    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "JewelryStore",
        "@id": "https://zynoraluxe.com/#organization",
        "name": "Zynora Luxe",
        "alternateName": ["ZynoraLuxe", "Zynora"],
        "url": "https://zynoraluxe.com",
        "logo": "https://zynoraluxe.com/favicon.ico",
        "description": "Zynora Luxe (ZynoraLuxe) is a premier luxury jewelry brand crafting exquisite lab grown diamond engagement rings, settings, and bespoke fine jewelry."
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://zynoraluxe.com/#website",
        "name": "Zynora Luxe",
        "url": "https://zynoraluxe.com",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://zynoraluxe.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <div className="bg-white text-[#1A1A1A] relative">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            {/* Header + Hero Slider loads immediately on first paint */}
            <div className="relative">
                <HeroSlider customSlides={heroSlides} />
                {/* Admin: edit the single hero slide (desktop & mobile slots) */}
                <VisualEditButton type="homepage" assetKey="hero-slide-1" className="top-24 left-6" />
                <VisualEditButton type="homepage" assetKey="hero-slide-1-mobile" className="top-24 left-16" />
            </div>

            {/* Suspense streaming handles the heavy database calls progressively below-the-fold */}
            <Suspense fallback={<HomeSkeletonLoader />}>
                <HomeContent 
                    homeContentAssets={homeContentAssets} 
                    categoryImages={categoryImages}
                    shapeImages={shapeImages}
                    scrollImages={scrollImages}
                    scrollText={scrollText}
                />
            </Suspense>

            <AdminStudio />
        </div>
    );
}

// Child component for query-reliant segments
async function HomeContent({ 
    homeContentAssets, 
    categoryImages,
    shapeImages,
    scrollImages,
    scrollText
}: { 
    homeContentAssets: Record<string, string>;
    categoryImages: Record<string, string>;
    shapeImages: Record<string, string>;
    scrollImages: Record<string, string>;
    scrollText: Record<string, string>;
}) {
    const [featuredProducts, featuredDiamonds, featuredSettings] = await Promise.all([
        getCachedFeaturedProducts(),
        getCachedFeaturedDiamonds(),
        getCachedFeaturedSettings()
    ]);

    const houseMetrics = [
        {
            label: "Certified diamonds",
            value: `${Math.max(featuredDiamonds.length, 1) < 10 ? `0${Math.max(featuredDiamonds.length, 1)}` : Math.max(featuredDiamonds.length, 1)}+`,
            detail: "Curated stones selected for brilliance",
        },
        {
            label: "Handcrafted settings",
            value: `${Math.max(featuredSettings.length, 1) < 10 ? `0${Math.max(featuredSettings.length, 1)}` : Math.max(featuredSettings.length, 1)}+`,
            detail: "Signature ring foundations and mountings",
        },
        {
            label: "Signature pieces",
            value: `${Math.max(featuredProducts.slice(0, 4).length, 1)}`,
            detail: "Best sellers and bespoke recommendations",
        },
    ];

    const timelineImages = featuredProducts.slice(0, 4).map((product, index) => ({
        src: selectCardImage(product.images, new Set(), "jewelry", index, product.id, product.name),
        alt: product.name,
    }));

    return (
        <>
            {/* Section 1: Category Gallery — directly after Hero */}
            <InteractiveCategoryGallery customImages={categoryImages} />

            {/* Section 2: Shop Diamonds by Shape */}
            <DiamondShapeSection customImages={shapeImages} />

            {/* Section 3: Custom Journey / Section Banners */}
            <AnimatedSection id="home-followup-section" className="py-24 md:py-32 bg-white story-section-frame">
                <div className="container-custom grid gap-14 lg:grid-cols-[1.02fr_0.98fr] items-center">
                    <FadeIn className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full">
                        <div className="absolute top-0 right-0 w-[75%] h-[75%] luxury-shell overflow-hidden rounded-[20px] shadow-2xl z-20">
                            <SmartImage
                                src={homeContentAssets["journey-image"] || "/products/ring-2.jpg"}
                                alt="Custom Ring Creation"
                                fill
                                fallbackType="setting"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            <VisualEditButton type="homepage" assetKey="journey-image" />
                        </div>
                        <div className="absolute bottom-10 left-0 w-[55%] h-[50%] luxury-shell overflow-hidden rounded-[16px] shadow-xl z-30 ring-1 ring-black/5">
                            <SmartImage
                                src={homeContentAssets["journey-image-2"] || "/products/earrings-1.jpg"}
                                alt="Detail shot"
                                fill
                                fallbackType="jewelry"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            <VisualEditButton type="homepage" assetKey="journey-image-2" />
                        </div>
                        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] luxury-shell overflow-hidden rounded-[12px] shadow-md z-10 opacity-80 ring-1 ring-[#C9A14A]/20 blur-[1px] hover:blur-none transition-all duration-500">
                            <SmartImage
                                src={homeContentAssets["journey-image-3"] || "/products/loose-diamond.jpg"}
                                alt="Diamond close-up"
                                fill
                                fallbackType="diamond"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            <VisualEditButton type="homepage" assetKey="journey-image-3" />
                        </div>
                    </FadeIn>
                    <FadeIn className="max-w-[640px]">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] mb-5 reveal-step-1">
                            {homeContentAssets["text:journey-kicker"] || "The Custom Journey"}
                        </span>
                        <h2 className="text-[24px] md:text-[32px] leading-[1.1] mb-6 text-[#1A1A1A] reveal-step-2">
                            {homeContentAssets["text:journey-headline"] || "Create a ring as rare as the moment it marks"}
                        </h2>
                        <p className="text-[#666666] text-[15px] md:text-[16px] leading-[1.7] mb-10 max-w-[540px] reveal-step-3">
                            {homeContentAssets["text:journey-body"] || "At ZynoraLuxe, we design with certified stones, refined settings, and precious metals. Every step is deliberate, calm, and built for an effortless experience."}
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-10">
                            {houseMetrics.map((metric, idx) => (
                                <FadeIn key={metric.label} delay={idx * 0.12} className="h-full">
                                    <div className="bg-[#FAF8F4] border border-[#EAEAEA] rounded-[14px] p-3 md:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] h-full flex flex-col justify-between">
                                        <div>
                                            <div className="text-[20px] sm:text-[28px] md:text-[32px] font-serif text-[#1A1A1A] mb-1 leading-none font-medium">{metric.value}</div>
                                            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.28em] text-[#666666] mb-2 font-medium">{metric.label}</div>
                                        </div>
                                        <div className="text-[11px] sm:text-[13px] leading-snug sm:leading-relaxed text-[#666666]">{metric.detail}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold bg-[#C9A14A] text-white btn-gold-hover hover:bg-[#B58F3B] transition-all duration-600 relative group cta-emerge cta-emerge-delay-1">
                                <span className="relative z-10 text-white-force">Begin Custom Design</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 duration-600" />
                            </Link>
                            <Link href="/shop" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A] hover:text-white transition-all duration-600 relative group cta-emerge cta-emerge-delay-2">
                                <span className="relative z-10">Explore Collection</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </AnimatedSection>

            {/* Journey Scroll Scene */}
            <ScrollScene images={timelineImages} nextSectionSelector="#featured-products-section" customImages={scrollImages} customText={scrollText} />

            {/* Section 2: Product Showcase (Featured Collection / Featured Products) */}
            <AnimatedSection 
                id="featured-products-section"
                className="py-24 md:py-28 relative overflow-hidden story-section-frame"
                style={{
                    backgroundImage: `url('${homeContentAssets["featured-collection-bg"] || "/images/about2.jpg"}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                {/* Creamy white readable overlay for text contrast */}
                <div className="absolute inset-0 bg-white/85 pointer-events-none z-0" />

                <div className="container-custom relative z-10 animate-fade-in">
                    <div className="absolute -top-12 left-4 z-20">
                        <VisualEditButton type="homepage" assetKey="featured-collection-bg" />
                    </div>
                    <FadeIn className="mb-12 md:mb-16 max-w-2xl reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] mb-4">Featured Collection</span>
                        <h2 className="text-[24px] md:text-[32px] leading-[1.1] text-[#1A1A1A] reveal-step-2">
                            {homeContentAssets["text:featured-heading"] || "Signature pieces, hand-selected"}
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {featuredProducts.slice(0, 4).map((product, index) => {
                            const cardAssetKey = `featured-product-${index + 1}`;
                            const image = homeContentAssets[cardAssetKey] || selectCardImage(product.images, new Set(), "jewelry", index, product.id, product.name);
                            return (
                                <FadeIn key={product.id} delay={index * 0.08} className={`reveal-step-${Math.min(index + 1, 4)}`}>
                                    <Link href={`/product/${product.slug}`} className="group block h-full">
                                        <div className="bg-white border border-[#EAEAEA] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-[#C9A14A]/40 rounded-[20px] h-full overflow-hidden">
                                            <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF8F4] image-progressive-reveal">
                                                <SmartImage
                                                    src={image}
                                                    alt={product.name}
                                                    fill
                                                    fallbackType="jewelry"
                                                    sizeType="thumbnail"
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                                />
                                                <span className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.24em] font-bold text-[#C9A14A] opacity-0 group-hover:opacity-100 transition-opacity duration-500">View</span>
                                                <VisualEditButton type="homepage" assetKey={cardAssetKey} />
                                            </div>
                                            <div className="p-5 md:p-6 bg-white text-center">
                                                {/* 1. Price */}
                                                <div className="mb-1">
                                                    <p className="text-[18px] font-semibold tracking-tight text-zinc-900">Rs {Number(product.price).toLocaleString("en-IN")}</p>
                                                </div>
                                                {/* 2. Title */}
                                                <h3 className="text-[14px] md:text-[17px] font-sans font-medium text-zinc-900 line-clamp-1 group-hover:text-[#C9A14A] transition-colors duration-500">{product.name}</h3>
                                            </div>
                                        </div>
                                    </Link>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </AnimatedSection>

            {/* Section 3: Trust + Brand Authority */}
            <AnimatedSection className="py-24 md:py-28 bg-white story-section-frame">
                <div className="container-custom grid gap-8 lg:grid-cols-2 items-stretch">
                    <FadeIn className="bg-[#FAF8F4] border border-[#EAEAEA] rounded-[22px] p-8 md:p-10 reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] mb-4">Why Choose Us</span>
                        <h2 className="text-[24px] md:text-[32px] leading-[1.1] text-[#1A1A1A] mb-6 reveal-step-2">
                            {homeContentAssets["text:trust-heading"] || "Designed with certainty, delivered with care"}
                        </h2>
                        <p className="text-[#666666] leading-[1.7] text-[15px] md:text-[16px] max-w-xl mb-8 reveal-step-3">
                            {homeContentAssets["text:trust-body"] || "Premium jewelry deserves a presentation that feels equally assured. Certified sourcing, insured delivery, and personal assistance guide every order."}
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { label: "Certified", value: "GIA / IGI" },
                                { label: "Delivery", value: "Insured" },
                                { label: "Support", value: "Personal" },
                            ].map((item, idx) => (
                                <FadeIn key={item.label} delay={idx * 0.1} className={`reveal-step-${Math.min(idx + 3, 5)}`}>
                                    <div className="rounded-[16px] border border-[#EAEAEA] bg-white p-4 premium-hover-lift cursor-pointer">
                                        <div className="text-[10px] uppercase tracking-[0.28em] text-[#666666] mb-2">{item.label}</div>
                                        <div className="text-[18px] text-[#1A1A1A] font-semibold">{item.value}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>

                    <FadeIn className="bg-[#FAF8F4] border border-[#EAEAEA] rounded-[22px] p-8 md:p-10 flex flex-col justify-between">
                        <div>
                            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] mb-4">Testimonial</span>
                            <p className="text-[24px] md:text-[32px] leading-[1.35] text-[#1A1A1A] font-serif mb-8 max-w-xl font-light italic">
                                “The presentation, the quiet confidence, and the craftsmanship felt closer to a private atelier than an online store.”
                            </p>
                        </div>
                        <div className="pt-8 border-t border-[#EAEAEA] flex items-center justify-between gap-4">
                            <div>
                                <div className="text-[#1A1A1A] text-[14px] uppercase tracking-[0.26em] mb-1 font-semibold">Client note</div>
                                <div className="text-[#666666] text-[13px]">Luxury buyer feedback</div>
                            </div>
                            <Link href="/shop" className="inline-flex items-center justify-center px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold bg-[#C9A14A] text-white hover:bg-[#B58F3B] btn-gold-hover transition-all duration-600 relative group">
                                <span className="relative z-10 text-white-force">Discover More</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-30 duration-600" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </AnimatedSection>

            {/* Section 4: Clear Call-to-Action Funnel */}
            <AnimatedSection className="py-24 md:py-32 bg-white story-section-frame">
                <div className="container-custom text-center max-w-4xl mx-auto">
                    <FadeIn className="reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#C9A14A] mb-5">Your Journey Starts Here</span>
                        <h2 className="text-[24px] md:text-[32px] leading-[1.1] text-[#1A1A1A] mb-6 reveal-step-2">
                            {homeContentAssets["text:cta-heading"] || "Three ways to find your perfect piece"}
                        </h2>
                        <p className="text-[#666666] text-[15px] md:text-[16px] leading-[1.7] max-w-2xl mx-auto mb-12 reveal-step-3">
                            {homeContentAssets["text:cta-body"] || "Whether you're creating a custom ring, exploring certified diamonds, or browsing signature pieces, we've designed a calm, intentional journey for you."}
                        </p>
                    </FadeIn>
                    
                    {/* Three-step conversion funnel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {[
                            {
                                step: "01",
                                title: "Customize Your Ring",
                                description: "Build your perfect piece from certified diamonds and premium metals.",
                                href: "/customizer/step-1-diamond",
                                cta: "Begin Design"
                            },
                            {
                                step: "02",
                                title: "Explore Diamonds",
                                description: "Discover GIA-certified stones hand-selected for brilliance.",
                                href: "/diamonds",
                                cta: "View Diamonds"
                            },
                            {
                                step: "03",
                                title: "Shop Collection",
                                description: "Browse signature pieces and ready-to-wear jewelry.",
                                href: "/shop",
                                cta: "Shop Now"
                            }
                        ].map((item, idx) => (
                            <FadeIn key={item.step} delay={idx * 0.15} className={`reveal-step-${Math.min(idx + 1, 4)}`}>
                                <Link href={item.href}>
                                    <div className="bg-[#FAF8F4] border border-[#EAEAEA] hover:border-[#C9A14A]/40 rounded-[22px] p-8 h-full flex flex-col justify-between cursor-pointer premium-hover-lift">
                                        <div>
                                            <div className="text-[36px] font-serif text-[#C9A14A] mb-3 font-light">{item.step}</div>
                                            <h3 className="text-[18px] font-medium text-[#1A1A1A] mb-3">{item.title}</h3>
                                            <p className="text-[#666666] text-[15px] leading-relaxed">{item.description}</p>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-[#EAEAEA]">
                                            <span className="inline-block text-[12px] uppercase tracking-[0.2em] font-semibold text-[#C9A14A] group-hover:translate-x-1 transition-transform duration-300">
                                                {item.cta} →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <FadeIn delay={0.6} className="cta-emerge cta-emerge-delay-2">
                        <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-10 md:px-12 py-5 text-[13px] md:text-[14px] uppercase tracking-[0.2em] font-semibold bg-[#C9A14A] text-white btn-gold-hover hover:bg-[#B58F3B] transition-all duration-600 relative group shadow-[0_20px_48px_rgba(201,161,74,0.2)]">
                            <span className="relative z-10 text-white-force">Start Your Custom Ring</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 duration-600 rounded" />
                        </Link>
                    </FadeIn>
                </div>
            </AnimatedSection>
        </>
    );
}

// Lightweight local skeletons streaming fallback for under-the-fold content
function HomeSkeletonLoader() {
    return (
        <div className="w-full bg-white text-[#1A1A1A]">
            {/* Journey Section Skeleton */}
            <div className="py-24 bg-white animate-pulse">
                <div className="container-custom grid gap-14 lg:grid-cols-2">
                    <div className="aspect-[4/5] bg-black/5 rounded-[20px]" />
                    <div className="flex flex-col justify-center">
                        <div className="h-4 w-32 bg-black/5 mb-4" />
                        <div className="h-12 w-full bg-black/5 mb-6" />
                        <div className="h-6 w-3/4 bg-black/5 mb-8" />
                        <div className="h-10 w-48 bg-black/5" />
                    </div>
                </div>
            </div>

            {/* Category Gallery Skeleton */}
            <section className="py-20 bg-white border-t border-[#EAEAEA]">
                <div className="container-custom">
                    <div className="flex flex-col items-center mb-12 animate-pulse">
                        <div className="h-3 w-32 bg-black/5 mb-4" />
                        <div className="h-8 w-64 bg-black/5" />
                    </div>
                    {/* 6 column category skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex flex-col gap-3 animate-pulse">
                                <div className="aspect-square w-full bg-[#FAF8F4]" />
                                <div className="h-4 w-2/3 bg-black/5 mx-auto mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
