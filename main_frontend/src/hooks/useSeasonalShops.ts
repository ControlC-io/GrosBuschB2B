import { useEffect, useState } from 'react';
import { listActiveSeasonalShops } from '../api/seasonalShops';
import type { SeasonalShopNavItem } from '../types/catalog';

export const useSeasonalShops = () => {
  const [shops, setShops] = useState<SeasonalShopNavItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const items = await listActiveSeasonalShops(controller.signal);
        setShops(items);
      } catch (error) {
        if (controller.signal.aborted) return;
        setShops([]);
        console.error('Failed to load seasonal shops:', error);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  return shops;
};
