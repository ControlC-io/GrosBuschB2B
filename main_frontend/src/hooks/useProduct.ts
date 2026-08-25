import { useEffect, useState } from 'react';
import { useAuth } from '@shared/auth';
import { getProduct, ProductNotFoundError } from '../api/products';
import type { Product } from '../types/catalog';

export const useProduct = (sku: string | undefined) => {
  const { jwtToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!sku) {
      setProduct(null);
      setLoading(false);
      setNotFound(true);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const next = await getProduct(sku, controller.signal, jwtToken ?? undefined);
        setProduct(next);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = (err as Error).message;
        setProduct(null);
        if (err instanceof ProductNotFoundError) {
          setNotFound(true);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [sku, jwtToken, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  return { product, loading, error, notFound, reload };
};
