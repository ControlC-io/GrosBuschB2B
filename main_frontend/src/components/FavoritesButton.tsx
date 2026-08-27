import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../context/FavoritesProvider';

const FavoritesButton = () => {
  const { t } = useTranslation('common');
  const { count } = useFavorites();
  const location = useLocation();
  const active = location.pathname === '/favorites';

  return (
    <Link
      to="/favorites"
      className={`relative flex w-14 flex-col items-center gap-1 ${
        active ? 'text-brand-green' : 'text-textPrimary dark:text-textPrimary-dark'
      }`}
      aria-label={t('nav.favorites')}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-brand-orange px-1 text-center text-[10px] font-bold leading-5 text-white">
            {count}
          </span>
        )}
      </span>
      <span className="text-[0.62rem] font-bold uppercase tracking-wide">{t('nav.favorites')}</span>
    </Link>
  );
};

export default FavoritesButton;
