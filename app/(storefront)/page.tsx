import { Metadata } from "next";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { FadeIn } from "@/components/FadeIn";
import { SmartImage } from "@/components/SmartImage";
import { AnimatedSection } from "@/components/AnimatedSection";
import { selectCardImage } from "@/lib/image-utils";
import { InteractiveCategoryGallery } from "@/components/InteractiveCategoryGallery";
import { HeroSlider } from "@/components/HeroSlider";
import nextDynamic from "next/dynamic";

const ScrollScene = nextDynamic(() => import("@/components/animation/ScrollScene").then(mod => mod.ScrollScene), {
    loading: () => <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center text-white/40 font-serif tracking-[0.2em] text-xs uppercase animate-pulse">Loading Storyline...</div>
});

const AdminStudio = nextDynamic(() => import("@/components/AdminStudio").then(mod => mod.AdminStudio));

import { VisualEditButton } from "@/components/VisualEditButton";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export const metadata: Metadata = {
    title: "Krishna Diamonds | Fine Jewelry",
    description: "Discover certified diamonds, premium settings, and handcrafted jewelry from Krishna Diamonds.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const session = await getServerSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [featuredProducts, featuredDiamonds, featuredSettings, siteAssets] = await Promise.all([
        prisma.product.findMany({
            where: { isFeatured: true },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
        prisma.diamond.findMany({
            where: { stockStatus: "AVAILABLE" },
            orderBy: [{ caratWeight: "desc" }, { createdAt: "desc" }],
            take: 4,
        }),
        prisma.setting.findMany({
            orderBy: { createdAt: "desc" },
            take: 4,
        }),
        prisma.siteAsset.findMany()
    ]);

    const assetsMap = siteAssets.reduce((acc: Record<string, string>, asset) => {
        acc[asset.key] = asset.url;
        return acc;
    }, {});

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
        <div className="bg-[#0B0B0C] text-white relative">
            <div className="relative">
                <HeroSlider customSlides={assetsMap} customText={assetsMap} />
                {/* Admin: edit any of the 3 hero slides */}
                {isAdmin && (
                    <>
                        <VisualEditButton type="homepage" assetKey="hero-slide-1" className="top-24 left-6" />
                        <VisualEditButton type="homepage" assetKey="hero-slide-2" className="top-24 left-20" />
                        <VisualEditButton type="homepage" assetKey="hero-slide-3" className="top-24 left-36" />
                    </>
                )}
            </div>
            <ScrollScene images={timelineImages} nextSectionSelector="#home-followup-section" customImages={assetsMap} customText={assetsMap} isAdmin={isAdmin} />

            {/* Section 1: Clear Value Prop + Progressive CTA */}
            <AnimatedSection id="home-followup-section" className="py-24 md:py-32 bg-[#0B0B0C] story-section-frame">
                <div className="container-custom grid gap-14 lg:grid-cols-[1.02fr_0.98fr] items-center">
                    <FadeIn className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full">
                        <div className="absolute top-0 right-0 w-[75%] h-[75%] luxury-shell overflow-hidden rounded-[20px] shadow-2xl z-20">
                            <SmartImage
                                src={assetsMap["journey-image"] || "/products/ring-2.jpg"}
                                alt="Custom Ring Creation"
                                fill
                                fallbackType="setting"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            {isAdmin && <VisualEditButton type="homepage" assetKey="journey-image" />}
                        </div>
                        <div className="absolute bottom-10 left-0 w-[55%] h-[50%] luxury-shell overflow-hidden rounded-[16px] shadow-xl z-30 ring-1 ring-white/10">
                            <SmartImage
                                src={assetsMap["journey-image-2"] || "/products/earrings-1.jpg"}
                                alt="Detail shot"
                                fill
                                fallbackType="jewelry"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            {isAdmin && <VisualEditButton type="homepage" assetKey="journey-image-2" />}
                        </div>
                        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] luxury-shell overflow-hidden rounded-[12px] shadow-md z-10 opacity-80 ring-1 ring-[#D6B25E]/20 blur-[1px] hover:blur-none transition-all duration-500">
                            <SmartImage
                                src={assetsMap["journey-image-3"] || "/products/loose-diamond.jpg"}
                                alt="Diamond close-up"
                                fill
                                fallbackType="diamond"
                                className="object-cover transition-transform duration-1000 hover:scale-[1.05]"
                            />
                            {isAdmin && <VisualEditButton type="homepage" assetKey="journey-image-3" />}
                        </div>
                    </FadeIn>
                    <FadeIn className="max-w-[640px]">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E] mb-5 reveal-step-1">
                            {assetsMap["text:journey-kicker"] || "The Custom Journey"}
                        </span>
                        <h2 className="text-[42px] md:text-[58px] leading-[1] mb-6 text-white reveal-step-2">
                            {assetsMap["text:journey-headline"] || "Create a ring as rare as the moment it marks"}
                        </h2>
                        <p className="text-white/72 text-[16px] md:text-[18px] leading-[1.9] mb-10 max-w-[540px] reveal-step-3">
                            {assetsMap["text:journey-body"] || "Design with certified stones, refined settings, and precious metals. Every step is deliberate, calm, and built for an effortless experience."}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                            {houseMetrics.map((metric, idx) => (
                                <FadeIn key={metric.label} delay={idx * 0.12}>
                                    <div className="luxury-panel premium-hover-lift rounded-[14px] p-5">
                                        <div className="text-[28px] md:text-[32px] font-serif text-white mb-2">{metric.value}</div>
                                        <div className="text-[10px] uppercase tracking-[0.28em] text-white/65 mb-2">{metric.label}</div>
                                        <div className="text-[13px] leading-relaxed text-white/68">{metric.detail}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold bg-[#D6B25E] text-[#0B0B0C] btn-gold-hover hover:bg-[#E3C67C] transition-all duration-600 relative group cta-emerge cta-emerge-delay-1">
                                <span className="relative z-10">Begin Custom Design</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 duration-600" />
                            </Link>
                            <Link href="/shop" className="inline-flex items-center justify-center px-8 py-4 text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-semibold border border-white/14 text-white premium-hover-lift hover:bg-white/6 hover:border-[#D6B25E]/50 transition-all duration-600 relative group cta-emerge cta-emerge-delay-2">
                                <span className="relative z-10">Explore Collection</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-20 duration-600" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </AnimatedSection>

            {/* Section 2: Product Showcase (Featured Collection) */}
            <AnimatedSection 
                className="py-24 md:py-28 relative overflow-hidden story-section-frame"
                style={{ 
                    backgroundImage: "url('/images/black-silk.jpg')", 
                    backgroundSize: "cover", 
                    backgroundPosition: "center", 
                    backgroundRepeat: "no-repeat" 
                }}
            >
                {/* Dark overlay to enhance depth, luxury feel and text contrast */}
                <div className="absolute inset-0 bg-black/45 pointer-events-none" />
                
                <div className="container-custom relative z-10">
                    <FadeIn className="mb-12 md:mb-16 max-w-2xl reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E] mb-4">Featured Collection</span>
                        <h2 className="text-[36px] md:text-[52px] leading-[1.02] text-white reveal-step-2">
                            {assetsMap["text:featured-heading"] || "Signature pieces, hand-selected"}
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {featuredProducts.slice(0, 4).map((product, index) => {
                            // Use DB override image if admin set one, otherwise fall back to product images
                            const cardAssetKey = `featured-product-${index + 1}`;
                            const image = assetsMap[cardAssetKey] || selectCardImage(product.images, new Set(), "jewelry", index, product.id, product.name);
                            return (
                                <FadeIn key={product.id} delay={index * 0.08} className={`reveal-step-${Math.min(index + 1, 4)}`}>
                                    <Link href={`/product/${product.slug}`} className="group block h-full">
                                        <div className="luxury-shell premium-hover-lift overflow-hidden rounded-[20px] h-full">
                                            <div className="relative aspect-[4/5] overflow-hidden bg-[#0B0B0C] image-progressive-reveal">
                                                <SmartImage
                                                    src={image}
                                                    alt={product.name}
                                                    fill
                                                    fallbackType="jewelry"
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                                                <span className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.24em] font-bold text-[#D6B25E] opacity-0 group-hover:opacity-100 transition-opacity duration-500">View</span>
                                                {/* Admin: visual edit overlay for each product card */}
                                                {isAdmin && <VisualEditButton type="homepage" assetKey={cardAssetKey} />}
                                            </div>
                                            <div className="p-5 md:p-6">
                                                <h3 className="text-[16px] md:text-[18px] font-medium text-white line-clamp-1 mb-2 group-hover:text-[#D6B25E] transition-colors duration-500">{product.name}</h3>
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-[14px] text-white/66">Rs {Number(product.price).toLocaleString("en-IN")}</p>
                                                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#D6B25E]">View</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </AnimatedSection>

            <InteractiveCategoryGallery customImages={assetsMap} isAdmin={isAdmin} />

            {/* Section 3: Trust + Brand Authority */}
            <AnimatedSection className="py-24 md:py-28 bg-[#0B0B0C] story-section-frame">
                <div className="container-custom grid gap-8 lg:grid-cols-2 items-stretch">
                    <FadeIn className="luxury-panel premium-hover-lift rounded-[22px] p-8 md:p-10 reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E] mb-4 trust-badge-slide">Why Choose Us</span>
                        <h2 className="text-[34px] md:text-[46px] leading-[1.05] text-white mb-6 reveal-step-2">
                            {assetsMap["text:trust-heading"] || "Designed with certainty, delivered with care"}
                        </h2>
                        <p className="text-white/70 leading-[1.9] text-[16px] md:text-[17px] max-w-xl mb-8 reveal-step-3">
                            {assetsMap["text:trust-body"] || "Premium jewelry deserves a presentation that feels equally assured. Certified sourcing, insured delivery, and personal assistance guide every order."}
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { label: "Certified", value: "GIA / IGI" },
                                { label: "Delivery", value: "Insured" },
                                { label: "Support", value: "Personal" },
                            ].map((item, idx) => (
                                <FadeIn key={item.label} delay={idx * 0.1} className={`reveal-step-${Math.min(idx + 3, 5)}`}>
                                    <div className="rounded-[16px] border border-white/10 bg-white/4 p-4 premium-hover-lift cursor-pointer">
                                        <div className="text-[10px] uppercase tracking-[0.28em] text-white/55 mb-2">{item.label}</div>
                                        <div className="text-[18px] text-white">{item.value}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>

                    <FadeIn className="luxury-panel rounded-[22px] p-8 md:p-10 flex flex-col justify-between">
                        <div>
                            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E] mb-4">Testimonial</span>
                            <p className="text-[24px] md:text-[32px] leading-[1.35] text-white font-serif mb-8 max-w-xl">
                                “The presentation, the quiet confidence, and the craftsmanship felt closer to a private atelier than an online store.”
                            </p>
                        </div>
                        <div className="pt-8 border-t border-white/10 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-white text-[14px] uppercase tracking-[0.26em] mb-1">Client note</div>
                                <div className="text-white/58 text-[13px]">Luxury buyer feedback</div>
                            </div>
                            <Link href="/shop" className="inline-flex items-center justify-center px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold bg-white text-[#0B0B0C] hover:bg-[#D6B25E] btn-gold-hover transition-all duration-600 relative group">
                                <span className="relative z-10">Discover More</span>
                                <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-30 duration-600" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </AnimatedSection>

            {/* Section 4: Clear Call-to-Action Funnel */}
            <AnimatedSection className="py-24 md:py-32 bg-[#111113] story-section-frame">
                <div className="container-custom text-center max-w-4xl mx-auto">
                    <FadeIn className="reveal-step-1">
                        <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.34em] text-[#D6B25E] mb-5 reveal-step-1">Your Journey Starts Here</span>
                        <h2 className="text-[38px] md:text-[60px] leading-[1.02] text-white mb-6 reveal-step-2">
                            {assetsMap["text:cta-heading"] || "Three ways to find your perfect piece"}
                        </h2>
                        <p className="text-white/70 text-[16px] md:text-[18px] leading-[1.9] max-w-2xl mx-auto mb-12 reveal-step-3">
                            {assetsMap["text:cta-body"] || "Whether you're creating a custom ring, exploring certified diamonds, or browsing signature pieces, we've designed a calm, intentional journey for you."}
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
                                    <div className="luxury-panel premium-hover-lift rounded-[22px] p-8 h-full flex flex-col justify-between cursor-pointer">
                                        <div>
                                            <div className="text-[48px] font-serif text-[#D6B25E] mb-4 font-light">{item.step}</div>
                                            <h3 className="text-[22px] font-medium text-white mb-3">{item.title}</h3>
                                            <p className="text-white/70 text-[15px] leading-relaxed">{item.description}</p>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <span className="inline-block text-[12px] uppercase tracking-[0.2em] font-semibold text-[#D6B25E] group-hover:translate-x-1 transition-transform duration-300">
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
                        <Link href="/customizer/step-1-diamond" className="inline-flex items-center justify-center px-10 md:px-12 py-5 text-[13px] md:text-[14px] uppercase tracking-[0.2em] font-semibold bg-[#D6B25E] text-[#0B0B0C] btn-gold-hover hover:bg-[#E3C67C] transition-all duration-600 relative group shadow-[0_20px_48px_rgba(214,178,94,0.25)]">
                            <span className="relative z-10">Start Your Custom Ring</span>
                            <span className="absolute inset-0 shimmer-gold opacity-0 group-hover:opacity-40 duration-600 rounded" />
                        </Link>
                    </FadeIn>
                </div>
            </AnimatedSection>
            {isAdmin && <AdminStudio isAdmin={isAdmin} />}
        </div>
    );
}
