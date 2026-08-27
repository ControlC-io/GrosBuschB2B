import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@shared/auth';
import AvailabilityBadge from '../components/catalog/AvailabilityBadge';
import FavoriteButton from '../components/catalog/FavoriteButton';
import ProductBadge from '../components/catalog/ProductBadge';
import ProductPrice from '../components/catalog/ProductPrice';
import QuantityStepper from '../components/catalog/QuantityStepper';
import EanBarcode from '../components/catalog/EanBarcode';
import { useCart } from '../context/CartProvider';
import { useProduct } from '../hooks/useProduct';
import { formatPrice } from '../utils/format';

const ProductSheet = () => {
  const { sku } = useParams<{ sku: string }>();
  const { t, i18n } = useTranslation('common');
  const { user } = useAuth();
  const { product, loading, error, notFound, reload } = useProduct(sku);
  const { quantityOf, increment, decrement } = useCart();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(false);
  }, [sku]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
              <div className="h-64 rounded bg-background dark:bg-background-dark" />
              <div className="space-y-4">
                <div className="h-4 w-32 rounded bg-background dark:bg-background-dark" />
                <div className="h-8 w-3/4 rounded bg-background dark:bg-background-dark" />
                <div className="h-4 w-48 rounded bg-background dark:bg-background-dark" />
                <div className="h-10 w-40 rounded bg-background dark:bg-background-dark" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark px-4 py-16">
        <div className="mx-auto max-w-xl rounded-md border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error">
          <p>{t('catalog.sheet.loadFailed', { message: error })}</p>
          <button type="button" onClick={reload} className="mt-2 font-semibold hover:underline">
            {t('catalog.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (notFound || product === null) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark">
          {t('catalog.sheet.notFoundTitle')}
        </h1>
        <p className="mt-2 text-sm text-textSecondary dark:text-textSecondary-dark">
          {t('catalog.sheet.notFoundDescription')}
        </p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          {t('catalog.sheet.back')}
        </Link>
      </div>
    );
  }

  const quantity = quantityOf(product.sku);
  const canOrder = Boolean(user) && product.isAvailable;
  const unitLabel = t(`catalog.units.${product.salesUnit}`, { defaultValue: product.salesUnit });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/catalog"
          className="text-sm font-medium text-textSecondary dark:text-textSecondary-dark hover:text-brand-orange"
        >
          {t('catalog.sheet.back')}
        </Link>

        <article className="mt-4 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="relative flex items-center justify-center rounded-lg bg-background dark:bg-background-dark p-6">
              <FavoriteButton
                pressed={favorite}
                onToggle={() => setFavorite((value) => !value)}
                className="absolute right-3 top-3"
              />
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`max-h-72 w-full object-contain ${product.isAvailable ? '' : 'opacity-60'}`}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <ProductBadge key={tag} tag={tag} />
                ))}
              </div>

              <div>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
                <p className="mt-2 text-sm text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.sku', { sku: product.sku })}
                </p>
              </div>

              <AvailabilityBadge available={product.isAvailable} />

              <ProductPrice product={product} size="sheet" />

              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <QuantityStepper
                    quantity={quantity}
                    onIncrement={() => increment(product)}
                    onDecrement={() => decrement(product.sku)}
                    disabled={!canOrder}
                    size="md"
                  />
                ) : (
                  <Link
                    to="/login"
                    className="rounded-md bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
                  >
                    {t('catalog.sheet.signInToOrder')}
                  </Link>
                )}
                {user && !product.isAvailable ? (
                  <p className="text-sm text-status-error dark:text-status-error-dark">
                    {t('catalog.availability.cannotAdd')}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <section className="mt-8 border-t border-border dark:border-border-dark pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
              {t('catalog.sheet.attributes')}
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.articleCode')}
                </dt>
                <dd className="mt-1 text-sm font-medium">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.name')}
                </dt>
                <dd className="mt-1 text-sm font-medium">{product.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.price')}
                </dt>
                <dd className="mt-1 text-sm font-medium text-brand-orange">
                  {formatPrice(product.pricePerUnit, i18n.language)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.availability')}
                </dt>
                <dd className="mt-1">
                  <AvailabilityBadge available={product.isAvailable} compact />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.salesUnit')}
                </dt>
                <dd className="mt-1 text-sm font-medium">{unitLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.origin')}
                </dt>
                <dd className="mt-1 text-sm font-medium">{product.origin}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.category')}
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <Link
                    to={`/catalog?category=${encodeURIComponent(product.category)}`}
                    className="hover:text-brand-orange"
                  >
                    {product.category}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.gtin')}
                </dt>
                <dd className="mt-2 space-y-2">
                  {product.gtin ? (
                    <EanBarcode
                      gtin={product.gtin}
                      label={t('catalog.sheet.barcodeLabel', { gtin: product.gtin })}
                    />
                  ) : (
                    <span className="text-sm text-textSecondary dark:text-textSecondary-dark">
                      {t('catalog.sheet.gtinMissing')}
                    </span>
                  )}
                  {product.gtin ? (
                    <p
                      className={`inline-flex max-w-full flex-col rounded-md px-2 py-1 text-xs ${
                        product.barcodeFixed
                          ? 'bg-status-success-bg text-status-success dark:bg-status-success-bg-dark dark:text-status-success-dark'
                          : 'bg-background text-textSecondary dark:bg-background-dark dark:text-textSecondary-dark'
                      }`}
                    >
                      <span className="font-semibold">
                        {product.barcodeFixed
                          ? t('catalog.sheet.barcodeFixed')
                          : t('catalog.sheet.barcodeVariable')}
                      </span>
                      <span>
                        {product.barcodeFixed
                          ? t('catalog.sheet.barcodeFixedHint')
                          : t('catalog.sheet.barcodeVariableHint')}
                      </span>
                    </p>
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sheet.labels')}
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {product.tags.length > 0 ? (
                    product.tags.map((tag) => <ProductBadge key={tag} tag={tag} />)
                  ) : (
                    <span className="text-sm text-textSecondary dark:text-textSecondary-dark">
                      {t('catalog.sheet.noLabels')}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </article>
      </div>
    </div>
  );
};

export default ProductSheet;
