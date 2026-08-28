export interface Product {
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
}

export interface Facet {
  value: string;
  count: number;
}

export interface ProductFacets {
  categories: Facet[];
  origins: Facet[];
  tags: Facet[];
}

export const PRODUCT_SORTS = ['name', 'price_asc', 'price_desc'] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface ProductFilters {
  category: string;
  shop: string;
  origins: string[];
  tags: string[];
  search: string;
  sort: ProductSort;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export const EMPTY_FACETS: ProductFacets = {
  categories: [],
  origins: [],
  tags: [],
};

export interface DeliverySlot {
  date: string;
  window: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export const DEFAULT_FILTERS: ProductFilters = {
  category: '',
  shop: '',
  origins: [],
  tags: [],
  search: '',
  sort: 'name',
};

export interface SeasonalShopNavItem {
  slug: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
}
