/**
 * Catalog display configuration. The delivery slot and the order minimum come
 * from the environment for the PoC and will later be served by the delivery
 * planning API.
 */
export const DELIVERY_SLOT = {
  date: import.meta.env.VITE_DELIVERY_SLOT_DATE ?? '28/08/2026',
  window: import.meta.env.VITE_DELIVERY_SLOT_WINDOW ?? '11:00 – 12:00',
} as const;

const parsedMinimum = Number(import.meta.env.VITE_ORDER_MINIMUM_EUR);

export const ORDER_MINIMUM_EUR = Number.isFinite(parsedMinimum) && parsedMinimum > 0
  ? parsedMinimum
  : 30;

export const CURRENCY = 'EUR';

/** Weight reference used under the selling price (F017). */
export const REFERENCE_WEIGHT_UNIT = 'KG';
