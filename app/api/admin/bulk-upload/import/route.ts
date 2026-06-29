import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function cleanAndValidateSku(skuInput: any) {
    if (!skuInput) return { error: "SKU is required" };
    const cleaned = String(skuInput).trim().toUpperCase();
    if (cleaned === "") return { error: "SKU is required" };
    if (!/^[A-Z0-9-]+$/.test(cleaned)) {
        return { error: "SKU must contain only letters, numbers, and hyphens" };
    }
    return { sku: cleaned };
}

function normalizeKeys(row: any): Record<string, any> {
    const res: Record<string, any> = {};
    for (const key of Object.keys(row)) {
        const normKey = key.trim().toLowerCase().replace(/[\s_-]/g, "");
        res[normKey] = row[key];
    }
    return res;
}

function buildMediaJson(imageUrlsStr?: string, videoUrlsStr?: string) {
    const list: { url: string; type: "image" | "video" }[] = [];
    if (imageUrlsStr) {
        imageUrlsStr.split(",").map(u => u.trim()).filter(Boolean).forEach(url => {
            list.push({ url, type: "image" });
        });
    }
    if (videoUrlsStr) {
        videoUrlsStr.split(",").map(u => u.trim()).filter(Boolean).forEach(url => {
            list.push({ url, type: "video" });
        });
    }
    return JSON.stringify(list);
}

function generateSlug(title: string, sku: string) {
    const base = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return `${base}-${sku.toLowerCase()}`;
}

async function getOrCreateCategory(categoryName: string) {
    const name = categoryName.trim();
    let category = await prisma.category.findUnique({
        where: { name }
    });
    if (!category) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        category = await prisma.category.create({
            data: { name, slug }
        });
    }
    return category;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;
        const importMode = (formData.get("importMode") as string) || "create"; // create vs update

        if (!file || !type) {
            return NextResponse.json({ error: "File and Type are required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rawRows.length === 0) {
            return NextResponse.json({ error: "Excel file has no data rows" }, { status: 400 });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        const errorReport: any[] = [];
        const seenSkus = new Set<string>();

        for (let i = 0; i < rawRows.length; i++) {
            const rowNumber = i + 2;
            const rawRow = rawRows[i];
            const row = normalizeKeys(rawRow);
            const errors: string[] = [];

            // 1. SKU validation
            const skuVal = row.sku || rawRow.sku || rawRow.SKU || rawRow.Sku;
            const skuRes = cleanAndValidateSku(skuVal);
            let finalSku = "";

            if (skuRes.error) {
                errors.push(skuRes.error);
            } else {
                finalSku = skuRes.sku!;
                if (seenSkus.has(finalSku)) {
                    errors.push(`Duplicate SKU "${finalSku}" inside Excel file`);
                } else {
                    seenSkus.add(finalSku);
                }
            }

            // 2. Title validation
            const titleVal = row.title || row.name || rawRow.title || rawRow.name || rawRow.Name || rawRow.Title;
            const title = titleVal ? String(titleVal).trim() : "";
            if (!title) {
                errors.push("Title/Name is required");
            }

            // If immediate validation failed, record errors and continue
            if (errors.length > 0) {
                failedCount++;
                errorReport.push({
                    rowNumber,
                    sku: finalSku || skuVal || "N/A",
                    type,
                    reason: errors.join("; ")
                });
                continue;
            }

            try {
                if (type === "diamond") {
                    // Price
                    const priceVal = parseFloat(row.price || 0);
                    if (isNaN(priceVal) || priceVal <= 0) throw new Error("Price must be a positive number");

                    // Carat
                    const caratVal = parseFloat(row.carat || 0);
                    if (isNaN(caratVal) || caratVal <= 0) throw new Error("Carat weight must be a positive number");

                    // Shape
                    const shape = row.shape ? String(row.shape).trim() : "";
                    if (!shape) throw new Error("Shape is required");

                    // Stock
                    const stockVal = parseInt(row.stock !== undefined ? row.stock : 1);

                    // Media
                    const imageUrls = row.imageurls ? String(row.imageurls).trim() : "";
                    const firstImage = imageUrls.split(",")[0]?.trim() || null;
                    const videoUrls = row.videourls ? String(row.videourls).trim() : "";
                    const firstVideo = videoUrls.split(",")[0]?.trim() || null;

                    const exists = await prisma.diamond.findUnique({ where: { sku: finalSku } });

                    if (exists) {
                        if (importMode === "create") {
                            skippedCount++;
                            continue;
                        } else {
                            // Update
                            await prisma.diamond.update({
                                where: { sku: finalSku },
                                data: {
                                    shape,
                                    caratWeight: caratVal,
                                    cut: row.cut ? String(row.cut).trim() : "Excellent",
                                    clarity: row.clarity ? String(row.clarity).trim() : "VVS1",
                                    color: row.color ? String(row.color).trim() : "E",
                                    certification: row.certification ? String(row.certification).trim() : "GIA",
                                    price: priceVal,
                                    stockCount: stockVal,
                                    imageUrl: firstImage,
                                    modelUrl: firstVideo
                                }
                            });
                            updatedCount++;
                        }
                    } else {
                        // Create
                        await prisma.diamond.create({
                            data: {
                                sku: finalSku,
                                shape,
                                caratWeight: caratVal,
                                cut: row.cut ? String(row.cut).trim() : "Excellent",
                                clarity: row.clarity ? String(row.clarity).trim() : "VVS1",
                                color: row.color ? String(row.color).trim() : "E",
                                certification: row.certification ? String(row.certification).trim() : "GIA",
                                price: priceVal,
                                stockCount: stockVal,
                                imageUrl: firstImage,
                                modelUrl: firstVideo,
                                stockStatus: "AVAILABLE"
                            }
                        });
                        createdCount++;
                    }
                } else if (type === "product") {
                    // Category
                    const catName = row.category ? String(row.category).trim() : "";
                    if (!catName) throw new Error("Category name is required");
                    const category = await getOrCreateCategory(catName);

                    // Price
                    const priceVal = parseFloat(row.price || 0);
                    if (isNaN(priceVal) || priceVal <= 0) throw new Error("Price must be a positive number");

                    // Stock
                    const stockVal = parseInt(row.stock !== undefined ? row.stock : 1);

                    // Default metal and karat
                    const defaultMetal = row.defaultmetal ? String(row.defaultmetal).trim() : "Gold";
                    const defaultKarat = row.defaultkarat ? String(row.defaultkarat).trim() : "18K";

                    // Metal options & karat options
                    const availableMetals = row.metaloptions ? String(row.metaloptions).trim() : "Gold";
                    const karatOptions = row.karatoptions ? String(row.karatoptions).trim() : "18K";

                    // Construct karat prices map
                    const kOptions = karatOptions.split(",").map(k => k.trim()).filter(Boolean);
                    const karatPricesMap: Record<string, number> = {};
                    kOptions.forEach(k => {
                        karatPricesMap[k] = priceVal; // Use base price
                    });

                    // Media
                    const imageUrls = row.imageurls ? String(row.imageurls).trim() : "";
                    const videoUrls = row.videourls ? String(row.videourls).trim() : "";
                    const imagesJson = buildMediaJson(imageUrls, videoUrls);

                    // Description & Tags
                    const description = row.description ? String(row.description).trim() : "";
                    const tags = row.tags ? String(row.tags).trim() : "";
                    const searchKeywords = row.searchkeywords ? String(row.searchkeywords).trim() : "";

                    // SEO
                    const seoTitle = row.seotitle ? String(row.seotitle).trim() : title;
                    const seoDescription = row.seodescription ? String(row.seodescription).trim() : description.slice(0, 160);

                    // diamondType
                    const diamondType = row.diamondtype ? String(row.diamondtype).trim() : "Lab Grown Diamond";

                    const exists = await prisma.product.findUnique({ where: { sku: finalSku } });

                    if (exists) {
                        if (importMode === "create") {
                            skippedCount++;
                            continue;
                        } else {
                            // Update
                            await prisma.product.update({
                                where: { sku: finalSku },
                                data: {
                                    name: title,
                                    description,
                                    price: priceVal,
                                    images: imagesJson,
                                    categoryId: category.id,
                                    diamondType,
                                    metalType: defaultMetal,
                                    availableMetals,
                                    karatPrices: JSON.stringify(karatPricesMap),
                                    stockCount: stockVal,
                                    tags,
                                    searchKeywords,
                                    seoTitle,
                                    seoDescription,
                                    isFeatured: row.isfeatured ? String(row.isfeatured).trim().toUpperCase() === "TRUE" : false
                                }
                            });
                            updatedCount++;
                        }
                    } else {
                        // Create
                        const slug = row.slug ? String(row.slug).trim() : generateSlug(title, finalSku);
                        await prisma.product.create({
                            data: {
                                sku: finalSku,
                                name: title,
                                slug,
                                description,
                                price: priceVal,
                                images: imagesJson,
                                categoryId: category.id,
                                diamondType,
                                metalType: defaultMetal,
                                availableMetals,
                                karatPrices: JSON.stringify(karatPricesMap),
                                stockCount: stockVal,
                                tags,
                                searchKeywords,
                                seoTitle,
                                seoDescription,
                                isFeatured: row.isfeatured ? String(row.isfeatured).trim().toUpperCase() === "TRUE" : false
                            }
                        });
                        createdCount++;
                    }
                } else if (type === "setting") {
                    // Category/Type
                    const settingType = row.settingtype ? String(row.settingtype).trim() : "Rings";

                    // Compatible shapes
                    const compShapes = row.compatibleshapes ? String(row.compatibleshapes).trim() : "[]";
                    const shapesList = compShapes.split(",").map(s => s.trim()).filter(Boolean);

                    // Available metals
                    const availableMetals = row.metaloptions ? String(row.metaloptions).trim() : "Gold";
                    const karatOptions = row.karatoptions ? String(row.karatoptions).trim() : "18K";

                    // Price fallbacks
                    const priceGold10K = parseFloat(row.pricegold10k || 0);
                    const priceGold14K = parseFloat(row.pricegold14k || 0);
                    const priceGold18K = parseFloat(row.pricegold18k || 0);
                    const priceGold22K = parseFloat(row.pricegold22k || 0);
                    const priceSilver = parseFloat(row.pricesilver || 0);
                    const pricePlatinum = parseFloat(row.priceplatinum || 0);

                    if (isNaN(priceGold18K) || priceGold18K <= 0) throw new Error("priceGold18K must be a positive base price");

                    const karatPricesMap: Record<string, number> = {};
                    if (priceGold10K) karatPricesMap["10K"] = priceGold10K;
                    if (priceGold14K) karatPricesMap["14K"] = priceGold14K;
                    karatPricesMap["18K"] = priceGold18K;
                    if (priceGold22K) karatPricesMap["22K"] = priceGold22K;

                    // Media
                    const imageUrls = row.imageurls ? String(row.imageurls).trim() : "";
                    const firstImage = imageUrls.split(",")[0]?.trim() || "";
                    const videoUrls = row.videourls ? String(row.videourls).trim() : "";
                    const firstVideo = videoUrls.split(",")[0]?.trim() || "";

                    const imagesList = imageUrls.split(",").map(u => u.trim()).filter(Boolean);

                    // Size prices
                    const sizeOptions = row.sizeoptions ? String(row.sizeoptions).trim() : "6,7,8";
                    const sizeList = sizeOptions.split(",").map(s => s.trim()).filter(Boolean);
                    const sizePricesMap: Record<string, number> = {};
                    sizeList.forEach(s => {
                        sizePricesMap[s] = 0; // default no price markup
                    });

                    // Description
                    const description = row.description ? String(row.description).trim() : "";

                    const exists = await prisma.setting.findUnique({ where: { sku: finalSku } });

                    if (exists) {
                        if (importMode === "create") {
                            skippedCount++;
                            continue;
                        } else {
                            // Update
                            await prisma.setting.update({
                                where: { sku: finalSku },
                                data: {
                                    name: title,
                                    description,
                                    price: priceGold18K,
                                    imageUrl: firstImage,
                                    images: JSON.stringify(imagesList),
                                    videoUrl: firstVideo,
                                    karatPrices: JSON.stringify(karatPricesMap),
                                    availableMetals,
                                    goldPrice: priceGold18K,
                                    silverPrice: priceSilver || null,
                                    platinumPrice: pricePlatinum || null,
                                    sizePrices: JSON.stringify(sizePricesMap),
                                    category: settingType,
                                    supportedShapes: JSON.stringify(shapesList)
                                }
                            });
                            updatedCount++;
                        }
                    } else {
                        // Create
                        await prisma.setting.create({
                            data: {
                                sku: finalSku,
                                name: title,
                                description,
                                price: priceGold18K,
                                imageUrl: firstImage,
                                images: JSON.stringify(imagesList),
                                videoUrl: firstVideo,
                                karatPrices: JSON.stringify(karatPricesMap),
                                availableMetals,
                                goldPrice: priceGold18K,
                                silverPrice: priceSilver || null,
                                platinumPrice: pricePlatinum || null,
                                sizePrices: JSON.stringify(sizePricesMap),
                                category: settingType,
                                supportedShapes: JSON.stringify(shapesList),
                                stockCount: 10
                            }
                        });
                        createdCount++;
                    }
                }
            } catch (err: any) {
                failedCount++;
                errorReport.push({
                    rowNumber,
                    sku: finalSku || skuVal || "N/A",
                    type,
                    reason: err.message || String(err)
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalRows: rawRows.length,
            createdCount,
            updatedCount,
            skippedCount,
            failedCount,
            errorReport
        });

    } catch (e: any) {
        console.error("Import failed:", e);
        return NextResponse.json({ error: "Import failed: " + e.message }, { status: 500 });
    }
}
