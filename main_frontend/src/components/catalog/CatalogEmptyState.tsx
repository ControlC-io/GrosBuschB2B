import { useTranslation } from 'react-i18next';

interface CatalogEmptyStateProps {
  onClear: () => void;
  canClear: boolean;
}

const CatalogEmptyState = ({ onClear, canClear }: CatalogEmptyStateProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-16 text-center">
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
          d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
        />
      </svg>
      <h3 className="text-base font-semibold text-textPrimary dark:text-textPrimary-dark">
        {t('catalog.empty.title')}
      </h3>
      <p className="max-w-sm text-sm text-textSecondary dark:text-textSecondary-dark">
        {t('catalog.empty.description')}
      </p>
      {canClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          {t('catalog.filters.clear')}
        </button>
      )}
    </div>
  );
};

export default CatalogEmptyState;
