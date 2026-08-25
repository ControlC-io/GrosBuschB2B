import { useTranslation } from 'react-i18next';
import { DELIVERY_SLOT } from '../../config/catalog';
import type { Facet } from '../../types/catalog';

interface CatalogTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Facet[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CatalogTopBar = ({
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
}: CatalogTopBarProps) => {
  const { t } = useTranslation('common');

  const tabClasses = (isActive: boolean): string =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-orange text-white'
        : 'text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary dark:text-textSecondary-dark"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            aria-label={t('catalog.searchPlaceholder')}
            className="w-full rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark py-2.5 pl-10 pr-4 text-sm text-textPrimary dark:text-textPrimary-dark placeholder:text-textSecondary focus:border-brand-orange focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2">
          <svg
            className="h-4 w-4 text-brand-green"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
            />
          </svg>
          <span className="text-xs font-medium text-textSecondary dark:text-textSecondary-dark">
            {t('catalog.deliverySlot')}
          </span>
          <span className="text-sm font-semibold text-textPrimary dark:text-textPrimary-dark">
            {DELIVERY_SLOT.date} | {DELIVERY_SLOT.window}
          </span>
        </div>
      </div>

      <nav
        aria-label={t('catalog.categoriesLabel')}
        className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5"
      >
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          aria-current={activeCategory === '' ? 'page' : undefined}
          className={tabClasses(activeCategory === '')}
        >
          {t('catalog.allCategories')}
        </button>
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => onCategoryChange(category.value)}
            aria-current={activeCategory === category.value ? 'page' : undefined}
            className={tabClasses(activeCategory === category.value)}
          >
            {category.value}
            <span className="ml-1.5 text-xs opacity-70">{category.count}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CatalogTopBar;
