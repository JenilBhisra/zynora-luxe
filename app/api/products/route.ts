/* eslint-disable */
// Force recompile
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const categorySlug = searchParams.get('category'); // e.g. "Necklaces,Earrings"
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const diamondShape = searchParams.get('shape'); // e.g. "Round,Oval"
    const metalType = searchParams.get('metal'); // e.g. "18K White Gold"
    const sort = searchParams.get('sort'); // "price-asc" | "price-desc" | "newest" | "popular"
    const query = searchParams.get('query') || searchParams.get('search') || undefined;

    // Pagination
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    try {
        const whereClause: any = {};

        // Text search query
        if (query) {
            const q = query.trim();
            whereClause.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { metalType: { contains: q, mode: 'insensitive' } },
                { tags: { contains: q, mode: 'insensitive' } },
                { searchKeywords: { contains: q, mode: 'insensitive' } },
                { category: { name: { contains: q, mode: 'insensitive' } } },
                { diamond: {
                    OR: [
                        { shape: { contains: q, mode: 'insensitive' } },
                        { cut: { contains: q, mode: 'insensitive' } },
                        { clarity: { contains: q, mode: 'insensitive' } },
                        { color: { contains: q, mode: 'insensitive' } }
                    ]
                }}
            ];
        }

        // Category filter
        if (categorySlug) {
            const categories = categorySlug.split(',').map(s => s.trim());
            whereClause.category = {
                slug: {
                    in: categories
                }
            };
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined) whereClause.price.gte = minPrice;
            if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
        }

        // Diamond shape filter (supports comma separated)
        if (diamondShape) {
            const shapes = diamondShape.split(',').map(s => s.trim());
            whereClause.diamond = {
                shape: {
                    in: shapes
                }
            };
        }

        // Metal type filter
        if (metalType) {
            const metals = metalType.split(',').map(m => m.trim());
            whereClause.metalType = {
                in: metals
            };
        }

        // Setup Sorting
        let orderBy: any = { createdAt: 'desc' }; // Default Newest
        if (sort === 'price-asc') orderBy = { price: 'asc' };
        if (sort === 'price-desc') orderBy = { price: 'desc' };
        if (sort === 'popular') orderBy = { orders: { _count: 'desc' } };

        // Transaction for executing fetch and count concurrently
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                include: {
                    category: true,
                    diamond: true,
                    _count: {
                        select: { reviews: true }
                    }
                },
                orderBy,
                take: limit,
                skip: skip,
            }),
            prisma.product.count({ where: whereClause })
        ]);

        // Format to handle image JSON parsing if needed
        const formattedProducts = products.map(p => {
            let parsedImages = [];
            try {
                parsedImages = JSON.parse(p.images);
            } catch {
                parsedImages = [];
            }
            return {
                ...p,
                images: parsedImages
            };
        });

        return NextResponse.json({ 
            success: true, 
            products: formattedProducts,
            totalCount,
            page,
            totalPages: limit ? Math.ceil(totalCount / limit) : 1
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
    }
}
