import { useTranslation } from 'react-i18next';
import { DELIVERY_SLOT, ORDER_MINIMUM_EUR } from '../../config/catalog';
import { formatPrice } from '../../utils/format';

/**
 * Static shell of the persistent cart panel. Quantities, subtotal and the order
 * minimum alert are wired in the cart phase of the PoC.
 */
const CartSidebarPlaceholder = () => {
  const { t, i18n } = useTranslation('common');

  return (
    <aside className="flex h-full flex-col rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
      <header className="space-y-1 border-b border-border dark:border-border-dark p-4">
        <h2 className="text-sm font-bold text-textPrimary dark:text-textPrimary-dark">
          {t('catalog.cart.title')}
        </h2>
        <p className="text-xs text-textSecondary dark:text-textSecondary-dark">
          {t('catalog.cart.deliveryOn', {
            date: DELIVERY_SLOT.date,
            window: DELIVERY_SLOT.window,
          })}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <svg
          className="h-8 w-8 text-textSecondary dark:text-textSecondary-dark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l2.4 12h11.2L21 7H6M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z"
          />
        </svg>
        <p className="text-sm font-medium text-textPrimary dark:text-textPrimary-dark">
          {t('catalog.cart.empty')}
        </p>
        <p className="text-xs text-textSecondary dark:text-textSecondary-dark">
          {t('catalog.cart.emptyHint')}
        </p>
      </div>

      <footer className="space-y-3 border-t border-border dark:border-border-dark p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t('catalog.cart.subtotal')}
          </span>
          <span className="text-lg font-bold text-brand-orange">
            {formatPrice(0, i18n.language)}
          </span>
        </div>
        <p className="rounded-md bg-brand-orange-bg px-3 py-2 text-xs text-brand-orange dark:bg-brand-orange/10">
          {t('catalog.cart.minimumNotice', {
            amount: formatPrice(ORDER_MINIMUM_EUR, i18n.language),
          })}
        </p>
        <button
          type="button"
          disabled
          className="w-full rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t('catalog.cart.validate')}
        </button>
        <p className="text-center text-xs text-textSecondary dark:text-textSecondary-dark">
          {t('catalog.cart.comingSoon')}
        </p>
      </footer>
    </aside>
  );
};

export default CartSidebarPlaceholder;
