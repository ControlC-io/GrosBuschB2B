import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminApiBase } from '../lib/apiBase';

type AdminProduct = {
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
};

type ProductForm = {
  sku: string;
  name: string;
  origin: string;
  category: string;
  pricePerUnit: string;
  oldPrice: string;
  pricePerKg: string;
  salesUnit: string;
  tags: string;
  imageUrl: string;
  gtin: string;
  barcodeFixed: boolean;
  isAvailable: boolean;
};

type ProductListResponse = {
  items: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
};

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; sku: string; message: string }>;
};

const API_BASE = getAdminApiBase();
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';
const PAGE_SIZE = 25;

const adminJsonHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-admin-secret': ADMIN_SECRET,
});

const adminSecretHeaders = (): HeadersInit => ({
  'x-admin-secret': ADMIN_SECRET,
});

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary dark:border-border-dark dark:bg-background-dark dark:text-textPrimary-dark';

const emptyForm = (): ProductForm => ({
  sku: '',
  name: '',
  origin: '',
  category: '',
  pricePerUnit: '',
  oldPrice: '',
  pricePerKg: '',
  salesUnit: 'PCS',
  tags: '',
  imageUrl: '',
  gtin: '',
  barcodeFixed: false,
  isAvailable: true,
});

const formFromProduct = (product: AdminProduct): ProductForm => ({
  sku: product.sku,
  name: product.name,
  origin: product.origin,
  category: product.category,
  pricePerUnit: String(product.pricePerUnit),
  oldPrice: product.oldPrice === null ? '' : String(product.oldPrice),
  pricePerKg: product.pricePerKg === null ? '' : String(product.pricePerKg),
  salesUnit: product.salesUnit,
  tags: product.tags.join(', '),
  imageUrl: product.imageUrl,
  gtin: product.gtin ?? '',
  barcodeFixed: product.barcodeFixed,
  isAvailable: product.isAvailable,
});

const optionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return Number(trimmed);
};

const payloadFromForm = (form: ProductForm) => ({
  sku: form.sku.trim(),
  name: form.name.trim(),
  origin: form.origin.trim(),
  category: form.category.trim(),
  pricePerUnit: Number(form.pricePerUnit),
  oldPrice: optionalNumber(form.oldPrice),
  pricePerKg: optionalNumber(form.pricePerKg),
  salesUnit: form.salesUnit.trim() || 'PCS',
  tags: form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0),
  imageUrl: form.imageUrl.trim(),
  gtin: form.gtin.trim() || null,
  barcodeFixed: form.barcodeFixed,
  isAvailable: form.isAvailable,
});

const formatPrice = (value: number): string => `\u20AC ${value.toFixed(2)}`;

type ProductEditorModalProps = {
  selectedId: string | 'new';
  form: ProductForm;
  saving: boolean;
  brokenPreview: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void;
  onPreviewError: () => void;
};

const ProductEditorModal = ({
  selectedId,
  form,
  saving,
  brokenPreview,
  error,
  onClose,
  onSave,
  onDelete,
  onFieldChange,
  onPreviewError,
}: ProductEditorModalProps) => {
  const isCreate = selectedId === 'new';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close product detail"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl dark:border-border-dark dark:bg-surface-dark"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-border-dark">
          <div>
            <h3
              id="product-editor-title"
              className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark"
            >
              {isCreate ? 'New product' : 'Product detail'}
            </h3>
            {!isCreate && (
              <p className="mt-0.5 text-sm text-textSecondary dark:text-textSecondary-dark">
                Review every field and save your changes.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-textSecondary hover:bg-background dark:text-textSecondary-dark dark:hover:bg-background-dark"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {!isCreate && (
            <div className="grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <div className="flex items-center justify-center rounded-lg bg-background p-4 dark:bg-background-dark">
                {form.imageUrl.trim().length > 0 && !brokenPreview ? (
                  <img
                    src={form.imageUrl}
                    alt={form.name}
                    onError={onPreviewError}
                    className={`max-h-44 w-full object-contain ${form.isAvailable ? '' : 'opacity-60'}`}
                  />
                ) : (
                  <span className="text-xs text-textSecondary dark:text-textSecondary-dark">No image</span>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-base font-semibold leading-snug text-textPrimary dark:text-textPrimary-dark">
                  {form.name || 'Untitled product'}
                </p>
                <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
                  {form.sku || 'No SKU'} · {form.category || 'No category'}
                </p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    form.isAvailable
                      ? 'bg-status-success-bg text-status-success dark:bg-status-success-bg-dark dark:text-status-success-dark'
                      : 'bg-status-error-bg text-status-error dark:bg-status-error-bg-dark dark:text-status-error-dark'
                  }`}
                >
                  {form.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                {form.pricePerUnit !== '' && (
                  <p className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark">
                    {formatPrice(Number(form.pricePerUnit) || 0)}
                    <span className="ml-1 text-sm font-normal text-textSecondary dark:text-textSecondary-dark">
                      / {form.salesUnit || 'PCS'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">SKU</span>
              <input required value={form.sku} onChange={(event) => onFieldChange('sku', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Name</span>
              <input required value={form.name} onChange={(event) => onFieldChange('name', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Origin</span>
              <input required value={form.origin} onChange={(event) => onFieldChange('origin', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Category</span>
              <input required value={form.category} onChange={(event) => onFieldChange('category', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Price per unit</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerUnit}
                onChange={(event) => onFieldChange('pricePerUnit', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Old price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.oldPrice}
                onChange={(event) => onFieldChange('oldPrice', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Price per kg</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerKg}
                onChange={(event) => onFieldChange('pricePerKg', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Sales unit</span>
              <input value={form.salesUnit} onChange={(event) => onFieldChange('salesUnit', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Tags (comma separated)</span>
              <input value={form.tags} onChange={(event) => onFieldChange('tags', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">Image URL</span>
              <input required value={form.imageUrl} onChange={(event) => onFieldChange('imageUrl', event.target.value)} className={inputClass} />
            </label>
            {isCreate && form.imageUrl.trim().length > 0 && !brokenPreview && (
              <img
                src={form.imageUrl}
                alt="Product preview"
                onError={onPreviewError}
                className="h-24 w-24 rounded object-cover bg-background dark:bg-background-dark"
              />
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-textPrimary dark:text-textPrimary-dark">GTIN</span>
              <input value={form.gtin} onChange={(event) => onFieldChange('gtin', event.target.value)} className={inputClass} />
            </label>
            <div className="flex flex-col justify-end gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.barcodeFixed}
                  onChange={(event) => onFieldChange('barcodeFixed', event.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
                <span className="text-textPrimary dark:text-textPrimary-dark">Fixed barcode</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) => onFieldChange('isAvailable', event.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
                <span className="text-textPrimary dark:text-textPrimary-dark">Available</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 dark:border-border-dark">
          {!isCreate ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Delete product
            </button>
          ) : (
            <button type="button" onClick={onClose} className="text-sm text-textSecondary hover:underline dark:text-textSecondary-dark">
              Cancel
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isCreate && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-4 py-2 text-sm dark:border-border-dark"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-on-light disabled:opacity-50 dark:text-secondary-on-dark"
            >
              {saving ? 'Saving...' : isCreate ? 'Create product' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const ProductsTab = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [brokenPreview, setBrokenPreview] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (nextPage: number, nextSearch: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
      });
      if (nextSearch.length > 0) {
        params.set('search', nextSearch);
      }

      const response = await fetch(`${API_BASE}/api/admin/products?${params.toString()}`, {
        headers: adminSecretHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = (await response.json()) as ProductListResponse;
      setProducts(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      setSearch(nextSearch);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    void load(page, search);
  }, [page, search, load]);

  const openCreate = () => {
    setError(null);
    setSelectedId('new');
    setForm(emptyForm());
    setBrokenPreview(false);
  };

  const openProduct = (product: AdminProduct) => {
    setError(null);
    setSelectedId(product.id);
    setForm(formFromProduct(product));
    setBrokenPreview(false);
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/products/${product.id}`, {
          headers: adminSecretHeaders(),
        });
        if (!response.ok) return;
        const fresh = (await response.json()) as AdminProduct;
        setForm(formFromProduct(fresh));
      } catch {
        // Keep the list row data if the detail request fails.
      }
    })();
  };

  const closeEditor = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setBrokenPreview(false);
  };

  const saveProduct = async () => {
    setSaving(true);
    setError(null);
    try {
      const isCreate = selectedId === 'new';
      const url = isCreate
        ? `${API_BASE}/api/admin/products`
        : `${API_BASE}/api/admin/products/${selectedId}`;
      const response = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: adminJsonHeaders(),
        body: JSON.stringify(payloadFromForm(form)),
      });
      const body = (await response.json().catch(() => ({}))) as AdminProduct & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to save product (${response.status})`);
      }
      await load(page, search);
      setSelectedId(body.id);
      setForm(formFromProduct(body));
      setBrokenPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (selectedId === null || selectedId === 'new') return;
    if (!window.confirm(`Delete the product "${form.name}"?`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${selectedId}`, {
        method: 'DELETE',
        headers: adminSecretHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to delete product (${response.status})`);
      }
      closeEditor();
      await load(page, search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (path: string, filename: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: adminSecretHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to download ${filename}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const importExcel = async (file: File) => {
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${API_BASE}/api/admin/products/import`, {
        method: 'POST',
        headers: adminSecretHeaders(),
        body,
      });
      const result = (await response.json().catch(() => ({}))) as ImportResult & { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? `Failed to import Excel (${response.status})`);
      }
      setImportResult(result);
      await load(1, search);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'imageUrl') {
      setBrokenPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark">Products</h2>
          <p className="mt-1 text-sm text-textSecondary dark:text-textSecondary-dark">
            Open a product to see its detail and edit it. You can also import an Excel file.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void downloadFile('/api/admin/products/template', 'products-template.xlsx')}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-textPrimary dark:border-border-dark dark:text-textPrimary-dark"
          >
            Download template
          </button>
          <button
            type="button"
            onClick={() => void downloadFile('/api/admin/products/export', 'products-catalog.xlsx')}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-textPrimary dark:border-border-dark dark:text-textPrimary-dark"
          >
            Export catalog
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-textPrimary disabled:opacity-50 dark:border-border-dark dark:text-textPrimary-dark"
          >
            {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-on-light dark:text-secondary-on-dark"
          >
            + New product
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void importExcel(file);
              }
            }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => void load(page, search)} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {importResult && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm dark:border-border-dark dark:bg-surface-dark">
          <p className="text-textPrimary dark:text-textPrimary-dark">
            Import finished: {importResult.created} created, {importResult.updated} updated, {importResult.failed} failed.
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-auto space-y-1 text-textSecondary dark:text-textSecondary-dark">
              {importResult.errors.map((item) => (
                <li key={`${item.row}-${item.sku}`}>
                  Row {item.row}{item.sku ? ` (${item.sku})` : ''}: {item.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or SKU"
          className={`${inputClass} max-w-sm`}
        />
        <span className="text-sm text-textSecondary dark:text-textSecondary-dark">
          {total} product{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm dark:border-border-dark dark:bg-surface-dark">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-textSecondary dark:text-textSecondary-dark">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-textSecondary dark:text-textSecondary-dark">
            No products found. Create one or import an Excel file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm dark:divide-border-dark">
              <thead className="bg-background dark:bg-background-dark">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Image</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Origin</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-textSecondary dark:text-textSecondary-dark">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-textSecondary dark:text-textSecondary-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {products.map((product) => {
                  const active = selectedId === product.id;
                  return (
                    <tr
                      key={product.id}
                      onClick={() => openProduct(product)}
                      className={`cursor-pointer ${
                        active
                          ? 'bg-background dark:bg-background-dark'
                          : 'hover:bg-background dark:hover:bg-background-dark'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover bg-background dark:bg-background-dark"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-textPrimary dark:text-textPrimary-dark">{product.sku}</td>
                      <td className="px-4 py-3 text-textPrimary dark:text-textPrimary-dark">{product.name}</td>
                      <td className="px-4 py-3 text-textSecondary dark:text-textSecondary-dark">{product.category}</td>
                      <td className="px-4 py-3 text-textSecondary dark:text-textSecondary-dark">{product.origin}</td>
                      <td className="px-4 py-3 text-textPrimary dark:text-textPrimary-dark">{formatPrice(product.pricePerUnit)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 dark:bg-background-dark dark:text-textSecondary-dark'
                          }`}
                        >
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openProduct(product);
                          }}
                          className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-on-light dark:text-secondary-on-dark"
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50 dark:border-border-dark"
          >
            Previous
          </button>
          <span className="text-textSecondary dark:text-textSecondary-dark">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50 dark:border-border-dark"
          >
            Next
          </button>
        </div>
      )}

      {selectedId !== null && (
        <ProductEditorModal
          selectedId={selectedId}
          form={form}
          saving={saving}
          brokenPreview={brokenPreview}
          error={error}
          onClose={closeEditor}
          onSave={() => void saveProduct()}
          onDelete={() => void deleteProduct()}
          onFieldChange={updateField}
          onPreviewError={() => setBrokenPreview(true)}
        />
      )}
    </div>
  );
};

export default ProductsTab;
