"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SmartImage } from "./SmartImage";
import { VisualEditButton } from "./VisualEditButton";

// Each shape: explicit id, iconKey, hoverKey — zero index-based mapping
const DIAMOND_SHAPES = [
    { id: "oval",              label: "Oval",              iconKey: "diamond-shape-icon-oval",              hoverKey: "diamond-shape-hover-oval",              href: "/customizer/step-1-diamond?shape=oval" },
    { id: "round",             label: "Round",             iconKey: "diamond-shape-icon-round",             hoverKey: "diamond-shape-hover-round",             href: "/customizer/step-1-diamond?shape=round" },
    { id: "emerald",           label: "Emerald",           iconKey: "diamond-shape-icon-emerald",           hoverKey: "diamond-shape-hover-emerald",           href: "/customizer/step-1-diamond?shape=emerald" },
    { id: "marquise",          label: "Marquise",          iconKey: "diamond-shape-icon-marquise",          hoverKey: "diamond-shape-hover-marquise",          href: "/customizer/step-1-diamond?shape=marquise" },
    { id: "radiant",           label: "Radiant",           iconKey: "diamond-shape-icon-radiant",           hoverKey: "diamond-shape-hover-radiant",           href: "/customizer/step-1-diamond?shape=radiant" },
    { id: "pear",              label: "Pear",              iconKey: "diamond-shape-icon-pear",              hoverKey: "diamond-shape-hover-pear",              href: "/customizer/step-1-diamond?shape=pear" },
    { id: "cushion",           label: "Cushion",           iconKey: "diamond-shape-icon-cushion",           hoverKey: "diamond-shape-hover-cushion",           href: "/customizer/step-1-diamond?shape=cushion" },
    { id: "heart",             label: "Heart",             iconKey: "diamond-shape-icon-heart",             hoverKey: "diamond-shape-hover-heart",             href: "/customizer/step-1-diamond?shape=heart" },
    { id: "princess",          label: "Princess",          iconKey: "diamond-shape-icon-princess",          hoverKey: "diamond-shape-hover-princess",          href: "/customizer/step-1-diamond?shape=princess" },
    { id: "asscher",           label: "Asscher",           iconKey: "diamond-shape-icon-asscher",           hoverKey: "diamond-shape-hover-asscher",           href: "/customizer/step-1-diamond?shape=asscher" },
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
    const router = useRouter();
    const [selectedShapeId, setSelectedShapeId] = useState<ShapeId>("oval");
    const [dbShapes, setDbShapes] = useState<any[]>([]);

    const handleShapeHover = (shapeId: ShapeId) => {
        console.log("Hovered shape:", shapeId);
        setSelectedShapeId(shapeId);
    };

    console.log("Selected shape:", selectedShapeId);

    useEffect(() => {
        const fetchShapes = async () => {
            try {
                const res = await fetch("/api/shapes");
                if (res.ok) {
                    const data = await res.json();
                    // Filter to keep only active shapes and exclude elongated-cushion shape
                    const active = data.filter((s: any) => s.isActive && s.slug !== "elongated-cushion");
                    setDbShapes(active);
                }
            } catch (err) {
                console.error("Failed to load shapes from DB", err);
            }
        };
        fetchShapes();
    }, []);

    const defaultMainImage = customImages[DEFAULT_MAIN_KEY] || DEFAULT_MAIN_IMAGE;

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

                        {/* Image container — multi-layer absolute crossfade for instant hovers */}
                        <div
                            className="relative w-full aspect-square overflow-hidden bg-white"
                            style={{ maxWidth: "520px" }}
                        >
                            {/* Admin: edit default main image */}
                            {isAdmin && (
                                <div className="absolute top-3 left-3 z-30">
                                    <VisualEditButton type="homepage" assetKey={DEFAULT_MAIN_KEY} />
                                </div>
                            )}

                            {/* Base fallback image */}
                            <div className="absolute inset-0" style={{ opacity: selectedShapeId ? 0 : 1, zIndex: 1 }}>
                                <SmartImage
                                    src={defaultMainImage}
                                    alt="Diamond Shape Default"
                                    fill
                                    fallbackType="jewelry"
                                    className="object-contain"
                                    priority
                                    sizes="(max-width:1440px) 40vw, 576px"
                                />
                            </div>

                            {/* Render a dedicated absolute overlay per shape for ZERO hover lag */}
                            {DIAMOND_SHAPES.map(shape => {
                                const dbShape = dbShapes.find(s => s.slug === shape.id);
                                const largeImageSrc = dbShape?.previewImageUrl || customImages[shape.id] || customImages[shape.hoverKey] || "/products/loose-diamond.jpg";

                                return (
                                    <div
                                        key={shape.id}
                                        className="absolute inset-0 transition-opacity duration-150 ease-out"
                                        style={{
                                            opacity: selectedShapeId === shape.id ? 1 : 0,
                                            zIndex: selectedShapeId === shape.id ? 2 : 1,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <SmartImage
                                            src={largeImageSrc}
                                            alt={`${shape.label} Shape Preview`}
                                            fill
                                            fallbackType="jewelry"
                                            className="object-contain"
                                            sizes="(max-width:1440px) 40vw, 576px"
                                            priority={shape.id === "oval"}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right 60%: Shape grid (Exactly 5 columns for 5+5 shapes) */}
                    <div 
                        className="flex-1" 
                        style={{ width: "60%" }}
                        onMouseLeave={() => setSelectedShapeId("oval")}
                    >
                        <div className="grid grid-cols-5 gap-x-4 gap-y-8">
                            {DIAMOND_SHAPES.map(shape => {
                                const dbShape = dbShapes.find(s => s.slug === shape.id);
                                const iconSrc = dbShape?.thumbnailImageUrl || customImages[shape.iconKey] || DEFAULT_ICON_IMAGE;
                                const isSelected = selectedShapeId === shape.id;

                                return (
                                    <button
                                        key={shape.id}
                                        type="button"
                                        onMouseEnter={() => handleShapeHover(shape.id)}
                                        onFocus={() => handleShapeHover(shape.id)}
                                        onClick={() => router.push(`/customizer/step-1-diamond?shape=${shape.id}`)}
                                        className="flex flex-col items-center gap-3 cursor-pointer border-none bg-transparent p-0 outline-none w-full"
                                        style={{ textDecoration: "none" }}
                                    >
                                        {/* Icon wrapper — scale + plain background with NO border and NO background color */}
                                        <div
                                            className="relative flex items-center justify-center"
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                borderRadius: "0px",
                                                border: "1px solid transparent",
                                                transform: isSelected ? "scale(1.08)" : "scale(1)",
                                                transition: "transform 0.3s ease",
                                                backgroundColor: "transparent",
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
                                            {isAdmin && isSelected && (
                                                <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.75)", transformOrigin: "top left" }}>
                                                    <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Label — minimal active color state */}
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                color: isSelected ? "#111" : "#666",
                                                fontWeight: isSelected ? 500 : 400,
                                                lineHeight: 1.3,
                                                transition: "color 0.3s ease, font-weight 0.3s ease",
                                                textAlign: "center",
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

                {/* ── MOBILE LAYOUT: swipe slider only, no preview image ── */}
                <div className="md:hidden">
                    <h2
                        className="font-serif text-[#1A1A1A] text-center"
                        style={{ fontSize: "22px", fontWeight: 400, marginBottom: "24px" }}
                    >
                        Shop Diamonds{" "}
                        <span style={{ fontStyle: "italic" }}>by Shape</span>
                    </h2>

                    {/* 3-column Grid for mobile shapes layout */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-6 text-center">
                        {DIAMOND_SHAPES.map(shape => {
                            const dbShape = dbShapes.find(s => s.slug === shape.id);
                            const iconSrc = dbShape?.thumbnailImageUrl || customImages[shape.iconKey] || DEFAULT_ICON_IMAGE;
                            return (
                                <button
                                    key={shape.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedShapeId(shape.id);
                                        router.push(shape.href);
                                    }}
                                    className="flex flex-col items-center border-none bg-transparent p-0 outline-none w-full"
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className="relative flex items-center justify-center" style={{ width: "72px", height: "72px" }}>
                                        <div className="relative" style={{ width: "54px", height: "54px" }}>
                                            <SmartImage
                                                src={iconSrc}
                                                alt={shape.label}
                                                fill
                                                fallbackType="diamond"
                                                className="object-contain"
                                                sizes="54px"
                                            />
                                        </div>
                                        {isAdmin && (
                                            <div className="absolute top-0 left-0 z-20" style={{ transform: "scale(0.7)", transformOrigin: "top left" }}>
                                                <VisualEditButton type="homepage" assetKey={shape.iconKey} />
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            marginTop: "6px",
                                            color: "#1A1A1A",
                                            whiteSpace: "nowrap",
                                            display: "block",
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
        </section>
    );
}
