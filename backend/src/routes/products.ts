import express, { Request, Response } from 'express';
import { Prisma, Product } from '@prisma/client';
import prisma from '../lib/prisma';

const router = express.Router();

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

type ProductDto = {
  id: string;
  sku: string;
  name: string;
  origin: string;
  category: string;
  pricePerUnit: number;
  oldPrice: number | null;
  pricePerKg: number | null;
  salesUnit: string;
  tags: string[];
  imageUrl: string;
  isAvailable: boolean;
};

type Facet = {
  value: string;
  count: number;
};

type SortKey = 'name' | 'price_asc' | 'price_desc';

const SORT_CLAUSES: Record<SortKey, Prisma.ProductOrderByWithRelationInput> = {
  name: { name: 'asc' },
  price_asc: { pricePerUnit: 'asc' },
  price_desc: { pricePerUnit: 'desc' },
};

const isSortKey = (value: string): value is SortKey => value in SORT_CLAUSES;

/** Prisma returns Decimal instances, which serialize poorly for the browser. */
const toNumber = (value: Prisma.Decimal | null): number | null =>
  value === null ? null : Number(value);

const toProductDto = (product: Product): ProductDto => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  origin: product.origin,
  category: product.category,
  pricePerUnit: Number(product.pricePerUnit),
  oldPrice: toNumber(product.oldPrice),
  pricePerKg: toNumber(product.pricePerKg),
  salesUnit: product.salesUnit,
  tags: product.tags,
  imageUrl: product.imageUrl,
  isAvailable: product.isAvailable,
});

const parseText = (raw: unknown): string => (typeof raw === 'string' ? raw.trim() : '');

const parseList = (raw: unknown): string[] =>
  parseText(raw)
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const parsePositiveInt = (raw: unknown, fallback: number, max: number): number => {
  const parsed = Number.parseInt(parseText(raw), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const buildSearchWhere = (search: string): Prisma.ProductWhereInput =>
  search.length > 0 ? { name: { contains: search, mode: 'insensitive' } } : {};

const toFacets = (groups: Facet[]): Facet[] =>
  [...groups].sort((a, b) => a.value.localeCompare(b.value));

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List catalog products with server side filtering
 *     description: Returns a paginated list of products. Filters are combined with AND, except tags which match any of the requested values. Public, no JWT required.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Exact business category, for example "Seasonal Products"
 *       - in: query
 *         name: origins
 *         schema:
 *           type: string
 *         description: Comma separated list of origins, for example "ITALY,FRANCE"
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma separated list of tags, matched with OR logic, for example "Bio,Promo"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case insensitive search on the product name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, price_asc, price_desc]
 *         description: Sort order, defaults to name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number, defaults to 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page, defaults to 24
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                   example: 20
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 24
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = parseText(req.query.category);
    const origins = parseList(req.query.origins);
    const tags = parseList(req.query.tags);
    const search = parseText(req.query.search);
    const sortParam = parseText(req.query.sort);
    const page = parsePositiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where: Prisma.ProductWhereInput = {
      ...buildSearchWhere(search),
      ...(category.length > 0 ? { category } : {}),
      ...(origins.length > 0 ? { origin: { in: origins } } : {}),
      ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    };

    const orderBy = isSortKey(sortParam) ? SORT_CLAUSES[sortParam] : SORT_CLAUSES.name;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: products.map(toProductDto),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

/**
 * @swagger
 * /api/products/facets:
 *   get:
 *     summary: Available filter facets with counts
 *     description: Returns the selectable categories, origins and tags with the number of matching products. Category counts always cover the whole catalog so the navigation tabs stay stable, while origin and tag counts are scoped to the selected category. Public, no JWT required.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Scopes the origin and tag counts to a single category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Scopes every count to a case insensitive name search
 *     responses:
 *       200:
 *         description: Facet groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facet'
 *                 origins:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facet'
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/facets', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = parseText(req.query.category);
    const search = parseText(req.query.search);

    const searchWhere = buildSearchWhere(search);
    const scopedWhere: Prisma.ProductWhereInput =
      category.length > 0 ? { ...searchWhere, category } : searchWhere;

    const [categoryGroups, originGroups, taggedProducts] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        where: searchWhere,
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['origin'],
        where: scopedWhere,
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: scopedWhere,
        select: { tags: true },
      }),
    ]);

    // Postgres text arrays cannot be aggregated by groupBy, so tags are tallied
    // in memory over the projected rows.
    const tagCounts = taggedProducts.reduce<Map<string, number>>((acc, product) => {
      product.tags.forEach((tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1));
      return acc;
    }, new Map());

    res.json({
      categories: toFacets(
        categoryGroups.map((group) => ({ value: group.category, count: group._count._all })),
      ),
      origins: toFacets(
        originGroups.map((group) => ({ value: group.origin, count: group._count._all })),
      ),
      tags: toFacets([...tagCounts].map(([value, count]) => ({ value, count }))),
    });
  } catch (error) {
    console.error('Error computing product facets:', error);
    res.status(500).json({ error: 'Failed to compute product facets' });
  }
});

/**
 * @swagger
 * /api/products/{sku}:
 *   get:
 *     summary: Get a single product by SKU
 *     description: Returns the full product detail used by the product sheet. Public, no JWT required.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         description: Catalog reference, for example "p001"
 *     responses:
 *       200:
 *         description: Product detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Product not found
 */
router.get('/:sku', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { sku: req.params.sku },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(toProductDto(product));
  } catch (error) {
    console.error('Error reading product:', error);
    res.status(500).json({ error: 'Failed to read product' });
  }
});

export default router;
