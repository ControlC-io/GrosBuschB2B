import { useEffect } from 'react';

export type CatalogProduct = {
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

const formatEuro = (value: number): string =>
  new Intl.NumberFormat('fr-LU', { style: 'currency', currency: 'EUR' }).format(value);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-textPrimary dark:text-textPrimary-dark">{value}</dd>
  </div>
);

interface ProductDetailModalProps {
  product: CatalogProduct;
  tagged: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const ProductDetailModal = ({ product, tagged, onToggle, onClose }: ProductDetailModalProps) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close product detail"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`product-detail-${product.sku}`}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl dark:border-border-dark dark:bg-surface-dark sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id={`product-detail-${product.sku}`}
            className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark"
          >
            Product detail
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-textSecondary hover:bg-background dark:text-textSecondary-dark dark:hover:bg-background-dark"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="flex items-center justify-center rounded-lg bg-background p-4 dark:bg-background-dark">
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`max-h-44 w-full object-contain ${product.isAvailable ? '' : 'opacity-60'}`}
            />
          </div>
          <div className="min-w-0 space-y-3">
            <p className="text-base font-semibold leading-snug text-textPrimary dark:text-textPrimary-dark">
              {product.name}
            </p>
            <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
              {product.sku} · {product.category}
            </p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                product.isAvailable
                  ? 'bg-status-success-bg text-status-success dark:bg-status-success-bg-dark dark:text-status-success-dark'
                  : 'bg-status-error-bg text-status-error dark:bg-status-error-bg-dark dark:text-status-error-dark'
              }`}
            >
              {product.isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <div>
              <p className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark">
                {formatEuro(product.pricePerUnit)}
              </p>
              {product.oldPrice !== null && (
                <p className="text-sm text-textSecondary line-through dark:text-textSecondary-dark">
                  {formatEuro(product.oldPrice)}
                </p>
              )}
              {product.pricePerKg !== null && (
                <p className="text-xs text-textSecondary dark:text-textSecondary-dark">
                  {formatEuro(product.pricePerKg)} / kg
                </p>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Origin" value={product.origin} />
          <DetailRow label="Category" value={product.category} />
          <DetailRow label="Sales unit" value={product.salesUnit} />
          <DetailRow label="GTIN" value={product.gtin ?? 'Not set'} />
          <DetailRow
            label="Barcode"
            value={product.gtin ? (product.barcodeFixed ? 'Fixed consumer barcode' : 'Variable weight barcode') : 'Not set'}
          />
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">Labels</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {product.tags.length > 0 ? (
                product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-textPrimary dark:bg-background-dark dark:text-textPrimary-dark"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-textSecondary dark:text-textSecondary-dark">No labels</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm dark:border-border-dark"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              tagged
                ? 'border border-border text-textPrimary dark:border-border-dark dark:text-textPrimary-dark'
                : 'bg-secondary text-secondary-on-light dark:text-secondary-on-dark'
            }`}
          >
            {tagged ? 'Remove from shop' : 'Add to shop'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SeasonalShopProductPickerProps {
  products: CatalogProduct[];
  taggedIds: string[];
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (productId: string) => void;
  previewId: string | null;
  onPreview: (productId: string | null) => void;
}

const SeasonalShopProductPicker = ({
  products,
  taggedIds,
  query,
  onQueryChange,
  onToggle,
  previewId,
  onPreview,
}: SeasonalShopProductPickerProps) => {
  const preview = products.find((product) => product.id === previewId) ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-textPrimary dark:text-textPrimary-dark">
          Tagged products ({taggedIds.length})
        </h3>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
          placeholder="Search by name, SKU, origin or label"
          className="w-72 max-w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm dark:border-border-dark dark:bg-background-dark"
        />
      </div>

      <div className="max-h-[28rem] overflow-y-auto rounded-md border border-border dark:border-border-dark">
        {products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-textSecondary dark:text-textSecondary-dark">
            No product matches this search.
          </p>
        ) : (
          products.map((product) => {
            const tagged = taggedIds.includes(product.id);
            return (
              <div
                key={product.id}
                className={`flex items-start gap-3 border-b border-border px-3 py-3 last:border-b-0 dark:border-border-dark ${
                  tagged ? 'bg-background/70 dark:bg-background-dark/40' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={tagged}
                  onChange={() => onToggle(product.id)}
                  className="mt-5 h-4 w-4 shrink-0 accent-secondary"
                  aria-label={`Tag ${product.name}`}
                />
                <button
                  type="button"
                  onClick={() => onPreview(product.id)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background dark:bg-background-dark"
                  aria-label={`View detail for ${product.name}`}
                >
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onPreview(product.id)}
                    className="block w-full truncate text-left text-sm font-medium text-textPrimary hover:underline dark:text-textPrimary-dark"
                  >
                    {product.name}
                  </button>
                  <p className="mt-0.5 text-xs text-textSecondary dark:text-textSecondary-dark">
                    {product.sku} · {product.category} · {product.origin}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary dark:text-textPrimary-dark">
                    {formatEuro(product.pricePerUnit)}
                    {product.oldPrice !== null && (
                      <span className="ml-2 text-xs font-normal text-textSecondary line-through dark:text-textSecondary-dark">
                        {formatEuro(product.oldPrice)}
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        product.isAvailable
                          ? 'bg-status-success-bg text-status-success dark:bg-status-success-bg-dark dark:text-status-success-dark'
                          : 'bg-status-error-bg text-status-error dark:bg-status-error-bg-dark dark:text-status-error-dark'
                      }`}
                    >
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-background px-2 py-0.5 text-[11px] text-textSecondary dark:bg-background-dark dark:text-textSecondary-dark"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPreview(product.id)}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-textPrimary hover:bg-background dark:border-border-dark dark:text-textPrimary-dark dark:hover:bg-background-dark"
                >
                  View detail
                </button>
              </div>
            );
          })
        )}
      </div>

      {preview && (
        <ProductDetailModal
          product={preview}
          tagged={taggedIds.includes(preview.id)}
          onToggle={() => onToggle(preview.id)}
          onClose={() => onPreview(null)}
        />
      )}
    </section>
  );
};

export default SeasonalShopProductPicker;
