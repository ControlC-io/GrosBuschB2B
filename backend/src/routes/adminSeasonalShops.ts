import express, { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { createAuditLog } from '../middleware/auditLog';
import {
  isShopLive,
  parseEndDate,
  parseStartDate,
  SLUG_PATTERN,
  slugify,
  toDateOnly,
} from '../lib/seasonalShops';

const router = express.Router();

const shopBodySchema = z.object({
  slug: z.string().trim().min(1).max(40).regex(SLUG_PATTERN).optional(),
  nameEn: z.string().trim().min(1).max(80),
  nameFr: z.string().trim().min(1).max(80),
  startsAt: z.string().trim(),
  endsAt: z.string().trim(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const productIdsSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

type ShopWithProducts = Prisma.SeasonalShopGetPayload<{
  include: {
    products: { select: { productId: true } };
    _count: { select: { products: true } };
  };
}>;

const toAdminShopDto = (shop: ShopWithProducts) => ({
  id: shop.id,
  slug: shop.slug,
  nameEn: shop.nameEn,
  nameFr: shop.nameFr,
  startsAt: toDateOnly(shop.startsAt),
  endsAt: toDateOnly(shop.endsAt),
  isEnabled: shop.isEnabled,
  sortOrder: shop.sortOrder,
  isLive: isShopLive(shop),
  productCount: shop._count.products,
  productIds: shop.products.map((row) => row.productId),
  createdAt: shop.createdAt.toISOString(),
  updatedAt: shop.updatedAt.toISOString(),
});

const shopInclude = {
  products: { select: { productId: true } },
  _count: { select: { products: true } },
} as const;

const parseWindow = (
  startsAtRaw: string,
  endsAtRaw: string,
): { startsAt: Date; endsAt: Date } | { error: string } => {
  const startsAt = parseStartDate(startsAtRaw);
  const endsAt = parseEndDate(endsAtRaw);
  if (!startsAt || !endsAt) {
    return { error: 'startsAt and endsAt must be dates in YYYY-MM-DD format' };
  }
  if (endsAt < startsAt) {
    return { error: 'endsAt must be on or after startsAt' };
  }
  return { startsAt, endsAt };
};

const resolveSlug = (nameEn: string, requested?: string): string | null => {
  const slug = requested && requested.length > 0 ? requested : slugify(nameEn);
  if (!SLUG_PATTERN.test(slug)) return null;
  return slug;
};

const isUniqueSlugError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * @swagger
 * /api/admin/seasonal-shops:
 *   get:
 *     summary: List all seasonal shops
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seasonal shops including tagged product ids
 */
router.get('/seasonal-shops', async (_req: Request, res: Response): Promise<void> => {
  try {
    const shops = await prisma.seasonalShop.findMany({
      include: shopInclude,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    res.json(shops.map(toAdminShopDto));
  } catch (error) {
    console.error('Error listing admin seasonal shops:', error);
    res.status(500).json({ error: 'Failed to list seasonal shops' });
  }
});

/**
 * @swagger
 * /api/admin/seasonal-shops:
 *   post:
 *     summary: Create a seasonal shop
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created seasonal shop
 */
router.post('/seasonal-shops', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = shopBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid seasonal shop payload' });
      return;
    }

    const slug = resolveSlug(parsed.data.nameEn, parsed.data.slug);
    if (!slug) {
      res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers and underscores.' });
      return;
    }

    const window = parseWindow(parsed.data.startsAt, parsed.data.endsAt);
    if ('error' in window) {
      res.status(400).json({ error: window.error });
      return;
    }

    const shop = await prisma.seasonalShop.create({
      data: {
        slug,
        nameEn: parsed.data.nameEn,
        nameFr: parsed.data.nameFr,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        isEnabled: parsed.data.isEnabled ?? true,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
      include: shopInclude,
    });

    await createAuditLog('CREATE_SEASONAL_SHOP', null, { id: shop.id, slug: shop.slug });
    res.status(201).json(toAdminShopDto(shop));
  } catch (error) {
    if (isUniqueSlugError(error)) {
      res.status(409).json({ error: 'A seasonal shop with this slug already exists' });
      return;
    }
    console.error('Error creating seasonal shop:', error);
    res.status(500).json({ error: 'Failed to create seasonal shop' });
  }
});

/**
 * @swagger
 * /api/admin/seasonal-shops/{id}:
 *   patch:
 *     summary: Update a seasonal shop
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.patch('/seasonal-shops/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = shopBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid seasonal shop payload' });
      return;
    }

    const existing = await prisma.seasonalShop.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Seasonal shop not found' });
      return;
    }

    const nextNameEn = parsed.data.nameEn ?? existing.nameEn;
    const nextSlug = parsed.data.slug
      ? resolveSlug(nextNameEn, parsed.data.slug)
      : existing.slug;
    if (!nextSlug) {
      res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers and underscores.' });
      return;
    }

    const startsAtRaw = parsed.data.startsAt ?? toDateOnly(existing.startsAt);
    const endsAtRaw = parsed.data.endsAt ?? toDateOnly(existing.endsAt);
    const window = parseWindow(startsAtRaw, endsAtRaw);
    if ('error' in window) {
      res.status(400).json({ error: window.error });
      return;
    }

    const shop = await prisma.seasonalShop.update({
      where: { id: existing.id },
      data: {
        slug: nextSlug,
        nameEn: nextNameEn,
        nameFr: parsed.data.nameFr ?? existing.nameFr,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        isEnabled: parsed.data.isEnabled ?? existing.isEnabled,
        sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      },
      include: shopInclude,
    });

    await createAuditLog('UPDATE_SEASONAL_SHOP', null, { id: shop.id, slug: shop.slug });
    res.json(toAdminShopDto(shop));
  } catch (error) {
    if (isUniqueSlugError(error)) {
      res.status(409).json({ error: 'A seasonal shop with this slug already exists' });
      return;
    }
    console.error('Error updating seasonal shop:', error);
    res.status(500).json({ error: 'Failed to update seasonal shop' });
  }
});

/**
 * @swagger
 * /api/admin/seasonal-shops/{id}:
 *   delete:
 *     summary: Delete a seasonal shop
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.delete('/seasonal-shops/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.seasonalShop.findUnique({
      where: { id: req.params.id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Seasonal shop not found' });
      return;
    }

    await prisma.seasonalShop.delete({ where: { id: existing.id } });
    await createAuditLog('DELETE_SEASONAL_SHOP', null, { id: existing.id, slug: existing.slug });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting seasonal shop:', error);
    res.status(500).json({ error: 'Failed to delete seasonal shop' });
  }
});

/**
 * @swagger
 * /api/admin/seasonal-shops/{id}/products:
 *   put:
 *     summary: Replace the products tagged in a seasonal shop
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.put('/seasonal-shops/:id/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = productIdsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'productIds must be an array of product ids' });
      return;
    }

    const shop = await prisma.seasonalShop.findUnique({
      where: { id: req.params.id },
      select: { id: true, slug: true },
    });
    if (!shop) {
      res.status(404).json({ error: 'Seasonal shop not found' });
      return;
    }

    const uniqueIds = [...new Set(parsed.data.productIds)];
    if (uniqueIds.length > 0) {
      const found = await prisma.product.count({
        where: { id: { in: uniqueIds } },
      });
      if (found !== uniqueIds.length) {
        res.status(400).json({ error: 'One or more products were not found' });
        return;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.productSeasonalShop.deleteMany({ where: { shopId: shop.id } });
      if (uniqueIds.length > 0) {
        await tx.productSeasonalShop.createMany({
          data: uniqueIds.map((productId) => ({ productId, shopId: shop.id })),
        });
      }
      return tx.seasonalShop.findUniqueOrThrow({
        where: { id: shop.id },
        include: shopInclude,
      });
    });

    await createAuditLog('TAG_SEASONAL_SHOP_PRODUCTS', null, {
      id: shop.id,
      slug: shop.slug,
      productCount: uniqueIds.length,
    });
    res.json(toAdminShopDto(updated));
  } catch (error) {
    console.error('Error tagging seasonal shop products:', error);
    res.status(500).json({ error: 'Failed to tag seasonal shop products' });
  }
});

export default router;
