import { useTranslation } from 'react-i18next';
import { formatPrice, formatReferencePrice } from '../../utils/format';
import type { Product } from '../../types/catalog';

interface ProductPriceProps {
  product: Product;
  size?: 'card' | 'sheet';
}

const ProductPrice = ({ product, size = 'card' }: ProductPriceProps) => {
  const { t, i18n } = useTranslation('common');
  const hasDiscount = product.oldPrice !== null && product.oldPrice > product.pricePerUnit;
  const unitLabel = t(`catalog.units.${product.salesUnit}`, { defaultValue: product.salesUnit });
  const isSheet = size === 'sheet';

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`font-bold text-brand-orange ${isSheet ? 'text-3xl' : 'text-lg'}`}>
          {formatPrice(product.pricePerUnit, i18n.language)}
        </span>
        {hasDiscount && product.oldPrice !== null && (
          <span
            className={`line-through text-textSecondary dark:text-textSecondary-dark ${
              isSheet ? 'text-base' : 'text-xs'
            }`}
          >
            {formatPrice(product.oldPrice, i18n.language)}
          </span>
        )}
      </div>
      {product.pricePerKg !== null ? (
        <p
          className={`truncate text-textSecondary dark:text-textSecondary-dark ${
            isSheet ? 'mt-1 text-sm' : 'text-xs'
          }`}
        >
          {formatReferencePrice(product.pricePerKg, i18n.language)}
        </p>
      ) : null}
      {(isSheet || product.pricePerKg === null) && (
        <p
          className={`truncate text-textSecondary dark:text-textSecondary-dark ${
            isSheet ? 'mt-0.5 text-sm' : 'text-xs'
          }`}
        >
          {t('catalog.card.perSalesUnit', { unit: unitLabel })}
        </p>
      )}
    </div>
  );
};

export default ProductPrice;
