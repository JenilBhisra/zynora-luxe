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

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;

        if (!file || !type) {
            return NextResponse.json({ error: "File and Type are required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rawRows.length === 0) {
            return NextResponse.json({ error: "Excel file is empty or has no data rows" }, { status: 400 });
        }

        const previewRows: any[] = [];
        const seenSkus = new Set<string>();

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rawRows.length; i++) {
            const rowNumber = i + 2; // Row 1 is header
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

            // 3. Type-specific validations
            if (type === "diamond") {
                // Price
                const priceVal = parseFloat(row.price || 0);
                if (isNaN(priceVal) || priceVal <= 0) errors.push("Price must be a positive number");

                // Carat
                const caratVal = parseFloat(row.carat || 0);
                if (isNaN(caratVal) || caratVal <= 0) errors.push("Carat weight must be a positive number");

                // Shape
                const allowedShapes = ["Round", "Oval", "Cushion", "Emerald", "Marquise", "Radiant", "Pear", "Elongated Cushion", "Princess", "Asscher", "Heart"];
                const shape = row.shape ? String(row.shape).trim() : "";
                if (!shape) {
                    errors.push("Shape is required");
                } else {
                    const matchedShape = allowedShapes.find(s => s.toLowerCase() === shape.toLowerCase());
                    if (!matchedShape) errors.push(`Shape "${shape}" is invalid. Allowed: ${allowedShapes.join(", ")}`);
                }

                // Color
                if (!row.color) errors.push("Color is required");

                // Clarity
                if (!row.clarity) errors.push("Clarity is required");

                // Cut
                const allowedCuts = ["Excellent", "Very Good", "Good", "Fair", "Poor"];
                const cut = row.cut ? String(row.cut).trim() : "";
                if (!cut) {
                    errors.push("Cut is required");
                } else {
                    const matchedCut = allowedCuts.find(c => c.toLowerCase() === cut.toLowerCase());
                    if (!matchedCut) errors.push(`Cut "${cut}" is invalid. Allowed: ${allowedCuts.join(", ")}`);
                }

                // Diamond Type
                const diamondType = row.diamondtype ? String(row.diamondtype).trim() : "";
                if (diamondType) {
                    const allowedTypes = ["Lab Grown Diamond", "Natural Diamond"];
                    const matchedType = allowedTypes.find(t => t.toLowerCase() === diamondType.toLowerCase());
                    if (!matchedType) errors.push(`diamondType "${diamondType}" is invalid. Allowed: ${allowedTypes.join(", ")}`);
                }

                // Check DB uniqueness
                if (finalSku && !errors.length) {
                    const exists = await prisma.diamond.findUnique({ where: { sku: finalSku } });
                    if (exists) {
                        errors.push(`SKU already exists in DB`);
                    }
                }
            } else if (type === "product") {
                // Category
                const catName = row.category ? String(row.category).trim() : "";
                if (!catName) errors.push("Category is required");

                // Price
                const priceVal = parseFloat(row.price || 0);
                if (isNaN(priceVal) || priceVal <= 0) errors.push("Price must be a positive number");

                // Check DB uniqueness
                if (finalSku && !errors.length) {
                    const exists = await prisma.product.findUnique({ where: { sku: finalSku } });
                    if (exists) {
                        errors.push(`SKU already exists in DB`);
                    }
                }
            } else if (type === "setting") {
                // Setting type
                const settingType = row.settingtype ? String(row.settingtype).trim() : "";
                if (!settingType) errors.push("settingType is required");

                // Supported shapes
                const compShapes = row.compatibleshapes ? String(row.compatibleshapes).trim() : "";
                if (!compShapes) errors.push("compatibleShapes is required");

                // Price (18K price is the main setting price fallback)
                const priceGold18K = parseFloat(row.pricegold18k || 0);
                if (isNaN(priceGold18K) || priceGold18K <= 0) errors.push("priceGold18K must be a positive number");

                // Check DB uniqueness
                if (finalSku && !errors.length) {
                    const exists = await prisma.setting.findUnique({ where: { sku: finalSku } });
                    if (exists) {
                        errors.push(`SKU already exists in DB`);
                    }
                }
            }

            const status = errors.length > 0 ? "INVALID" : "VALID";
            if (status === "VALID") validCount++;
            else invalidCount++;

            previewRows.push({
                rowNumber,
                sku: finalSku || skuVal || "N/A",
                title: title || "N/A",
                status,
                errors
            });
        }

        return NextResponse.json({
            success: true,
            totalRows: rawRows.length,
            validCount,
            invalidCount,
            previewRows
        });

    } catch (e: any) {
        console.error("Preview failed:", e);
        return NextResponse.json({ error: "Failed to parse preview: " + e.message }, { status: 500 });
    }
}
