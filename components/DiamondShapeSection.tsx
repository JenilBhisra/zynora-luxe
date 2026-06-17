"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";

const DIAMOND_SHAPES = [
    { id: "oval",               label: "Oval",               iconKey: "diamond-shape-icon-oval",               hoverKey: "diamond-shape-hover-oval",               defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=oval" },
    { id: "round",              label: "Round",              iconKey: "diamond-shape-icon-round",              hoverKey: "diamond-shape-hover-round",              defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=round" },
    { id: "emerald",            label: "Emerald",            iconKey: "diamond-shape-icon-emerald",            hoverKey: "diamond-shape-hover-emerald",            defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=emerald" },
    { id: "marquise",           label: "Marquise",           iconKey: "diamond-shape-icon-marquise",           hoverKey: "diamond-shape-hover-marquise",           defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=marquise" },
    { id: "radiant",            label: "Radiant",            iconKey: "diamond-shape-icon-radiant",            hoverKey: "diamond-shape-hover-radiant",            defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=radiant" },
    { id: "pear",               label: "Pear",               iconKey: "diamond-shape-icon-pear",               hoverKey: "diamond-shape-hover-pear",               defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=pear" },
    { id: "elongated-cushion",  label: "Elongated Cushion",  iconKey: "diamond-shape-icon-elongated-cushion",  hoverKey: "diamond-shape-hover-elongated-cushion",  defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=elongated-cushion" },
    { id: "cushion",            label: "Cushion",            iconKey: "diamond-shape-icon-cushion",            hoverKey: "diamond-shape-hover-cushion",            defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=cushion" },
    { id: "princess",           label: "Princess",           iconKey: "diamond-shape-icon-princess",           hoverKey: "diamond-shape-hover-princess",           defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=princess" },
    { id: "asscher",            label: "Asscher",            iconKey: "diamond-shape-icon-asscher",            hoverKey: "diamond-shape-hover-asscher",            defaultIcon: "/products/loose-diamond.jpg",  href: "/diamonds?shape=asscher" },
];

const DEFAULT_MAIN_KEY = "diamond-shape-main-image";
const DEFAULT_MAIN_IMAGE = "/products/ring-2.jpg";

interface DiamondShapeSectionProps {
    customImages?: Record<string, string>;
    isAdmin?: boolean;
}

export function DiamondShapeSection({ customImages = {}, isAdmin = false }: DiamondShapeSectionProps) {
    const [hoveredShape, setHoveredShape] = useState<string | null>(null);
    const [activeShape, setActiveShape] = useState<string | null>(null); // for mobile tap

    const defaultMainImage = customImages[DEFAULT_MAIN_KEY] || DEFAULT_MAIN_IMAGE;

    const handleShapeClick = (shapeId: string) => {
        // Mobile: toggle active shape
        setActiveShape(prev => prev === shapeId ? null : shapeId);
    };

    return (
        <section
            id="shop-diamonds-by-shape"
            className="w-full bg-white"
            style={{ paddingTop: "80px", paddingBottom: "80px" }}
        >
            <div className="mx-auto max-w-[1440px] px-6 md:px-12">
                {/* ── DESKTOP LAYOUT ── */}
                <div className="hidden md:flex items-center gap-10 lg:gap-16">
                    {/* Left: Main Image Area (40%) */}
                    <div className="flex flex-col items-start" style={{ width: "40%" }}>
                        <h2
                            className="font-serif text-[#1A1A1A] mb-8"
                            style={{ fontSize: "clamp(28px, 2.4vw, 40px)", fontWeight: 400, letterSpacing: "0.01em" }}
                        >
                            Shop Diamonds{" "}
                            <span style={{ fontStyle: "italic", color: "#1A1A1A" }}>by Shape</span>
                        </h2>
                        <div
                            className="relative w-full overflow-hidden"
                            style={{ maxWidth: "520px", aspectRatio: "1/1" }}
                        >
                            {/* Admin edit button for default main image */}
                            {isAdmin && (
                                <div className="absolute top-3 left-3 z-20">
                                    <VisualEditButton type="homepage" assetKey={DEFAULT_MAIN_KEY} />
                                </div>
                            )}
                            {/* Smooth crossfade between images */}
                            <div className="relative w-full h-full">
                                {/* Default image always shown as base */}
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
                                {/* Hover image fades in on top */}
                                {DIAMOND_SHAPES.map(shape => {
                                    const hoverImg = customImages[shape.hoverKey] || defaultMainImage;
                                    const isActive = hoveredShape === shape.id;
                                    return (
                                        <div
                                            key={shape.id}
                                            className="absolute inset-0 transition-opacity duration-500"
                                            style={{ opacity: isActive ? 1 : 0, pointerEvents: "none" }}
                                        >
                                            <SmartImage
                                                src={hoverImg}
                                                alt={shape.label}
                                                fill
                                                fallbackType="jewelry"
                                                className="object-contain"
                                                sizes="(max-width:1440px) 40vw, 576px"
                                            />
                                            {/* Admin edit button for each hover image */}
                                            {isAdmin && isActive && (
                                                <div className="absolute top-3 left-3 z-20">
                                                    <VisualEditButton type="homepage" assetKey={shape.hoverKey} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Shape Grid (60%) — 5 cols × 2 rows */}
                    <div className="flex-1" style={{ width: "60%" }}>
                        <div
                            className="grid"
                            style={{ gridTemplateColumns: "repeat(5, 1fr)", rowGap: "32px", columnGap: "16px" }}
                        >
                            {DIAMOND_SHAPES.map(shape => {
                                const iconSrc = customImages[shape.iconKey] || shape.defaultIcon;
                                const isHovered = hoveredShape === shape.id;
                                return (
                                    <Link
                                        key={shape.id}
                                        href={shape.href}
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                        onMouseEnter={() => setHoveredShape(shape.id)}
                                        onMouseLeave={() => setHoveredShape(null)}
                                    >
                                        <div
                                            className="relative overflow-hidden transition-transform duration-300 group-hover:scale-110"
                                            style={{ width: "90px", height: "90px", position: "relative" }}
                                        >
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain transition-all duration-300"
                                                sizes="90px"
                                            />
                                            {/* Admin edit for icon */}
                                            {isAdmin && isHovered && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.8)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            className="text-center transition-colors duration-300 font-sans"
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

                {/* ── MOBILE LAYOUT: horizontal scrollable slider ── */}
                <div className="md:hidden">
                    <h2
                        className="font-serif text-[#1A1A1A] text-center mb-6"
                        style={{ fontSize: "28px", fontWeight: 400 }}
                    >
                        Shop Diamonds{" "}
                        <span style={{ fontStyle: "italic" }}>by Shape</span>
                    </h2>

                    {/* Main image - changes on tap */}
                    <div
                        className="relative mx-auto mb-6 overflow-hidden"
                        style={{ width: "100%", maxWidth: "340px", aspectRatio: "1/1" }}
                    >
                        {/* Default base */}
                        <div className="absolute inset-0">
                            <SmartImage
                                src={defaultMainImage}
                                alt="Diamond"
                                fill
                                fallbackType="jewelry"
                                className="object-contain"
                                sizes="340px"
                            />
                        </div>
                        {/* Active shape image */}
                        {DIAMOND_SHAPES.map(shape => {
                            const hoverImg = customImages[shape.hoverKey] || defaultMainImage;
                            const isActive = activeShape === shape.id;
                            return (
                                <div
                                    key={shape.id}
                                    className="absolute inset-0 transition-opacity duration-500"
                                    style={{ opacity: isActive ? 1 : 0, pointerEvents: "none" }}
                                >
                                    <SmartImage
                                        src={hoverImg}
                                        alt={shape.label}
                                        fill
                                        fallbackType="jewelry"
                                        className="object-contain"
                                        sizes="340px"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Horizontal scrollable shape slider */}
                    <div
                        className="overflow-x-auto pb-4 -mx-6 px-6"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        <style>{`.diamond-shape-scroll::-webkit-scrollbar{display:none}`}</style>
                        <div
                            className="diamond-shape-scroll flex gap-5"
                            style={{ width: "max-content" }}
                        >
                            {DIAMOND_SHAPES.map(shape => {
                                const iconSrc = customImages[shape.iconKey] || shape.defaultIcon;
                                const isActive = activeShape === shape.id;
                                return (
                                    <button
                                        key={shape.id}
                                        onClick={() => handleShapeClick(shape.id)}
                                        className="flex flex-col items-center gap-2 flex-shrink-0"
                                        style={{ outline: "none", background: "none", border: "none", padding: 0 }}
                                    >
                                        <div
                                            className="relative overflow-hidden transition-transform duration-300"
                                            style={{
                                                width: "70px",
                                                height: "70px",
                                                transform: isActive ? "scale(1.1)" : "scale(1)",
                                                position: "relative"
                                            }}
                                        >
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain"
                                                sizes="70px"
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: isActive ? "#C9A14A" : "#1A1A1A",
                                                fontWeight: isActive ? 600 : 400,
                                                transition: "color 0.3s",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {shape.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
