import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@shared/auth';
import { listFacets, listProducts } from '../api/products';
import {
  DEFAULT_FILTERS,
  EMPTY_FACETS,
  PRODUCT_SORTS,
  type Product,
  type ProductFacets,
  type ProductFilters,
  type ProductSort,
} from '../types/catalog';

const SEARCH_DEBOUNCE_MS = 250;

const splitParam = (raw: string | null): string[] =>
  raw === null
    ? []
    : raw
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

const parseSort = (raw: string | null): ProductSort =>
  PRODUCT_SORTS.find((sort) => sort === raw) ?? DEFAULT_FILTERS.sort;

const parseFilters = (params: URLSearchParams): ProductFilters => ({
  category: params.get('category') ?? '',
  origins: splitParam(params.get('origins')),
  tags: splitParam(params.get('tags')),
  search: params.get('search') ?? '',
  sort: parseSort(params.get('sort')),
});

const serializeFilters = (filters: ProductFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.origins.length > 0) params.set('origins', filters.origins.join(','));
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
  return params;
};

const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

/**
 * Drives the catalog page. Active filters live in the query string so that a
 * filtered view stays shareable and the browser back button keeps working,
 * while the search field is debounced to avoid one request per keystroke.
 */
export const useProducts = () => {
  const { jwtToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [searchInput, setSearchInput] = useState(filters.search);
  const searchDirtyRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<ProductFacets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const applyFilters = useCallback(
    (next: ProductFilters, replace = false) => {
      setSearchParams(serializeFilters(next), { replace });
    },
    [setSearchParams],
  );

  const setSearch = useCallback((value: string) => {
    searchDirtyRef.current = true;
    setSearchInput(value);
  }, []);

  const setCategory = useCallback(
    (category: string) => {
      const current = filtersRef.current;
      applyFilters({ ...current, category: current.category === category ? '' : category });
    },
    [applyFilters],
  );

  const toggleOrigin = useCallback(
    (origin: string) => {
      const current = filtersRef.current;
      applyFilters({ ...current, origins: toggleValue(current.origins, origin) }, true);
    },
    [applyFilters],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const current = filtersRef.current;
      applyFilters({ ...current, tags: toggleValue(current.tags, tag) }, true);
    },
    [applyFilters],
  );

  const setSort = useCallback(
    (sort: ProductSort) => {
      applyFilters({ ...filtersRef.current, sort }, true);
    },
    [applyFilters],
  );

  const clearFilters = useCallback(() => {
    searchDirtyRef.current = false;
    setSearchInput('');
    applyFilters(DEFAULT_FILTERS);
  }, [applyFilters]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  // Push the debounced search term into the query string
  useEffect(() => {
    if (!searchDirtyRef.current) return undefined;

    const timer = window.setTimeout(() => {
      searchDirtyRef.current = false;
      applyFilters({ ...filtersRef.current, search: searchInput }, true);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput, applyFilters]);

  // Keep the field aligned with the URL on back and forward navigation
  useEffect(() => {
    if (searchDirtyRef.current) return;
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [list, facetGroups] = await Promise.all([
          listProducts(filters, controller.signal, jwtToken ?? undefined),
          listFacets(
            { category: filters.category, search: filters.search },
            controller.signal,
            jwtToken ?? undefined,
          ),
        ]);
        setProducts(list.items);
        setTotal(list.total);
        setFacets(facetGroups);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [jwtToken, filters, reloadKey]);

  const activeFilterCount = filters.origins.length + filters.tags.length;

  return {
    filters,
    searchInput,
    products,
    total,
    facets,
    loading,
    error,
    activeFilterCount,
    setSearch,
    setCategory,
    toggleOrigin,
    toggleTag,
    setSort,
    clearFilters,
    reload,
  };
};
