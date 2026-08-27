import { useTranslation } from 'react-i18next';

interface FavoriteButtonProps {
  pressed: boolean;
  onToggle: () => void;
  className?: string;
}

const FavoriteButton = ({ pressed, onToggle, className = '' }: FavoriteButtonProps) => {
  const { t } = useTranslation('common');

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={pressed}
      aria-label={pressed ? t('catalog.card.unfavorite') : t('catalog.card.favorite')}
      title={pressed ? t('catalog.card.unfavorite') : t('catalog.card.favorite')}
      className={`rounded-full p-1.5 text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark ${className}`}
    >
      <svg
        className={`h-5 w-5 ${pressed ? 'text-brand-orange' : ''}`}
        viewBox="0 0 24 24"
        fill={pressed ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 000-7.78z"
        />
      </svg>
    </button>
  );
};

export default FavoriteButton;
