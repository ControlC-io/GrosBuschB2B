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
  gtin: string | null;
  barcodeFixed: boolean;
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
  gtin: product.gtin,
  barcodeFixed: product.barcodeFixed,
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

type ProductFilterScope = {
  category?: string;
  origins?: string[];
  tags?: string[];
  search?: string;
};

const buildProductWhere = (scope: ProductFilterScope): Prisma.ProductWhereInput => ({
  ...buildSearchWhere(scope.search ?? ''),
  ...(scope.category && scope.category.length > 0 ? { category: scope.category } : {}),
  ...(scope.origins && scope.origins.length > 0 ? { origin: { in: scope.origins } } : {}),
  ...(scope.tags && scope.tags.length > 0 ? { tags: { hasSome: scope.tags } } : {}),
});

const toFacets = (groups: Facet[]): Facet[] =>
  [...groups].sort((a, b) => a.value.localeCompare(b.value));

/** Keep currently selected values visible so a checkbox cannot vanish while still checked. */
const withSelectedFacets = (facets: Facet[], selected: string[]): Facet[] => {
  const present = new Set(facets.map((facet) => facet.value));
  const extras = selected
    .filter((value) => !present.has(value))
    .map((value) => ({ value, count: 0 }));
  return toFacets([...facets, ...extras]);
};

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

    const where = buildProductWhere({ category, origins, tags, search });

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
 *     description: Returns selectable categories, origins and tags with counts. Each facet group is computed from the other active filters, so checking Belgium only lists labels present on Belgian products, and checking a label only lists origins that carry it. Public, no JWT required.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Scopes origin and tag counts to a single category
 *       - in: query
 *         name: origins
 *         schema:
 *           type: string
 *         description: Comma separated origins used when counting tags and categories
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma separated tags used when counting origins and categories
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
    const origins = parseList(req.query.origins);
    const tags = parseList(req.query.tags);
    const search = parseText(req.query.search);

    // Each group ignores its own selection so remaining options stay comparable,
    // while still applying the other filters (Belgium narrows labels, Bio narrows origins).
    const categoryWhere = buildProductWhere({ search, origins, tags });
    const originWhere = buildProductWhere({ search, category, tags });
    const tagWhere = buildProductWhere({ search, category, origins });

    const [categoryGroups, originGroups, taggedProducts] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        where: categoryWhere,
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['origin'],
        where: originWhere,
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: tagWhere,
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
      categories: withSelectedFacets(
        toFacets(
          categoryGroups.map((group) => ({ value: group.category, count: group._count._all })),
        ),
        category.length > 0 ? [category] : [],
      ),
      origins: withSelectedFacets(
        toFacets(
          originGroups.map((group) => ({ value: group.origin, count: group._count._all })),
        ),
        origins,
      ),
      tags: withSelectedFacets(
        toFacets([...tagCounts].map(([value, count]) => ({ value, count }))),
        tags,
      ),
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
