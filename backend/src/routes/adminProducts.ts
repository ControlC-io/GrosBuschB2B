import express, { Request, Response } from 'express';
import multer from 'multer';
import { Prisma, Product } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { createAuditLog } from '../middleware/auditLog';
import {
  buildProductTemplateWorkbook,
  buildProductWorkbook,
  cellToString,
  parseProductWorkbook,
  type ProductExcelColumn,
} from '../lib/productExcel';

const router = express.Router();

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;
const EXCEL_MAX_BYTES = 5 * 1024 * 1024;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

const optionalTrimmed = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalMoney = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim().length === 0) return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a non negative number' });
      return z.NEVER;
    }
    return parsed;
  });

const moneyField = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a non negative number' });
      return z.NEVER;
    }
    return parsed;
  });

const tagsField = z
  .union([z.array(z.string()), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (Array.isArray(value)) {
      return value.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    }
    if (typeof value !== 'string' || value.trim().length === 0) return [];
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  });

const booleanField = z
  .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(normalized)) return true;
      if (['false', '0', 'no'].includes(normalized)) return false;
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be true or false' });
    return z.NEVER;
  });

const productBodySchema = z.object({
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  origin: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  pricePerUnit: moneyField,
  oldPrice: optionalMoney,
  pricePerKg: optionalMoney,
  salesUnit: z.string().trim().min(1).max(20).optional(),
  tags: tagsField,
  imageUrl: z.string().trim().min(1).max(2000),
  gtin: optionalTrimmed,
  barcodeFixed: booleanField,
  isAvailable: booleanField,
});

const productPatchSchema = productBodySchema.partial().extend({
  sku: z.string().trim().min(1).max(80).optional(),
});

type ProductWriteData = {
  sku: string;
  name: string;
  origin: string;
  category: string;
  pricePerUnit: Prisma.Decimal;
  oldPrice: Prisma.Decimal | null;
  pricePerKg: Prisma.Decimal | null;
  salesUnit: string;
  tags: string[];
  imageUrl: string;
  gtin: string | null;
  barcodeFixed: boolean;
  isAvailable: boolean;
};

const toCreateData = (parsed: z.infer<typeof productBodySchema>): ProductWriteData => ({
  sku: parsed.sku,
  name: parsed.name,
  origin: parsed.origin,
  category: parsed.category,
  pricePerUnit: new Prisma.Decimal(parsed.pricePerUnit),
  oldPrice: parsed.oldPrice === null ? null : new Prisma.Decimal(parsed.oldPrice),
  pricePerKg: parsed.pricePerKg === null ? null : new Prisma.Decimal(parsed.pricePerKg),
  salesUnit: parsed.salesUnit ?? 'PCS',
  tags: parsed.tags,
  imageUrl: parsed.imageUrl,
  gtin: parsed.gtin,
  barcodeFixed: parsed.barcodeFixed ?? false,
  isAvailable: parsed.isAvailable ?? true,
});

const toExcelRow = (product: Product): Record<ProductExcelColumn, unknown> => ({
  sku: product.sku,
  name: product.name,
  origin: product.origin,
  category: product.category,
  pricePerUnit: Number(product.pricePerUnit),
  oldPrice: product.oldPrice === null ? '' : Number(product.oldPrice),
  pricePerKg: product.pricePerKg === null ? '' : Number(product.pricePerKg),
  salesUnit: product.salesUnit,
  tags: product.tags.join(', '),
  imageUrl: product.imageUrl,
  gtin: product.gtin ?? '',
  barcodeFixed: product.barcodeFixed,
  isAvailable: product.isAvailable,
});

const parseText = (raw: unknown): string => (typeof raw === 'string' ? raw.trim() : '');

const parsePositiveInt = (raw: unknown, fallback: number, max: number): number => {
  const parsed = Number.parseInt(parseText(raw), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const isUniqueSkuError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const sendExcel = (res: Response, filename: string, buffer: Buffer): void => {
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EXCEL_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.xlsx')) {
      cb(null, true);
      return;
    }
    cb(new Error('File must be an Excel workbook (.xlsx)'));
  },
});

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: List catalog products for admin
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case insensitive search on name or SKU
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = parseText(req.query.search);
    const page = parsePositiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where: Prisma.ProductWhereInput =
      search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
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
    console.error('Error listing admin products:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

/**
 * @swagger
 * /api/admin/products/template:
 *   get:
 *     summary: Download an Excel template for product import
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel workbook
 */
router.get('/products/template', async (_req: Request, res: Response): Promise<void> => {
  try {
    const buffer = await buildProductTemplateWorkbook();
    sendExcel(res, 'products-template.xlsx', buffer);
  } catch (error) {
    console.error('Error building product template:', error);
    res.status(500).json({ error: 'Failed to build product template' });
  }
});

/**
 * @swagger
 * /api/admin/products/export:
 *   get:
 *     summary: Export the catalog as Excel
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel workbook
 */
router.get('/products/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    const buffer = await buildProductWorkbook(products.map(toExcelRow));
    sendExcel(res, 'products-catalog.xlsx', buffer);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

const importProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Upload an Excel file in the file field' });
      return;
    }

    const parsedRows = await parseProductWorkbook(req.file.buffer);
    const errors: Array<{ row: number; sku: string; message: string }> = [];
    let created = 0;
    let updated = 0;

    for (const entry of parsedRows) {
      const rawSku = cellToString(entry.values.sku);
      const body = {
        sku: rawSku,
        name: cellToString(entry.values.name),
        origin: cellToString(entry.values.origin),
        category: cellToString(entry.values.category),
        pricePerUnit: entry.values.pricePerUnit,
        oldPrice: entry.values.oldPrice,
        pricePerKg: entry.values.pricePerKg,
        salesUnit: cellToString(entry.values.salesUnit) || undefined,
        tags: entry.values.tags,
        imageUrl: cellToString(entry.values.imageUrl),
        gtin: entry.values.gtin,
        barcodeFixed: entry.values.barcodeFixed,
        isAvailable: entry.values.isAvailable,
      };

      const parsed = productBodySchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => {
            const path = issue.path.join('.') || 'row';
            return `${path}: ${issue.message}`;
          })
          .join('; ') || 'Invalid row';
        errors.push({ row: entry.row, sku: rawSku, message });
        continue;
      }

      try {
        const data = toCreateData(parsed.data);
        const existing = await prisma.product.findUnique({
          where: { sku: data.sku },
          select: { id: true },
        });

        await prisma.product.upsert({
          where: { sku: data.sku },
          create: data,
          update: {
            name: data.name,
            origin: data.origin,
            category: data.category,
            pricePerUnit: data.pricePerUnit,
            oldPrice: data.oldPrice,
            pricePerKg: data.pricePerKg,
            salesUnit: data.salesUnit,
            tags: data.tags,
            imageUrl: data.imageUrl,
            gtin: data.gtin,
            barcodeFixed: data.barcodeFixed,
            isAvailable: data.isAvailable,
          },
        });

        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save product';
        errors.push({ row: entry.row, sku: parsed.data.sku, message });
      }
    }

    await createAuditLog('IMPORT_PRODUCTS', null, {
      created,
      updated,
      failed: errors.length,
      filename: req.file.originalname,
    });

    res.json({
      created,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    const message = error instanceof Error ? error.message : 'Failed to import products';
    res.status(400).json({ error: message });
  }
};

/**
 * @swagger
 * /api/admin/products/import:
 *   post:
 *     summary: Import products from Excel and upsert by SKU
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import summary
 */
router.post('/products/import', (req: Request, res: Response): void => {
  excelUpload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload Excel file';
      res.status(400).json({ error: message });
      return;
    }
    void importProducts(req, res);
  });
});

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create a catalog product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created product
 */
router.post('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = productBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product payload' });
      return;
    }

    const product = await prisma.product.create({
      data: toCreateData(parsed.data),
    });

    await createAuditLog('CREATE_PRODUCT', null, { id: product.id, sku: product.sku });
    res.status(201).json(toProductDto(product));
  } catch (error) {
    if (isUniqueSkuError(error)) {
      res.status(409).json({ error: 'A product with this SKU already exists' });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.get('/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(toProductDto(product));
  } catch (error) {
    console.error('Error reading admin product:', error);
    res.status(500).json({ error: 'Failed to read product' });
  }
});

/**
 * @swagger
 * /api/admin/products/{id}:
 *   patch:
 *     summary: Update a catalog product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.patch('/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = productPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product payload' });
      return;
    }

    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const data: Prisma.ProductUpdateInput = {};
    const body = parsed.data;

    if (body.sku !== undefined) data.sku = body.sku;
    if (body.name !== undefined) data.name = body.name;
    if (body.origin !== undefined) data.origin = body.origin;
    if (body.category !== undefined) data.category = body.category;
    if (body.pricePerUnit !== undefined) data.pricePerUnit = new Prisma.Decimal(body.pricePerUnit);
    if (body.oldPrice !== undefined) {
      data.oldPrice = body.oldPrice === null ? null : new Prisma.Decimal(body.oldPrice);
    }
    if (body.pricePerKg !== undefined) {
      data.pricePerKg = body.pricePerKg === null ? null : new Prisma.Decimal(body.pricePerKg);
    }
    if (body.salesUnit !== undefined) data.salesUnit = body.salesUnit;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.gtin !== undefined) data.gtin = body.gtin;
    if (body.barcodeFixed !== undefined) data.barcodeFixed = body.barcodeFixed;
    if (body.isAvailable !== undefined) data.isAvailable = body.isAvailable;

    const product = await prisma.product.update({
      where: { id: existing.id },
      data,
    });

    await createAuditLog('UPDATE_PRODUCT', null, { id: product.id, sku: product.sku });
    res.json(toProductDto(product));
  } catch (error) {
    if (isUniqueSkuError(error)) {
      res.status(409).json({ error: 'A product with this SKU already exists' });
      return;
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete a catalog product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 */
router.delete('/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { id: true, sku: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await prisma.product.delete({ where: { id: existing.id } });
    await createAuditLog('DELETE_PRODUCT', null, { id: existing.id, sku: existing.sku });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
