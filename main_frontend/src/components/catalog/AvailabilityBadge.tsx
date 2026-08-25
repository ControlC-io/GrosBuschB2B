import { useTranslation } from 'react-i18next';

interface AvailabilityBadgeProps {
  available: boolean;
  compact?: boolean;
}

const AvailabilityBadge = ({ available, compact = false }: AvailabilityBadgeProps) => {
  const { t } = useTranslation('common');

  const label = available ? t('catalog.availability.inStock') : t('catalog.availability.unavailable');
  const tone = available
    ? 'text-status-success bg-status-success-bg dark:text-status-success-dark dark:bg-status-success-bg-dark'
    : 'text-status-error bg-status-error-bg dark:text-status-error-dark dark:bg-status-error-bg-dark';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${tone} ${
        compact ? 'px-2 py-0.5 text-[11px] uppercase tracking-wide' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`rounded-full ${available ? 'bg-status-success dark:bg-status-success-dark' : 'bg-status-error dark:bg-status-error-dark'} ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />
      {label}
    </span>
  );
};

export default AvailabilityBadge;
