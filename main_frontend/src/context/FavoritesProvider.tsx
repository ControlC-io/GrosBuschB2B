import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../types/catalog';

const STORAGE_KEY = 'grosbuschb2b_favorites';

interface FavoritesContextValue {
  items: Product[];
  count: number;
  isFavorite: (sku: string) => boolean;
  toggleFavorite: (product: Product) => void;
  addProducts: (products: Product[]) => void;
  removeFavorite: (sku: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const isValidProduct = (value: unknown): value is Product => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Product;
  return (
    typeof candidate.sku === 'string' &&
    candidate.sku.length > 0 &&
    typeof candidate.name === 'string' &&
    typeof candidate.imageUrl === 'string' &&
    Array.isArray(candidate.tags)
  );
};

const readStoredFavorites = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const bySku = new Map<string, Product>();
    parsed.filter(isValidProduct).forEach((product) => {
      bySku.set(product.sku, product);
    });
    return Array.from(bySku.values());
  } catch {
    return [];
  }
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [items, setItems] = useState<Product[]>(() => readStoredFavorites());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const skuSet = useMemo(() => new Set(items.map((item) => item.sku)), [items]);

  const isFavorite = useCallback((sku: string) => skuSet.has(sku), [skuSet]);

  const toggleFavorite = useCallback((product: Product) => {
    setItems((current) => {
      const exists = current.some((item) => item.sku === product.sku);
      if (exists) return current.filter((item) => item.sku !== product.sku);
      return [...current, product];
    });
  }, []);

  const addProducts = useCallback((products: Product[]) => {
    setItems((current) => {
      const bySku = new Map(current.map((item) => [item.sku, item]));
      products.forEach((product) => {
        if (!isValidProduct(product)) return;
        bySku.set(product.sku, product);
      });
      return Array.from(bySku.values());
    });
  }, []);

  const removeFavorite = useCallback((sku: string) => {
    setItems((current) => current.filter((item) => item.sku !== sku));
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isFavorite,
      toggleFavorite,
      addProducts,
      removeFavorite,
    }),
    [items, isFavorite, toggleFavorite, addProducts, removeFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
