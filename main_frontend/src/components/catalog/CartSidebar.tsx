import { useTranslation } from 'react-i18next';
import { DELIVERY_SLOT, ORDER_MINIMUM_EUR } from '../../config/catalog';
import { useCart } from '../../context/CartProvider';
import { formatPrice } from '../../utils/format';

/**
 * Cart panel shown only when it contains articles. Mounted globally so the
 * summary stays visible on every page, not only on the catalog.
 */
const CartSidebar = () => {
  const { t, i18n } = useTranslation('common');
  const { lines, subtotal, increment, decrement } = useCart();
  const belowMinimum = subtotal < ORDER_MINIMUM_EUR;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-sm">
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

      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
        {lines.map((line) => (
          <li key={line.product.sku} className="flex gap-3">
            <img
              src={line.product.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md object-contain bg-background dark:bg-background-dark"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium text-textPrimary dark:text-textPrimary-dark">
                {line.product.name}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-brand-orange">
                {formatPrice(line.product.pricePerUnit * line.quantity, i18n.language)}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => decrement(line.product.sku)}
                  aria-label={t('catalog.card.decrease')}
                  className="h-6 w-6 rounded border border-border dark:border-border-dark text-sm"
                >
                  −
                </button>
                <span className="w-5 text-center text-xs font-semibold tabular-nums">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => increment(line.product)}
                  aria-label={t('catalog.card.increase')}
                  className="h-6 w-6 rounded bg-brand-orange text-sm font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="sticky bottom-0 space-y-3 border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t('catalog.cart.subtotal')}
          </span>
          <span className="text-lg font-bold text-brand-orange">
            {formatPrice(subtotal, i18n.language)}
          </span>
        </div>
        {belowMinimum && (
          <p className="rounded-md bg-brand-orange-bg px-3 py-2 text-xs text-brand-orange dark:bg-brand-orange/10">
            {t('catalog.cart.minimumNotice', {
              amount: formatPrice(ORDER_MINIMUM_EUR, i18n.language),
            })}
          </p>
        )}
        <button
          type="button"
          disabled={belowMinimum}
          className="w-full rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-hover disabled:opacity-50"
        >
          {t('catalog.cart.validate')}
        </button>
      </footer>
    </aside>
  );
};

export default CartSidebar;
