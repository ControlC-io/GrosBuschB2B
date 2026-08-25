import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine, Product } from '../types/catalog';

const STORAGE_KEY = 'grosbuschb2b_cart';

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  quantityOf: (sku: string) => number;
  setQuantity: (product: Product, quantity: number) => void;
  increment: (product: Product) => void;
  decrement: (sku: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const readStoredLines = (): CartLine[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => {
      if (typeof line !== 'object' || line === null) return false;
      const candidate = line as CartLine;
      return (
        typeof candidate.quantity === 'number' &&
        candidate.quantity > 0 &&
        typeof candidate.product?.sku === 'string'
      );
    });
  } catch {
    return [];
  }
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [lines, setLines] = useState<CartLine[]>(readStoredLines);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const setQuantity = useCallback((product: Product, quantity: number) => {
    if (!product.isAvailable && quantity > 0) return;
    setLines((current) => {
      const nextQuantity = Math.max(0, Math.floor(quantity));
      if (nextQuantity === 0) {
        return current.filter((line) => line.product.sku !== product.sku);
      }
      const existing = current.find((line) => line.product.sku === product.sku);
      if (!existing) {
        return [...current, { product, quantity: nextQuantity }];
      }
      return current.map((line) =>
        line.product.sku === product.sku ? { ...line, product, quantity: nextQuantity } : line,
      );
    });
  }, []);

  const increment = useCallback((product: Product) => {
    if (!product.isAvailable) return;
    setLines((current) => {
      const existing = current.find((line) => line.product.sku === product.sku);
      if (!existing) return [...current, { product, quantity: 1 }];
      return current.map((line) =>
        line.product.sku === product.sku
          ? { ...line, product, quantity: line.quantity + 1 }
          : line,
      );
    });
  }, []);

  const decrement = useCallback((sku: string) => {
    setLines((current) =>
      current.flatMap((line) => {
        if (line.product.sku !== sku) return [line];
        const nextQuantity = line.quantity - 1;
        return nextQuantity > 0 ? [{ ...line, quantity: nextQuantity }] : [];
      }),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const quantityOf = useCallback(
    (sku: string) => lines.find((line) => line.product.sku === sku)?.quantity ?? 0,
    [lines],
  );

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.pricePerUnit * line.quantity, 0);

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      quantityOf,
      setQuantity,
      increment,
      decrement,
      clear,
    }),
    [lines, itemCount, subtotal, quantityOf, setQuantity, increment, decrement, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
