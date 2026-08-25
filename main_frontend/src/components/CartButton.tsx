import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartProvider';

const CartButton = () => {
  const { t } = useTranslation('common');
  const { itemCount } = useCart();

  return (
    <Link
      to="/catalog"
      className="relative flex w-14 flex-col items-center gap-1 text-textPrimary dark:text-textPrimary-dark"
      aria-label={t('nav.cart')}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l2.4 12h11.2L21 7H6M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-brand-orange px-1 text-center text-[10px] font-bold leading-5 text-white">
            {itemCount}
          </span>
        )}
      </span>
      <span className="text-[0.62rem] font-bold uppercase tracking-wide">{t('nav.cart')}</span>
    </Link>
  );
};

export default CartButton;
