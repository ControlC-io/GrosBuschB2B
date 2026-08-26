import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine, DeliverySlot, Product } from '../types/catalog';

const STORAGE_KEY = 'grosbuschb2b_cart';

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  deliverySlot: DeliverySlot | null;
  pendingProduct: Product | null;
  slotPickerOpen: boolean;
  quantityOf: (sku: string) => number;
  setQuantity: (product: Product, quantity: number) => void;
  increment: (product: Product) => void;
  decrement: (sku: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  confirmDeliverySlot: (slot: DeliverySlot) => void;
  changeDeliverySlot: () => void;
  cancelSlotPicker: () => void;
}

interface StoredCart {
  lines: CartLine[];
  deliverySlot: DeliverySlot | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const isValidLine = (line: unknown): line is CartLine => {
  if (typeof line !== 'object' || line === null) return false;
  const candidate = line as CartLine;
  return (
    typeof candidate.quantity === 'number' &&
    candidate.quantity > 0 &&
    typeof candidate.product?.sku === 'string'
  );
};

const isValidSlot = (slot: unknown): slot is DeliverySlot => {
  if (typeof slot !== 'object' || slot === null) return false;
  const candidate = slot as DeliverySlot;
  return (
    typeof candidate.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) &&
    typeof candidate.window === 'string' &&
    candidate.window.length > 0
  );
};

const readStoredCart = (): StoredCart => {
  if (typeof window === 'undefined') return { lines: [], deliverySlot: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], deliverySlot: null };
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { lines: parsed.filter(isValidLine), deliverySlot: null };
    }
    if (typeof parsed !== 'object' || parsed === null) {
      return { lines: [], deliverySlot: null };
    }
    const record = parsed as { lines?: unknown; deliverySlot?: unknown };
    const lines = Array.isArray(record.lines) ? record.lines.filter(isValidLine) : [];
    const deliverySlot = isValidSlot(record.deliverySlot) ? record.deliverySlot : null;
    return { lines, deliverySlot };
  } catch {
    return { lines: [], deliverySlot: null };
  }
};

const addOrIncrementLine = (current: CartLine[], product: Product): CartLine[] => {
  const existing = current.find((line) => line.product.sku === product.sku);
  if (!existing) return [...current, { product, quantity: 1 }];
  return current.map((line) =>
    line.product.sku === product.sku
      ? { ...line, product, quantity: line.quantity + 1 }
      : line,
  );
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const stored = useMemo(() => readStoredCart(), []);
  const [lines, setLines] = useState<CartLine[]>(stored.lines);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot | null>(stored.deliverySlot);
  const [isOpen, setIsOpen] = useState(stored.lines.length > 0);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, deliverySlot }));
  }, [lines, deliverySlot]);

  useEffect(() => {
    if (lines.length === 0) setIsOpen(false);
  }, [lines.length]);

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
    if (lines.length === 0) {
      setPendingProduct(product);
      setSlotPickerOpen(true);
      return;
    }
    setLines((current) => addOrIncrementLine(current, product));
  }, [lines.length]);

  const decrement = useCallback((sku: string) => {
    setLines((current) =>
      current.flatMap((line) => {
        if (line.product.sku !== sku) return [line];
        const nextQuantity = line.quantity - 1;
        return nextQuantity > 0 ? [{ ...line, quantity: nextQuantity }] : [];
      }),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setIsOpen(false);
  }, []);

  const openCart = useCallback(() => {
    if (lines.length > 0) setIsOpen(true);
  }, [lines.length]);

  const closeCart = useCallback(() => setIsOpen(false), []);

  const confirmDeliverySlot = useCallback((slot: DeliverySlot) => {
    setDeliverySlot(slot);
    setSlotPickerOpen(false);
    if (pendingProduct) {
      setLines((current) => addOrIncrementLine(current, pendingProduct));
      setIsOpen(true);
    }
    setPendingProduct(null);
  }, [pendingProduct]);

  const changeDeliverySlot = useCallback(() => {
    setPendingProduct(null);
    setSlotPickerOpen(true);
  }, []);

  const cancelSlotPicker = useCallback(() => {
    setPendingProduct(null);
    setSlotPickerOpen(false);
  }, []);

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
      isOpen,
      deliverySlot,
      pendingProduct,
      slotPickerOpen,
      quantityOf,
      setQuantity,
      increment,
      decrement,
      clear,
      openCart,
      closeCart,
      confirmDeliverySlot,
      changeDeliverySlot,
      cancelSlotPicker,
    }),
    [
      lines,
      itemCount,
      subtotal,
      isOpen,
      deliverySlot,
      pendingProduct,
      slotPickerOpen,
      quantityOf,
      setQuantity,
      increment,
      decrement,
      clear,
      openCart,
      closeCart,
      confirmDeliverySlot,
      changeDeliverySlot,
      cancelSlotPicker,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
