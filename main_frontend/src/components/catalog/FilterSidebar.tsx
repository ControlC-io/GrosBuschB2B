import { useTranslation } from 'react-i18next';
import { badgeStyleFor } from './tagStyles';
import type { Facet } from '../../types/catalog';

interface FacetGroupProps {
  title: string;
  facets: Facet[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
}

const FacetGroup = ({ title, facets, selected, onToggle, labelFor }: FacetGroupProps) => {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
        {title}
      </h3>
      {facets.length === 0 ? (
        <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
          {t('catalog.filters.empty')}
        </p>
      ) : (
        <ul className="space-y-1">
          {facets.map((facet) => {
            const isSelected = selected.includes(facet.value);
            return (
              <li key={facet.value}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-background dark:hover:bg-background-dark">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(facet.value)}
                    className="h-4 w-4 rounded border-border accent-brand-orange"
                  />
                  <span className="flex-1 truncate text-textPrimary dark:text-textPrimary-dark">
                    {labelFor ? labelFor(facet.value) : facet.value}
                  </span>
                  <span className="text-xs text-textSecondary dark:text-textSecondary-dark">
                    {facet.count}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

interface FilterSidebarProps {
  origins: Facet[];
  tags: Facet[];
  selectedOrigins: string[];
  selectedTags: string[];
  onToggleOrigin: (value: string) => void;
  onToggleTag: (value: string) => void;
  onClear: () => void;
  activeFilterCount: number;
}

const FilterSidebar = ({
  origins,
  tags,
  selectedOrigins,
  selectedTags,
  onToggleOrigin,
  onToggleTag,
  onClear,
  activeFilterCount,
}: FilterSidebarProps) => {
  const { t } = useTranslation('common');

  const tagLabelFor = (value: string): string => {
    const style = badgeStyleFor(value);
    return style ? t(style.translationKey, { defaultValue: value }) : value;
  };

  return (
    <aside className="space-y-5 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-textPrimary dark:text-textPrimary-dark">
          {t('catalog.filters.title')}
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-orange px-2 py-0.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-brand-orange hover:underline"
          >
            {t('catalog.filters.clear')}
          </button>
        )}
      </div>

      <FacetGroup
        title={t('catalog.filters.origins')}
        facets={origins}
        selected={selectedOrigins}
        onToggle={onToggleOrigin}
      />

      <FacetGroup
        title={t('catalog.filters.tags')}
        facets={tags}
        selected={selectedTags}
        onToggle={onToggleTag}
        labelFor={tagLabelFor}
      />
    </aside>
  );
};

export default FilterSidebar;
