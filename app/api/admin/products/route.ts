/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

function generateKeywords(name: string, categoryName: string, metalType: string) {
    const keywords = new Set<string>();
    
    const normalizedName = name.toLowerCase();
    const normalizedCat = categoryName.toLowerCase();
    
    keywords.add(normalizedCat);
    
    // Split name words
    const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
    nameWords.forEach(w => keywords.add(w));
    
    // Auto shapes
    const shapes = ["round", "oval", "princess", "emerald", "cushion", "marquise", "pear", "radiant", "asscher", "heart"];
    shapes.forEach(s => {
        if (normalizedName.includes(s)) {
            keywords.add(s);
            keywords.add(`${s} ring`);
            keywords.add(`${s} diamond ring`);
        }
    });

    // Auto metal
    if (metalType) {
        const mt = metalType.toLowerCase();
        keywords.add(mt);
        if (mt.includes("gold")) {
            keywords.add("gold ring");
            keywords.add("gold jewelry");
        } else if (mt.includes("platinum")) {
            keywords.add("platinum ring");
            keywords.add("platinum jewelry");
        }
    }
    
    // Auto stone
    if (normalizedName.includes("lab grown") || normalizedName.includes("lab-grown")) {
        keywords.add("lab grown diamond");
        keywords.add("lab grown diamond ring");
        keywords.add("lab grown");
    } else if (normalizedName.includes("natural")) {
        keywords.add("natural diamond");
        keywords.add("natural diamond ring");
    }
    
    // Category synonyms
    if (normalizedCat.includes("ring")) {
        keywords.add("ring");
        if (normalizedCat.includes("engagement")) {
            keywords.add("engagement ring");
            keywords.add("proposal ring");
            keywords.add("bridal ring");
            keywords.add("wedding ring");
        }
    } else if (normalizedCat.includes("pendant")) {
        keywords.add("pendant");
        keywords.add("necklace");
        keywords.add("diamond pendant");
    } else if (normalizedCat.includes("bracelet")) {
        keywords.add("bracelet");
        keywords.add("bangle");
    } else if (normalizedCat.includes("earring")) {
        keywords.add("earring");
        keywords.add("studs");
        keywords.add("diamond earrings");
    } else if (normalizedCat.includes("necklace")) {
        keywords.add("necklace");
        keywords.add("diamond necklace");
    }
    
    return Array.from(keywords);
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // Need to find category by name/slug handling since Prisma requires ID
        let category = await prisma.category.findUnique({ where: { name: body.categoryId } });
        if (!category) {
            // Lazy create category if it doesn't exist
            category = await prisma.category.create({
                data: {
                    name: body.categoryId,
                    slug: body.categoryId.toLowerCase().replace(/\s+/g, '-')
                }
            });
        }

        const autoKeywordsList = generateKeywords(body.name, category.name, body.metalType);
        const extraKeywordsArray = body.extraKeywords 
            ? body.extraKeywords.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean)
            : [];
        const mergedKeywords = Array.from(new Set([...autoKeywordsList, ...extraKeywordsArray]));
        const searchKeywordsString = mergedKeywords.join(", ");

        const newProduct = await prisma.product.create({
            data: {
                name: body.name,
                slug: body.name.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4),
                description: body.description,
                price: parseFloat(body.price),
                categoryId: category.id,
                metalType: body.metalType,
                stockCount: parseInt(body.stockCount) || 1,
                images: body.images || "[]",
                karatPrices: body.karatPrices || "{}",
                availableMetals: body.availableMetals || "",
                goldPrice: body.goldPrice !== undefined && body.goldPrice !== null ? parseFloat(body.goldPrice) : null,
                silverPrice: body.silverPrice !== undefined && body.silverPrice !== null ? parseFloat(body.silverPrice) : null,
                platinumPrice: body.platinumPrice !== undefined && body.platinumPrice !== null ? parseFloat(body.platinumPrice) : null,
                tags: body.tags || "",
                extraKeywords: body.extraKeywords || "",
                searchKeywords: searchKeywordsString,
                seoTitle: body.seoTitle || "",
                seoDescription: body.seoDescription || ""
            },
            include: { category: true }
        });

        return NextResponse.json({ success: true, product: newProduct });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const body = await req.json();
        const updateData: any = {};
        
        if (body.name !== undefined) {
            updateData.name = body.name;
            updateData.slug = body.name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-') + '-' + id.slice(-4);
        }
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.metalType !== undefined) updateData.metalType = body.metalType;
        if (body.stockCount !== undefined) updateData.stockCount = parseInt(body.stockCount) || 1;
        if (body.images !== undefined) updateData.images = body.images;
        if (body.karatPrices !== undefined) updateData.karatPrices = body.karatPrices;
        
        if (body.availableMetals !== undefined) updateData.availableMetals = body.availableMetals;
        if (body.goldPrice !== undefined) updateData.goldPrice = body.goldPrice !== null ? parseFloat(body.goldPrice) : null;
        if (body.silverPrice !== undefined) updateData.silverPrice = body.silverPrice !== null ? parseFloat(body.silverPrice) : null;
        if (body.platinumPrice !== undefined) updateData.platinumPrice = body.platinumPrice !== null ? parseFloat(body.platinumPrice) : null;

        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
        if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
        if (body.extraKeywords !== undefined) updateData.extraKeywords = body.extraKeywords;

        if (body.categoryId !== undefined) {
            let category = await prisma.category.findUnique({ where: { name: body.categoryId } });
            if (!category) {
                category = await prisma.category.create({
                    data: {
                        name: body.categoryId,
                        slug: body.categoryId.toLowerCase().replace(/\s+/g, '-')
                    }
                });
            }
            updateData.categoryId = category.id;
        }

        const currentProduct = await prisma.product.findUnique({ where: { id }, include: { category: true } });
        if (currentProduct) {
            const finalName = body.name !== undefined ? body.name : currentProduct.name;
            const finalMetal = body.metalType !== undefined ? body.metalType : currentProduct.metalType;
            let finalCategoryName = currentProduct.category.name;
            if (body.categoryId !== undefined) {
                const newCat = await prisma.category.findUnique({ where: { name: body.categoryId } });
                if (newCat) finalCategoryName = newCat.name;
            }
            const finalExtra = body.extraKeywords !== undefined ? body.extraKeywords : (currentProduct.extraKeywords || "");

            const autoKeywordsList = generateKeywords(finalName, finalCategoryName, finalMetal);
            const extraKeywordsArray = finalExtra
                ? finalExtra.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean)
                : [];
            const mergedKeywords = Array.from(new Set([...autoKeywordsList, ...extraKeywordsArray]));
            updateData.searchKeywords = mergedKeywords.join(", ");
        }

        const product = await prisma.product.update({ where: { id }, data: updateData, include: { category: true } });
        return NextResponse.json({ success: true, product });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "ID req" }, { status: 400 });

        // Delete associated files on disk
        const { deleteUploadedFiles } = await import("@/lib/file-cleanup");
        const existing = await prisma.product.findUnique({ where: { id } });
        if (existing) {
            await deleteUploadedFiles(existing.images);
        }

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
