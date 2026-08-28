import type { SeasonalShopNavItem } from '../types/catalog';

const readError = async (res: Response, fallback: string): Promise<Error> => {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return new Error(body.error ?? `${fallback} (${res.status})`);
};

export const listActiveSeasonalShops = async (
  signal?: AbortSignal,
): Promise<SeasonalShopNavItem[]> => {
  const res = await fetch('/api/seasonal-shops', { signal });
  if (!res.ok) {
    throw await readError(res, 'Seasonal shop list failed');
  }
  const body = (await res.json()) as { items: SeasonalShopNavItem[] };
  return body.items;
};
