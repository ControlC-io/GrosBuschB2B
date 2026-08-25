import type {
  Product,
  ProductFacets,
  ProductFilters,
  ProductListResponse,
} from '../types/catalog';

const authHeaders = (token?: string): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

const readError = async (res: Response, fallback: string): Promise<Error> => {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return new Error(body.error ?? `${fallback} (${res.status})`);
};

const buildListQuery = (filters: ProductFilters): string => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.origins.length > 0) params.set('origins', filters.origins.join(','));
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.search) params.set('search', filters.search);
  params.set('sort', filters.sort);
  return params.toString();
};

export const listProducts = async (
  filters: ProductFilters,
  signal?: AbortSignal,
  token?: string,
): Promise<ProductListResponse> => {
  const res = await fetch(`/api/products?${buildListQuery(filters)}`, {
    headers: authHeaders(token),
    signal,
  });
  if (!res.ok) {
    throw await readError(res, 'Product list failed');
  }
  return res.json() as Promise<ProductListResponse>;
};

export const listFacets = async (
  filters: Pick<ProductFilters, 'category' | 'origins' | 'tags' | 'search'>,
  signal?: AbortSignal,
  token?: string,
): Promise<ProductFacets> => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.origins.length > 0) params.set('origins', filters.origins.join(','));
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/products/facets?${params.toString()}`, {
    headers: authHeaders(token),
    signal,
  });
  if (!res.ok) {
    throw await readError(res, 'Facet request failed');
  }
  return res.json() as Promise<ProductFacets>;
};

export class ProductNotFoundError extends Error {
  constructor(sku: string) {
    super(`Product not found: ${sku}`);
    this.name = 'ProductNotFoundError';
  }
}

export const getProduct = async (
  sku: string,
  signal?: AbortSignal,
  token?: string,
): Promise<Product> => {
  const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
    headers: authHeaders(token),
    signal,
  });
  if (res.status === 404) {
    throw new ProductNotFoundError(sku);
  }
  if (!res.ok) {
    throw await readError(res, 'Product request failed');
  }
  return res.json() as Promise<Product>;
};
