import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parseEndDate, parseStartDate } from '../lib/seasonalShops';

const prisma = new PrismaClient();

const DATA_FILE = path.resolve(__dirname, '../../prisma/data/products.json');

// Shape of the mocked catalog file provided for the PoC
type MockProduct = {
  id: string;
  name: string;
  origin: string;
  category: string;
  price_per_unit: number;
  price_per_kg: string;
  old_price?: number;
  tags: string[];
  image_url: string;
};

const ean13CheckDigit = (digits12: string): string => {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(digits12[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
};

/** Builds a PoC EAN 13 from the catalog SKU (prefix 200 for in house articles). */
const gtinFromSku = (sku: string): string => {
  const numeric = sku.replace(/\D/g, '').padStart(6, '0').slice(-6);
  const body = `200000${numeric}`;
  return `${body}${ean13CheckDigit(body)}`;
};

/** Antipasti, pre packed and fresh cut keep the same consumer barcode. */
const hasFixedBarcode = (name: string, category: string): boolean =>
  /antipasti/i.test(name) || category === 'Pre-packed' || category === 'Fresh Cut';

type ParsedKgPrice = {
  pricePerKg: Prisma.Decimal | null;
  salesUnit: string;
};

const PRICE_PER_KG_PATTERN = /^\s*([\d.]+)\s*€\s*\/\s*([A-Z]+)\s*$/i;

const parseSalesUnit = (name: string): string => {
  if (/\bBUNCH\b/i.test(name)) return 'BUNCH';
  if (/\bPCS\b/i.test(name)) return 'PCS';
  if (/\b\d+(?:[.,]\d+)?\s*KG\b/i.test(name)) return 'KG';
  if (/\b\d+(?:[.,]\d+)?\s*L\b/i.test(name)) return 'L';
  if (/\b\d+(?:[.,]\d+)?\s*G\b/i.test(name)) return 'PCS';
  return 'PCS';
};

/**
 * The mocked file stores the reference price as a display string such as
 * "26.85 €/KG", or "N/A" when the article is not sold by weight. Splitting it
 * gives a numeric amount usable for sorting plus the sales unit shown on cards.
 */
const parseKgPrice = (raw: string, name: string): ParsedKgPrice => {
  const match = PRICE_PER_KG_PATTERN.exec(raw);
  const salesUnit = parseSalesUnit(name);

  if (!match) {
    return { pricePerKg: null, salesUnit };
  }

  return {
    pricePerKg: new Prisma.Decimal(match[1]),
    salesUnit,
  };
};

const readMockProducts = (): MockProduct[] => {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of products in ${DATA_FILE}`);
  }

  return parsed as MockProduct[];
};

const seedProducts = async () => {
  console.log('Seeding catalog products...');

  const mockProducts = readMockProducts();

  for (const mock of mockProducts) {
    const { pricePerKg, salesUnit } = parseKgPrice(mock.price_per_kg, mock.name);

    const data = {
      name: mock.name,
      origin: mock.origin,
      category: mock.category,
      pricePerUnit: new Prisma.Decimal(mock.price_per_unit),
      oldPrice: mock.old_price === undefined ? null : new Prisma.Decimal(mock.old_price),
      pricePerKg,
      salesUnit,
      tags: mock.tags,
      imageUrl: mock.image_url,
      gtin: gtinFromSku(mock.id),
      barcodeFixed: hasFixedBarcode(mock.name, mock.category),
      isAvailable: !mock.tags.some((tag) => tag.toLowerCase() === 'coming soon'),
    };

    const product = await prisma.product.upsert({
      where: { sku: mock.id },
      update: data,
      create: { sku: mock.id, ...data },
    });

    console.log(`  ✓ ${product.sku} ${product.name}`);
  }

  const total = await prisma.product.count();
  console.log(`\nCatalog seeded successfully! ${total} products in database.`);

  await seedSeasonalShops();
};

type SeedShop = {
  slug: string;
  nameEn: string;
  nameFr: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
  productSkus: string[];
};

const SEED_SHOPS: SeedShop[] = [
  {
    slug: 'valentines',
    nameEn: "Valentine's Day",
    nameFr: 'Saint Valentin',
    startsAt: '2026-01-20',
    endsAt: '2026-02-16',
    sortOrder: 10,
    productSkus: ['p001', 'p002', 'p011', 'p016'],
  },
  {
    slug: 'autumn',
    nameEn: 'Autumn',
    nameFr: 'Automne',
    startsAt: '2026-08-15',
    endsAt: '2026-11-30',
    sortOrder: 20,
    productSkus: ['p004', 'p005', 'p010', 'p014', 'p015', 'p019'],
  },
  {
    slug: 'new_year',
    nameEn: 'New Year',
    nameFr: 'Nouvel An',
    startsAt: '2026-12-15',
    endsAt: '2027-01-10',
    sortOrder: 30,
    productSkus: ['p001', 'p003', 'p013', 'p016', 'p018'],
  },
];

const seedSeasonalShops = async () => {
  console.log('\nSeeding seasonal shops...');

  for (const seed of SEED_SHOPS) {
    const startsAt = parseStartDate(seed.startsAt);
    const endsAt = parseEndDate(seed.endsAt);
    if (!startsAt || !endsAt) {
      throw new Error(`Invalid date window for shop ${seed.slug}`);
    }

    const shop = await prisma.seasonalShop.upsert({
      where: { slug: seed.slug },
      update: {
        nameEn: seed.nameEn,
        nameFr: seed.nameFr,
        startsAt,
        endsAt,
        isEnabled: true,
        sortOrder: seed.sortOrder,
      },
      create: {
        slug: seed.slug,
        nameEn: seed.nameEn,
        nameFr: seed.nameFr,
        startsAt,
        endsAt,
        isEnabled: true,
        sortOrder: seed.sortOrder,
      },
    });

    const products = await prisma.product.findMany({
      where: { sku: { in: seed.productSkus } },
      select: { id: true, sku: true },
    });

    await prisma.productSeasonalShop.deleteMany({ where: { shopId: shop.id } });
    if (products.length > 0) {
      await prisma.productSeasonalShop.createMany({
        data: products.map((product) => ({ productId: product.id, shopId: shop.id })),
      });
    }

    console.log(`  ✓ ${shop.slug} (${products.length} products)`);
  }
};

const main = async () => {
  try {
    await seedProducts();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
