import { useTranslation } from 'react-i18next';
import { NEUTRAL_BADGE_CLASS, badgeStyleFor } from './tagStyles';

interface ProductBadgeProps {
  tag: string;
}

const ProductBadge = ({ tag }: ProductBadgeProps) => {
  const { t } = useTranslation('common');
  const style = badgeStyleFor(tag);

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-sm ${
        style ? style.className : NEUTRAL_BADGE_CLASS
      }`}
    >
      {style ? t(style.translationKey, { defaultValue: tag }) : tag}
    </span>
  );
};

export default ProductBadge;
