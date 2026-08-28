import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { visibleShopWhere } from '../lib/seasonalShops';

const router = express.Router();

/**
 * @swagger
 * /api/seasonal-shops:
 *   get:
 *     summary: List live seasonal shops
 *     description: Returns enabled shops whose date window includes the current time. Used by the category strip under search. Public, no JWT required.
 *     tags:
 *       - Seasonal shops
 *     responses:
 *       200:
 *         description: Live seasonal shops ordered for the navigation strip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SeasonalShopNav'
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const shops = await prisma.seasonalShop.findMany({
      where: visibleShopWhere(),
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      select: {
        slug: true,
        nameEn: true,
        nameFr: true,
        sortOrder: true,
      },
    });

    res.json({ items: shops });
  } catch (error) {
    console.error('Error listing seasonal shops:', error);
    res.status(500).json({ error: 'Failed to list seasonal shops' });
  }
});

export default router;
