"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";

// Each shape has an explicit id, iconKey, and hoverKey — no index-based mapping
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

// Build a lookup map: shapeId → hoverKey (explicit, no index math)
const SHAPE_MAP: Record<ShapeId, { iconKey: string; hoverKey: string; label: string; href: string }> = 
    Object.fromEntries(
        DIAMOND_SHAPES.map(s => [s.id, { iconKey: s.iconKey, hoverKey: s.hoverKey, label: s.label, href: s.href }])
    ) as Record<ShapeId, { iconKey: string; hoverKey: string; label: string; href: string }>;

const DEFAULT_MAIN_KEY   = "diamond-shape-main-image";
const DEFAULT_MAIN_IMAGE = "/products/ring-2.jpg";
const DEFAULT_ICON_IMAGE = "/products/loose-diamond.jpg";

interface DiamondShapeSectionProps {
    customImages?: Record<string, string>;
    isAdmin?: boolean;
}

export function DiamondShapeSection({ customImages = {}, isAdmin = false }: DiamondShapeSectionProps) {
    // Desktop only: which shape is hovered (null = show default image)
    const [hoveredShapeId, setHoveredShapeId] = useState<ShapeId | null>(null);

    const defaultMainImage = customImages[DEFAULT_MAIN_KEY] || DEFAULT_MAIN_IMAGE;

    // Desktop: use hovered shape's hoverKey for the correct image src (explicit lookup, no index)
    const desktopMainSrc: string = hoveredShapeId
        ? (customImages[SHAPE_MAP[hoveredShapeId].hoverKey] || defaultMainImage)
        : defaultMainImage;

    // Which admin hover-image edit key to expose when a shape is hovered
    const activeAdminHoverKey: string | null = hoveredShapeId
        ? SHAPE_MAP[hoveredShapeId].hoverKey
        : null;

    return (
        <section
            id="shop-diamonds-by-shape"
            className="w-full bg-white"
            style={{ paddingTop: "80px", paddingBottom: "80px" }}
        >
            <div className="mx-auto max-w-[1440px] px-6 md:px-12">

                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden md:flex items-center gap-10 lg:gap-16">

                    {/* Left 40%: single main image that swaps src on hover */}
                    <div className="flex flex-col items-start" style={{ width: "40%" }}>
                        <h2
                            className="font-serif text-[#1A1A1A] mb-8"
                            style={{ fontSize: "clamp(28px, 2.4vw, 40px)", fontWeight: 400, letterSpacing: "0.01em" }}
                        >
                            Shop Diamonds{" "}
                            <span style={{ fontStyle: "italic" }}>by Shape</span>
                        </h2>

                        {/* Single image container — src changes directly */}
                        <div
                            className="relative w-full overflow-hidden"
                            style={{ maxWidth: "520px", aspectRatio: "1/1" }}
                        >
                            {/* Admin: edit default main image (shown when nothing is hovered) */}
                            {isAdmin && !hoveredShapeId && (
                                <div className="absolute top-3 left-3 z-30">
                                    <VisualEditButton type="homepage" assetKey={DEFAULT_MAIN_KEY} />
                                </div>
                            )}
                            {/* Admin: edit the specific hovered shape's hover image */}
                            {isAdmin && hoveredShapeId && activeAdminHoverKey && (
                                <div className="absolute top-3 left-3 z-30">
                                    <VisualEditButton type="homepage" assetKey={activeAdminHoverKey} />
                                </div>
                            )}

                            {/*
                             * ONE SmartImage — src is directly set to the correct image.
                             * Oval hover → diamond-shape-hover-oval  (via SHAPE_MAP["oval"].hoverKey)
                             * Round hover → diamond-shape-hover-round (via SHAPE_MAP["round"].hoverKey)
                             * No index, no array offset, no stacking layers.
                             */}
                            <SmartImage
                                key={desktopMainSrc}   /* key forces remount → clean image swap */
                                src={desktopMainSrc}
                                alt={hoveredShapeId ? SHAPE_MAP[hoveredShapeId].label : "Diamond Shape"}
                                fill
                                fallbackType="jewelry"
                                className="object-contain transition-opacity duration-400"
                                priority
                                sizes="(max-width:1440px) 40vw, 576px"
                            />
                        </div>
                    </div>

                    {/* Right 60%: shape grid — 5 cols × 2 rows */}
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
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                        onMouseEnter={() => setHoveredShapeId(shape.id)}
                                        onMouseLeave={() => setHoveredShapeId(null)}
                                    >
                                        {/* Shape icon */}
                                        <div
                                            className="relative transition-transform duration-300 group-hover:scale-110"
                                            style={{ width: "90px", height: "90px", position: "relative" }}
                                        >
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain"
                                                sizes="90px"
                                            />
                                            {/* Admin edit button for shape icon */}
                                            {isAdmin && isHovered && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.8)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Shape label */}
                                        <span
                                            className="text-center font-sans transition-colors duration-300"
                                            style={{
                                                fontSize: "16px",
                                                color: isHovered ? "#C9A14A" : "#1A1A1A",
                                                fontWeight: 400,
                                                lineHeight: 1.3,
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

                {/* ── MOBILE LAYOUT: swipe slider only, no preview image ── */}
                <div className="md:hidden" style={{ paddingTop: "0", paddingBottom: "0" }}>
                    {/* Title */}
                    <h2
                        className="font-serif text-[#1A1A1A] text-center"
                        style={{ fontSize: "22px", fontWeight: 400, marginBottom: "24px" }}
                    >
                        Shop Diamonds{" "}
                        <span style={{ fontStyle: "italic" }}>by Shape</span>
                    </h2>

                    {/* Horizontal finger-swipe slider — NO preview image */}
                    <div
                        className="overflow-x-auto"
                        style={{
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
                        <style>{`.ds-mobile-scroll::-webkit-scrollbar{display:none}`}</style>
                        <div
                            className="ds-mobile-scroll flex"
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
                                        {/* Shape icon */}
                                        <div
                                            className="relative"
                                            style={{ width: "64px", height: "64px", position: "relative" }}
                                        >
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain"
                                                sizes="64px"
                                            />
                                            {/* Admin edit for shape icon */}
                                            {isAdmin && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.7)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>
                                        {/* Label */}
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
