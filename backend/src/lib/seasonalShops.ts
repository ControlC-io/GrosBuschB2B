import { Prisma } from '@prisma/client';

export const SLUG_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type SeasonalShopWindow = {
  isEnabled: boolean;
  startsAt: Date;
  endsAt: Date;
};

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);

export const isShopLive = (shop: SeasonalShopWindow, now = new Date()): boolean =>
  shop.isEnabled && shop.startsAt <= now && shop.endsAt >= now;

export const visibleShopWhere = (now = new Date()): Prisma.SeasonalShopWhereInput => ({
  isEnabled: true,
  startsAt: { lte: now },
  endsAt: { gte: now },
});

export const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

export const parseStartDate = (raw: string): Date | null => {
  if (!DATE_ONLY_PATTERN.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const parseEndDate = (raw: string): Date | null => {
  if (!DATE_ONLY_PATTERN.test(raw)) return null;
  const date = new Date(`${raw}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const productsInLiveShopWhere = (
  shopSlug: string,
  now = new Date(),
): Prisma.ProductWhereInput => {
  if (shopSlug.length === 0) return {};
  return {
    seasonalShops: {
      some: {
        shop: {
          slug: shopSlug,
          ...visibleShopWhere(now),
        },
      },
    },
  };
};
