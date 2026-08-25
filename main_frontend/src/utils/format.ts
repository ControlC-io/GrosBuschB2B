import { CURRENCY, REFERENCE_WEIGHT_UNIT } from '../config/catalog';

export const formatPrice = (value: number, language: string): string => {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: CURRENCY,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
};

/** Reference price shown under the unit price, for example "26,85 € / KG". */
export const formatUnitPrice = (
  value: number,
  unit: string,
  language: string,
): string => `${formatPrice(value, language)} / ${unit}`;

/** Always formats the catalog weight reference as an amount per kilogram. */
export const formatReferencePrice = (value: number, language: string): string =>
  formatUnitPrice(value, REFERENCE_WEIGHT_UNIT, language);
