import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import * as XLSX from "xlsx";

const templatesMap: Record<string, { headers: string[]; sample: string[]; notes: string[][] }> = {
    diamond: {
        headers: [
            "sku", "title", "diamondType", "shape", "carat", "color", "clarity", "cut",
            "polish", "symmetry", "fluorescence", "certification", "certificateNumber",
            "price", "salePrice", "stock", "imageUrls", "videoUrls", "isActive", "description",
            "seoTitle", "seoDescription", "searchKeywords"
        ],
        sample: [
            "DIA-RD-001", "1.00 Carat Round Brilliant Diamond", "Lab Grown Diamond", "Round", "1.00", "E", "VVS1", "Excellent",
            "Excellent", "Excellent", "None", "GIA", "1234567890",
            "45000", "42000", "10", "https://res.cloudinary.com/...", "https://res.cloudinary.com/...", "TRUE", "Stunning diamond with exceptional brilliance.",
            "1.00 Carat Round Brilliant Lab Grown Diamond", "Buy certified 1.00 Carat Round Brilliant Lab Grown Diamond at Zynora Luxe.", "round, lab grown, 1 carat"
        ],
        notes: [
            ["Column", "Required", "Allowed Values / Format", "Notes"],
            ["sku", "YES", "Alphanumeric and hyphens only", "Must be unique"],
            ["title", "YES", "Text", "Friendly name of the diamond"],
            ["diamondType", "YES", "Lab Grown Diamond, Natural Diamond", "Must match exactly"],
            ["shape", "YES", "Round, Oval, Cushion, Emerald, Marquise, Radiant, Pear, Elongated Cushion, Princess, Asscher, Heart", "Must match exactly"],
            ["carat", "YES", "Number (Float)", "e.g., 1.00 or 0.75"],
            ["color", "YES", "Text (D-Z / Gemstone name)", "e.g., D, E, F or Blue Sapphire"],
            ["clarity", "YES", "Text (FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1)", "e.g., VVS1"],
            ["cut", "YES", "Excellent, Very Good, Good, Fair, Poor", "Must match exactly"],
            ["price", "YES", "Positive Number", "Base price of diamond"],
            ["stock", "YES", "Non-negative Integer", "Default is 1"],
            ["imageUrls", "NO", "Comma-separated URLs", "Cloudinary or standard URLs"],
            ["videoUrls", "NO", "Comma-separated URLs", "Cloudinary or standard URLs"],
            ["isActive", "YES", "TRUE, FALSE", "Must be uppercase TRUE or FALSE"]
        ]
    },
    ring: {
        headers: [
            "sku", "title", "category", "diamondType", "diamondShape", "caratWeight", "metalOptions", "karatOptions",
            "defaultMetal", "defaultKarat", "basePrice", "salePrice", "stock", "sizeOptions", "imageUrls", "videoUrls",
            "description", "tags", "seoTitle", "seoDescription", "searchKeywords", "isActive"
        ],
        sample: [
            "RNG-SOL-001", "Classic Cushion Cut Solitaire Diamond Ring", "Engagement Ring", "Lab Grown Diamond", "Cushion", "1.50", "Gold,Silver,Platinum", "14K,18K",
            "Gold", "18K", "65000", "60000", "5", "6,7,8", "https://res.cloudinary.com/...", "https://res.cloudinary.com/...",
            "Elegant twisted band solitaire diamond ring.", "solitaire, engagement ring", "Classic Cushion Cut Solitaire Diamond Ring", "Zynora Luxe classic cushion solitaire.", "engagement ring, cushion solitaire", "TRUE"
        ],
        notes: [
            ["Column", "Required", "Allowed Values / Format", "Notes"],
            ["sku", "YES", "Alphanumeric and hyphens only", "Must be unique"],
            ["title", "YES", "Text", "Ring product name"],
            ["category", "YES", "Engagement Ring, Pendant, Bracelet and Watch, Earrings, Necklace", "Matches website collection category"],
            ["diamondType", "YES", "Lab Grown Diamond, Natural Diamond", "Diamond origin"],
            ["metalOptions", "YES", "Comma-separated values (Gold, Silver, Platinum)", "e.g., Gold,Silver"],
            ["karatOptions", "YES", "Comma-separated values (10K, 14K, 18K, 22K)", "e.g., 14K,18K"],
            ["defaultMetal", "YES", "Gold, Silver, Platinum", "Default finish option"],
            ["defaultKarat", "YES", "10K, 14K, 18K, 22K", "Default gold karat purity"],
            ["basePrice", "YES", "Positive Number", "Product base price"],
            ["stock", "YES", "Non-negative Integer", "Total pieces in inventory"],
            ["imageUrls", "NO", "Comma-separated URLs", "Cloudinary links preferred"],
            ["videoUrls", "NO", "Comma-separated URLs", "Autoplay video preview link"],
            ["isActive", "YES", "TRUE, FALSE", "Uppercase TRUE or FALSE"]
        ]
    },
    setting: {
        headers: [
            "sku", "title", "settingType", "compatibleShapes", "metalOptions", "karatOptions", "sizeOptions",
            "priceGold10K", "priceGold14K", "priceGold18K", "priceGold22K", "priceSilver", "pricePlatinum",
            "imageUrls", "videoUrls", "description", "isActive"
        ],
        sample: [
            "SET-HALO-001", "Classic Halo Diamond Ring Setting", "Rings", "Round,Oval,Cushion", "Gold,Silver,Platinum", "10K,14K,18K,22K", "6,7,8",
            "25000", "28000", "32000", "35000", "12000", "45000",
            "https://res.cloudinary.com/...", "https://res.cloudinary.com/...", "Beautiful micro-pave halo setting.", "TRUE"
        ],
        notes: [
            ["Column", "Required", "Allowed Values / Format", "Notes"],
            ["sku", "YES", "Alphanumeric and hyphens only", "Must be unique"],
            ["title", "YES", "Text", "Setting name"],
            ["settingType", "YES", "Rings, Pendants, Earrings", "Type of setting category"],
            ["compatibleShapes", "YES", "Comma-separated shapes (Round, Oval, Cushion, Emerald, etc.)", "Supported diamond shapes"],
            ["metalOptions", "YES", "Comma-separated metals (Gold, Silver, Platinum)", "e.g., Gold,Silver,Platinum"],
            ["karatOptions", "YES", "Comma-separated karats (10K, 14K, 18K, 22K)", "e.g., 14K,18K"],
            ["priceGold18K", "YES", "Positive Number", "Price for 18K gold variant. Used as fallback base price."],
            ["isActive", "YES", "TRUE, FALSE", "Uppercase TRUE or FALSE"]
        ]
    },
    product: {
        headers: [
            "sku", "title", "slug", "category", "diamondType", "metalOptions", "karatOptions", "defaultMetal", "defaultKarat",
            "price", "salePrice", "stock", "imageUrls", "videoUrls", "description", "tags", "seoTitle", "seoDescription",
            "searchKeywords", "isFeatured", "isActive"
        ],
        sample: [
            "PRD-NECK-001", "Gold Emerald Diamond Pendant Necklace", "gold-emerald-pendant-necklace", "Necklace", "Lab Grown Diamond", "Gold", "18K", "Gold", "18K",
            "35000", "32000", "8", "https://res.cloudinary.com/...", "https://res.cloudinary.com/...", "Stunning gold necklace with fine emerald.", "necklace, pendant",
            "Gold Emerald Diamond Pendant Necklace", "Certified lab-grown diamond pendant necklace.", "necklace, gold pendant", "TRUE", "TRUE"
        ],
        notes: [
            ["Column", "Required", "Allowed Values / Format", "Notes"],
            ["sku", "YES", "Alphanumeric and hyphens only", "Must be unique"],
            ["title", "YES", "Text", "Product Name"],
            ["category", "YES", "Engagement Ring, Pendant, Bracelet and Watch, Earrings, Necklace", "Matches collection name"],
            ["price", "YES", "Positive Number", "Base price of product"],
            ["stock", "YES", "Non-negative Integer", "Default is 1"],
            ["isFeatured", "YES", "TRUE, FALSE", "Uppercase TRUE or FALSE"],
            ["isActive", "YES", "TRUE, FALSE", "Uppercase TRUE or FALSE"]
        ]
    }
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        if (!type || !templatesMap[type]) {
            return NextResponse.json({ error: "Invalid template type. Allowed: diamond, ring, setting, product" }, { status: 400 });
        }

        const template = templatesMap[type];

        // Build Excel Workbook
        const wb = XLSX.utils.book_new();

        // 1. Template sheet
        const wsData = [template.headers, template.sample];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Upload Template");

        // 2. Instructions sheet
        const wsInstructions = XLSX.utils.aoa_to_sheet(template.notes);
        XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions & Formats");

        // Generate buffer
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": `attachment; filename=zynoraluxe_bulk_${type}_template.xlsx`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        });

    } catch (e: any) {
        console.error("Template generation error:", e);
        return NextResponse.json({ error: "Template generation failed: " + e.message }, { status: 500 });
    }
}
