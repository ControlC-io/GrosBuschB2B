import { useEffect, useMemo, useState } from 'react';
import { getAdminApiBase } from '../lib/apiBase';
import SeasonalShopProductPicker, { type CatalogProduct } from './SeasonalShopProductPicker';

type SeasonalShop = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
  sortOrder: number;
  isLive: boolean;
  productCount: number;
  productIds: string[];
};

type ShopForm = {
  nameEn: string;
  nameFr: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
  sortOrder: string;
};

const API_BASE = getAdminApiBase();
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

const adminHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-admin-secret': ADMIN_SECRET,
});

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const plusDaysIso = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyForm = (): ShopForm => ({
  nameEn: '',
  nameFr: '',
  slug: '',
  startsAt: todayIso(),
  endsAt: plusDaysIso(30),
  isEnabled: true,
  sortOrder: '0',
});

const formFromShop = (shop: SeasonalShop): ShopForm => ({
  nameEn: shop.nameEn,
  nameFr: shop.nameFr,
  slug: shop.slug,
  startsAt: shop.startsAt,
  endsAt: shop.endsAt,
  isEnabled: shop.isEnabled,
  sortOrder: String(shop.sortOrder),
});

const statusLabel = (shop: SeasonalShop): { text: string; className: string } => {
  if (!shop.isEnabled) {
    return { text: 'Disabled', className: 'bg-gray-100 text-gray-600 dark:bg-background-dark dark:text-textSecondary-dark' };
  }
  if (shop.isLive) {
    return { text: 'Live', className: 'bg-green-100 text-green-700' };
  }
  const now = todayIso();
  if (shop.startsAt > now) {
    return { text: 'Scheduled', className: 'bg-blue-100 text-blue-700' };
  }
  return { text: 'Ended', className: 'bg-amber-100 text-amber-800' };
};

const SeasonalShopsTab = () => {
  const [shops, setShops] = useState<SeasonalShop[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<ShopForm>(emptyForm);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShop = shops.find((shop) => shop.id === selectedId) ?? null;

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    const matches = products.filter((product) => {
      if (query.length === 0) return true;
      const haystack = [
        product.name,
        product.sku,
        product.category,
        product.origin,
        ...product.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    return [...matches].sort((a, b) => {
      const taggedDelta = Number(taggedIds.includes(b.id)) - Number(taggedIds.includes(a.id));
      if (taggedDelta !== 0) return taggedDelta;
      return a.name.localeCompare(b.name);
    });
  }, [products, productQuery, taggedIds]);

  const load = async () => {
    try {
      setLoading(true);
      const [shopsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/seasonal-shops`, { headers: adminHeaders() }),
        fetch(`${API_BASE}/api/products?pageSize=100&sort=name`),
      ]);

      if (!shopsRes.ok) {
        throw new Error(`Failed to fetch seasonal shops: ${shopsRes.statusText}`);
      }
      if (!productsRes.ok) {
        throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
      }

      const shopsData = (await shopsRes.json()) as SeasonalShop[];
      const productsData = (await productsRes.json()) as { items: CatalogProduct[] };
      setShops(shopsData);
      setProducts(productsData.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasonal shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setSelectedId('new');
    setForm(emptyForm());
    setTaggedIds([]);
    setProductQuery('');
    setPreviewId(null);
  };

  const openShop = (shop: SeasonalShop) => {
    setSelectedId(shop.id);
    setForm(formFromShop(shop));
    setTaggedIds(shop.productIds);
    setProductQuery('');
    setPreviewId(null);
  };

  const payloadFromForm = () => ({
    nameEn: form.nameEn.trim(),
    nameFr: form.nameFr.trim(),
    slug: form.slug.trim() || undefined,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    isEnabled: form.isEnabled,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
  });

  const saveShop = async () => {
    setSaving(true);
    setError(null);
    try {
      const isCreate = selectedId === 'new';
      const url = isCreate
        ? `${API_BASE}/api/admin/seasonal-shops`
        : `${API_BASE}/api/admin/seasonal-shops/${selectedId}`;
      const response = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify(payloadFromForm()),
      });
      const body = (await response.json().catch(() => ({}))) as SeasonalShop & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to save shop (${response.status})`);
      }

      if (!isCreate) {
        const tagRes = await fetch(`${API_BASE}/api/admin/seasonal-shops/${body.id}/products`, {
          method: 'PUT',
          headers: adminHeaders(),
          body: JSON.stringify({ productIds: taggedIds }),
        });
        const tagged = (await tagRes.json().catch(() => ({}))) as SeasonalShop & { error?: string };
        if (!tagRes.ok) {
          throw new Error(tagged.error ?? `Failed to tag products (${tagRes.status})`);
        }
        await load();
        openShop(tagged);
        return;
      }

      await load();
      openShop(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save seasonal shop');
    } finally {
      setSaving(false);
    }
  };

  const deleteShop = async (shop: SeasonalShop) => {
    if (!window.confirm(`Delete the seasonal shop "${shop.nameEn}"?`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/seasonal-shops/${shop.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to delete shop (${response.status})`);
      }
      if (selectedId === shop.id) {
        setSelectedId(null);
        setForm(emptyForm());
        setTaggedIds([]);
        setPreviewId(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete seasonal shop');
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setTaggedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-textSecondary dark:text-textSecondary-dark">Loading seasonal shops...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark">Seasonal shops</h2>
          <p className="mt-1 text-sm text-textSecondary dark:text-textSecondary-dark">
            Create time boxed boutiques (Valentine, New Year, Autumn). Live shops appear in the category strip under search.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-on-light dark:text-secondary-on-dark"
        >
          + New shop
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => void load()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-3">
          {shops.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-5 text-sm text-textSecondary dark:border-border-dark dark:bg-surface-dark dark:text-textSecondary-dark">
              No seasonal shop yet. Create one to start tagging products.
            </div>
          ) : (
            shops.map((shop) => {
              const status = statusLabel(shop);
              const active = selectedId === shop.id;
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => openShop(shop)}
                  className={`w-full rounded-lg border p-4 text-left shadow-sm transition-colors ${
                    active
                      ? 'border-secondary bg-surface dark:bg-surface-dark'
                      : 'border-border bg-surface hover:border-secondary dark:border-border-dark dark:bg-surface-dark'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-textPrimary dark:text-textPrimary-dark">{shop.nameFr}</p>
                      <p className="text-xs text-textSecondary dark:text-textSecondary-dark">{shop.nameEn}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-textSecondary dark:text-textSecondary-dark">
                    {shop.startsAt} → {shop.endsAt}
                  </p>
                  <p className="mt-1 text-xs text-textSecondary dark:text-textSecondary-dark">
                    {shop.productCount} tagged products
                  </p>
                </button>
              );
            })
          )}
        </div>

        {selectedId === null ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-textSecondary dark:border-border-dark dark:bg-surface-dark dark:text-textSecondary-dark">
            Select a shop or create a new one.
          </div>
        ) : (
          <form
            className="space-y-6 rounded-lg border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark"
            onSubmit={(event) => {
              event.preventDefault();
              void saveShop();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Name FR</span>
                <input
                  required
                  value={form.nameFr}
                  onChange={(event) => setForm((current) => ({ ...current, nameFr: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Name EN</span>
                <input
                  required
                  value={form.nameEn}
                  onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="auto from English name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Start date</span>
                <input
                  type="date"
                  required
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">End date</span>
                <input
                  type="date"
                  required
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 dark:border-border-dark dark:bg-background-dark"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(event) => setForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                className="h-4 w-4 accent-secondary"
              />
              <span className="text-textPrimary dark:text-textPrimary-dark">Enabled (appears in the nav when the date window is current)</span>
            </label>

            {selectedId !== 'new' && (
              <SeasonalShopProductPicker
                products={filteredProducts}
                taggedIds={taggedIds}
                query={productQuery}
                onQueryChange={setProductQuery}
                onToggle={toggleProduct}
                previewId={previewId}
                onPreview={setPreviewId}
              />
            )}

            {selectedId === 'new' && (
              <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
                Save the shop first, then tag products into it.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedShop ? (
                <button
                  type="button"
                  onClick={() => void deleteShop(selectedShop)}
                  disabled={saving}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete shop
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-on-light disabled:opacity-50 dark:text-secondary-on-dark"
              >
                {saving ? 'Saving...' : selectedId === 'new' ? 'Create shop' : 'Save shop and tags'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SeasonalShopsTab;
