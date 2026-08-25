import { useTranslation } from 'react-i18next';
import CatalogEmptyState from '../components/catalog/CatalogEmptyState';
import CatalogSkeleton from '../components/catalog/CatalogSkeleton';
import CatalogTopBar from '../components/catalog/CatalogTopBar';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductGrid from '../components/catalog/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { PRODUCT_SORTS, type ProductSort } from '../types/catalog';

const SORT_LABEL_KEYS: Record<ProductSort, string> = {
  name: 'catalog.sort.name',
  price_asc: 'catalog.sort.priceAsc',
  price_desc: 'catalog.sort.priceDesc',
};

const Catalog = () => {
  const { t } = useTranslation('common');
  const {
    filters,
    products,
    total,
    facets,
    loading,
    error,
    activeFilterCount,
    toggleOrigin,
    toggleTag,
    setSort,
    clearFilters,
    reload,
  } = useProducts();

  const hasActiveFilters =
    activeFilterCount > 0 || filters.category !== '' || filters.search !== '';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('catalog.title')}</h1>
          <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t('catalog.subtitle')}
          </p>
        </header>

        <CatalogTopBar />

        <div className="mt-5 grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <FilterSidebar
              origins={facets.origins}
              tags={facets.tags}
              selectedOrigins={filters.origins}
              selectedTags={filters.tags}
              onToggleOrigin={toggleOrigin}
              onToggleTag={toggleTag}
              onClear={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
                {t('catalog.resultCount', { total })}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-textSecondary dark:text-textSecondary-dark">
                  {t('catalog.sort.label')}
                </span>
                <select
                  value={filters.sort}
                  onChange={(event) => setSort(event.target.value as ProductSort)}
                  className="rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2 py-1.5 text-sm focus:border-brand-orange focus:outline-none"
                >
                  {PRODUCT_SORTS.map((sort) => (
                    <option key={sort} value={sort}>
                      {t(SORT_LABEL_KEYS[sort])}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error !== null ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error">
                <span>{t('catalog.errors.loadFailed', { message: error })}</span>
                <button type="button" onClick={reload} className="font-semibold hover:underline">
                  {t('catalog.retry')}
                </button>
              </div>
            ) : loading ? (
              <CatalogSkeleton />
            ) : products.length === 0 ? (
              <CatalogEmptyState onClear={clearFilters} canClear={hasActiveFilters} />
            ) : (
              <ProductGrid products={products} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
