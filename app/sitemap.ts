import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zynoraluxe.com';

  // 1. Fetch all active/published products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  // 2. Fetch all categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  // 3. Fetch all settings
  const settings = await prisma.setting.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // 4. Static routes (strictly public, no /admin, /api, /my-orders, /track-order)
  const staticRoutes = [
    '',
    '/shop',
    '/diamonds',
    '/customize',
    '/about',
    '/customer-care',
    '/b2b',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 5. Dynamic category routes
  const categoryRoutes = categories.map((c) => ({
    url: `${baseUrl}/shop/${c.slug}`,
    lastModified: c.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 6. Dynamic product routes (preferred: slug, fallback: id)
  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug || p.id}`,
    lastModified: p.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 7. Dynamic setting routes
  const settingRoutes = settings.map((s) => ({
    url: `${baseUrl}/setting/${s.id}`,
    lastModified: s.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...settingRoutes];
}
