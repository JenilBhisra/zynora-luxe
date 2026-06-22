import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zynoraluxe.com';

  // Fetch all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  // Fetch all settings
  const settings = await prisma.setting.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // Static routes
  const staticRoutes = [
    '',
    '/shop',
    '/diamonds',
    '/customize',
    '/about',
    '/customer-care',
    '/my-orders',
    '/track-order',
    '/b2b',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic product routes
  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug || p.id}`,
    lastModified: p.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic setting routes
  const settingRoutes = settings.map((s) => ({
    url: `${baseUrl}/setting/${s.id}`,
    lastModified: s.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...settingRoutes];
}
