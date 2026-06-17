"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";

// Each shape: explicit id, iconKey, hoverKey — zero index-based mapping
const DIAMOND_SHAPES = [
    { id: "oval",              label: "Oval",              iconKey: "diamond-shape-icon-oval",              hoverKey: "diamond-shape-hover-oval",              href: "/diamonds?shape=oval" },
    { id: "round",             label: "Round",             iconKey: "diamond-shape-icon-round",             hoverKey: "diamond-shape-hover-round",             href: "/diamonds?shape=round" },
    { id: "emerald",           label: "Emerald",           iconKey: "diamond-shape-icon-emerald",           hoverKey: "diamond-shape-hover-emerald",           href: "/diamonds?shape=emerald" },
    { id: "marquise",          label: "Marquise",          iconKey: "diamond-shape-icon-marquise",          hoverKey: "diamond-shape-hover-marquise",          href: "/diamonds?shape=marquise" },
    { id: "radiant",           label: "Radiant",           iconKey: "diamond-shape-icon-radiant",           hoverKey: "diamond-shape-hover-radiant",           href: "/diamonds?shape=radiant" },
    { id: "pear",              label: "Pear",              iconKey: "diamond-shape-icon-pear",              hoverKey: "diamond-shape-hover-pear",              href: "/diamonds?shape=pear" },
    { id: "elongated-cushion", label: "Elongated Cushion", iconKey: "diamond-shape-icon-elongated-cushion", hoverKey: "diamond-shape-hover-elongated-cushion", href: "/diamonds?shape=elongated-cushion" },
    { id: "cushion",           label: "Cushion",           iconKey: "diamond-shape-icon-cushion",           hoverKey: "diamond-shape-hover-cushion",           href: "/diamonds?shape=cushion" },
    { id: "princess",          label: "Princess",          iconKey: "diamond-shape-icon-princess",          hoverKey: "diamond-shape-hover-princess",          href: "/diamonds?shape=princess" },
    { id: "asscher",           label: "Asscher",           iconKey: "diamond-shape-icon-asscher",           hoverKey: "diamond-shape-hover-asscher",           href: "/diamonds?shape=asscher" },
] as const;

type ShapeId = typeof DIAMOND_SHAPES[number]["id"];

const DEFAULT_MAIN_KEY   = "diamond-shape-main-image";
const DEFAULT_MAIN_IMAGE = "/products/ring-2.jpg";
const DEFAULT_ICON_IMAGE = "/products/loose-diamond.jpg";

interface DiamondShapeSectionProps {
    customImages?: Record<string, string>;
    isAdmin?: boolean;
}

export function DiamondShapeSection({ customImages = {}, isAdmin = false }: DiamondShapeSectionProps) {
    const [hoveredShapeId, setHoveredShapeId] = useState<ShapeId | null>(null);

    const defaultMainImage = customImages[DEFAULT_MAIN_KEY] || DEFAULT_MAIN_IMAGE;

    // The CURRENT hover image src — explicit key lookup, zero index math
    const hoveredShape     = hoveredShapeId ? DIAMOND_SHAPES.find(s => s.id === hoveredShapeId) : null;
    const hoveredHoverSrc  = hoveredShape ? (customImages[hoveredShape.hoverKey] || null) : null;

    // Only show the overlay when a custom hover image is actually available
    const showHoverOverlay = !!(hoveredShapeId && hoveredHoverSrc);

    return (
        <section
            id="shop-diamonds-by-shape"
            className="w-full bg-white"
            style={{ paddingTop: "80px", paddingBottom: "80px" }}
        >
            <div className="mx-auto max-w-[1440px] px-6 md:px-12">

                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden md:flex items-center gap-10 lg:gap-16">

                    {/* Left 40%: image area with smooth crossfade */}
                    <div className="flex flex-col items-start" style={{ width: "40%" }}>
                        <h2
                            className="font-serif text-[#1A1A1A] mb-8"
                            style={{ fontSize: "clamp(28px, 2.4vw, 40px)", fontWeight: 400, letterSpacing: "0.01em" }}
                        >
                            Shop Diamonds{" "}
                            <span style={{ fontStyle: "italic" }}>by Shape</span>
                        </h2>

                        {/* Image container — two layers for smooth crossfade */}
                        <div
                            className="relative w-full overflow-hidden"
                            style={{ maxWidth: "520px", aspectRatio: "1/1" }}
                        >
                            {/* Admin: edit default main image */}
                            {isAdmin && !hoveredShapeId && (
                                <div className="absolute top-3 left-3 z-30">
                                    <VisualEditButton type="homepage" assetKey={DEFAULT_MAIN_KEY} />
                                </div>
                            )}
                            {/* Admin: edit the hovered shape's hover image */}
                            {isAdmin && hoveredShape && (
                                <div className="absolute top-3 left-3 z-30">
                                    <VisualEditButton type="homepage" assetKey={hoveredShape.hoverKey} />
                                </div>
                            )}

                            {/*
                             * LAYER 1 — Default image, always visible underneath.
                             * Never unmounts. No key change. Smooth.
                             */}
                            <div className="absolute inset-0">
                                <SmartImage
                                    src={defaultMainImage}
                                    alt="Diamond Shape"
                                    fill
                                    fallbackType="jewelry"
                                    className="object-contain"
                                    priority
                                    sizes="(max-width:1440px) 40vw, 576px"
                                />
                            </div>

                            {/*
                             * LAYER 2 — ONE hover overlay per hovered shape.
                             * Only shown when a custom image exists for that shape.
                             * Fades in with CSS opacity transition.
                             * No 10-layer stacking. No index. Explicit key lookup.
                             *
                             * Oval hover    → customImages["diamond-shape-hover-oval"]
                             * Round hover   → customImages["diamond-shape-hover-round"]
                             * Emerald hover → customImages["diamond-shape-hover-emerald"]
                             * ...etc
                             */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    opacity: showHoverOverlay ? 1 : 0,
                                    transition: "opacity 0.45s ease",
                                    pointerEvents: "none",
                                }}
                            >
                                {hoveredHoverSrc && (
                                    <SmartImage
                                        src={hoveredHoverSrc}
                                        alt={hoveredShape?.label ?? "Diamond"}
                                        fill
                                        fallbackType="jewelry"
                                        className="object-contain"
                                        sizes="(max-width:1440px) 40vw, 576px"
                                    />
                                )}
                            </div>

                            {/*
                             * VISUAL HOVER INDICATOR — gold ring + scale pulse on the image
                             * container itself, so the user sees feedback even before
                             * custom images are uploaded.
                             */}
                            <div
                                className="absolute inset-0 rounded pointer-events-none"
                                style={{
                                    boxShadow: hoveredShapeId
                                        ? "inset 0 0 0 2px #C9A14A"
                                        : "inset 0 0 0 0px transparent",
                                    transition: "box-shadow 0.3s ease",
                                }}
                            />
                        </div>
                    </div>

                    {/* Right 60%: 5 × 2 shape grid */}
                    <div className="flex-1" style={{ width: "60%" }}>
                        <div
                            className="grid"
                            style={{ gridTemplateColumns: "repeat(5, 1fr)", rowGap: "32px", columnGap: "16px" }}
                        >
                            {DIAMOND_SHAPES.map(shape => {
                                const iconSrc  = customImages[shape.iconKey] || DEFAULT_ICON_IMAGE;
                                const isHovered = hoveredShapeId === shape.id;

                                return (
                                    <Link
                                        key={shape.id}
                                        href={shape.href}
                                        className="flex flex-col items-center gap-3 cursor-pointer"
                                        onMouseEnter={() => setHoveredShapeId(shape.id)}
                                        onMouseLeave={() => setHoveredShapeId(null)}
                                        style={{ textDecoration: "none" }}
                                    >
                                        {/* Icon wrapper — scale + gold ring on hover */}
                                        <div
                                            className="relative flex items-center justify-center"
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                borderRadius: "50%",
                                                border: isHovered ? "2px solid #C9A14A" : "2px solid transparent",
                                                transform: isHovered ? "scale(1.12)" : "scale(1)",
                                                transition: "transform 0.3s ease, border-color 0.3s ease",
                                                backgroundColor: isHovered ? "#FDF9F2" : "transparent",
                                            }}
                                        >
                                            <div className="relative" style={{ width: "64px", height: "64px" }}>
                                                <SmartImage
                                                    src={iconSrc}
                                                    alt={shape.label}
                                                    fill
                                                    fallbackType="diamond"
                                                    className="object-contain"
                                                    sizes="64px"
                                                />
                                            </div>

                                            {/* Admin edit button for icon */}
                                            {isAdmin && isHovered && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.75)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Label — gold on hover */}
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                color: isHovered ? "#C9A14A" : "#1A1A1A",
                                                fontWeight: isHovered ? 500 : 400,
                                                lineHeight: 1.3,
                                                transition: "color 0.3s ease, font-weight 0.3s ease",
                                                textAlign: "center",
                                            }}
                                        >
                                            {shape.label}
                                        </span>

                                        {/* Gold underline indicator */}
                                        <div
                                            style={{
                                                height: "2px",
                                                width: isHovered ? "32px" : "0px",
                                                backgroundColor: "#C9A14A",
                                                borderRadius: "1px",
                                                transition: "width 0.3s ease",
                                                marginTop: "-8px",
                                            }}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── MOBILE LAYOUT: swipe slider only, no preview image ── */}
                <div className="md:hidden">
                    <h2
                        className="font-serif text-[#1A1A1A] text-center"
                        style={{ fontSize: "22px", fontWeight: 400, marginBottom: "24px" }}
                    >
                        Shop Diamonds{" "}
                        <span style={{ fontStyle: "italic" }}>by Shape</span>
                    </h2>

                    {/* Horizontal finger-swipe slider */}
                    <div
                        style={{
                            overflowX: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                            scrollSnapType: "x mandatory",
                            paddingBottom: "8px",
                            marginLeft: "-24px",
                            marginRight: "-24px",
                            paddingLeft: "20px",
                            paddingRight: "20px",
                        }}
                    >
                        <style>{`.ds-mobile::-webkit-scrollbar{display:none}`}</style>
                        <div
                            className="ds-mobile flex"
                            style={{ gap: "28px", width: "max-content" }}
                        >
                            {DIAMOND_SHAPES.map(shape => {
                                const iconSrc = customImages[shape.iconKey] || DEFAULT_ICON_IMAGE;
                                return (
                                    <Link
                                        key={shape.id}
                                        href={shape.href}
                                        className="flex flex-col items-center flex-shrink-0"
                                        style={{
                                            minWidth: "72px",
                                            flex: "0 0 auto",
                                            scrollSnapAlign: "center",
                                            textAlign: "center",
                                            textDecoration: "none",
                                        }}
                                    >
                                        <div className="relative" style={{ width: "64px", height: "64px" }}>
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain"
                                                sizes="64px"
                                            />
                                            {isAdmin && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.7)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                marginTop: "8px",
                                                color: "#1A1A1A",
                                                whiteSpace: "nowrap",
                                                display: "block",
                                            }}
                                        >
                                            {shape.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
