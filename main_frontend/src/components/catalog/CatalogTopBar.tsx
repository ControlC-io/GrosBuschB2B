import { useTranslation } from 'react-i18next';
import { getFirstAvailableSlot } from '../../config/catalog';
import { useCart } from '../../context/CartProvider';
import { formatDeliveryDate } from '../../utils/format';

const CatalogTopBar = () => {
  const { t, i18n } = useTranslation('common');
  const { deliverySlot, itemCount } = useCart();
  const slot = itemCount > 0 && deliverySlot ? deliverySlot : getFirstAvailableSlot();
  const dateLabel = formatDeliveryDate(slot.date, i18n.language);

  return (
    <div className="flex justify-end">
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
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
          {dateLabel} | {slot.window}
        </span>
      </div>
    </div>
  );
};

export default CatalogTopBar;
