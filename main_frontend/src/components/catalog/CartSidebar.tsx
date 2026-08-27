import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ORDER_MINIMUM_EUR } from '../../config/catalog';
import { useCart } from '../../context/CartProvider';
import { useFavorites } from '../../context/FavoritesProvider';
import { formatDeliveryDate, formatPrice } from '../../utils/format';

/**
 * Cart panel shown only when it contains articles. Mounted globally so the
 * summary stays visible on every page, not only on the catalog.
 */
const CartSidebar = () => {
  const { t, i18n } = useTranslation('common');
  const {
    lines,
    subtotal,
    increment,
    decrement,
    deliverySlot,
    closeCart,
    changeDeliverySlot,
  } = useCart();
  const { addProducts, isFavorite } = useFavorites();
  const belowMinimum = subtotal < ORDER_MINIMUM_EUR;
  const allAlreadyFavorite =
    lines.length > 0 && lines.every((line) => isFavorite(line.product.sku));
  const dateLabel = deliverySlot
    ? formatDeliveryDate(deliverySlot.date, i18n.language)
    : '';

  return (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-sm">
      <header className="border-b border-border dark:border-border-dark p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-bold text-textPrimary dark:text-textPrimary-dark">
            {t('catalog.cart.title')}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t('catalog.cart.close')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-textSecondary hover:bg-background hover:text-textPrimary dark:text-textSecondary-dark dark:hover:bg-background-dark dark:hover:text-textPrimary-dark"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={changeDeliverySlot}
          className="mt-2 w-full rounded-md border border-transparent px-0 py-1 text-left text-xs text-textSecondary hover:text-brand-orange dark:text-textSecondary-dark"
        >
          {deliverySlot
            ? t('catalog.cart.deliveryOn', {
                date: dateLabel,
                window: deliverySlot.window,
              })
            : t('catalog.cart.noDate')}
          <span className="ml-1 font-semibold text-brand-orange">
            {t('catalog.cart.changeDate')}
          </span>
        </button>
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
              <Link
                to={`/catalog/${encodeURIComponent(line.product.sku)}`}
                className="line-clamp-2 text-xs font-medium text-textPrimary dark:text-textPrimary-dark hover:text-brand-orange"
              >
                {line.product.name}
              </Link>
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
        {allAlreadyFavorite ? (
          <Link
            to="/favorites"
            onClick={closeCart}
            className="flex w-full items-center justify-center rounded-md border border-brand-orange px-4 py-2.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange-bg dark:hover:bg-brand-orange/10"
          >
            {t('catalog.cart.viewFavorites')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addProducts(lines.map((line) => line.product))}
            className="w-full rounded-md border border-brand-orange px-4 py-2.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange-bg dark:hover:bg-brand-orange/10"
          >
            {t('catalog.cart.addAllToFavorites')}
          </button>
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
