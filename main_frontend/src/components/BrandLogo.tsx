import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BrandLogo = () => {
  const { t } = useTranslation('common');

  return (
    <Link to="/catalog" className="group flex shrink-0 flex-col leading-none">
      <span className="relative font-serif text-[1.85rem] font-bold tracking-tight text-textPrimary dark:text-textPrimary-dark sm:text-[2.1rem]">
        Grosb
        <span className="relative inline-block">
          u
          <svg
            className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 text-brand-green"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2c3.2 4.2 5.5 7.8 5.5 11.2A5.5 5.5 0 0112 18.7 5.5 5.5 0 016.5 13.2C6.5 9.8 8.8 6.2 12 2z" />
          </svg>
        </span>
        sch
      </span>
      <span className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-brand-orange">
        {t('nav.tagline')}
      </span>
    </Link>
  );
};

export default BrandLogo;
