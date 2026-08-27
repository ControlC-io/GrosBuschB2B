import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductGrid from '../components/catalog/ProductGrid';
import { useFavorites } from '../context/FavoritesProvider';

const Favorites = () => {
  const { t } = useTranslation('common');
  const { items, count } = useFavorites();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{t('favorites.title')}</h1>
          <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t('favorites.subtitle')}
          </p>
        </header>

        {count === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-16 text-center">
            <svg
              className="h-10 w-10 text-textSecondary dark:text-textSecondary-dark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"
              />
            </svg>
            <h2 className="text-base font-semibold">{t('favorites.emptyTitle')}</h2>
            <p className="max-w-sm text-sm text-textSecondary dark:text-textSecondary-dark">
              {t('favorites.emptyDescription')}
            </p>
            <Link
              to="/catalog"
              className="mt-1 rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover"
            >
              {t('favorites.browseCatalog')}
            </Link>
          </div>
        ) : (
          <section className="mt-6 space-y-4">
            <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
              {t('favorites.count', { total: count })}
            </p>
            <ProductGrid products={items} showQuantity={false} />
          </section>
        )}
      </div>
    </div>
  );
};

export default Favorites;
