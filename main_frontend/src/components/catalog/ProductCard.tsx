import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductBadge from './ProductBadge';
import { formatPrice, formatUnitPrice } from '../../utils/format';
import { useCart } from '../../context/CartProvider';
import type { Product } from '../../types/catalog';

const MAX_VISIBLE_BADGES = 2;

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t, i18n } = useTranslation('common');
  const { quantityOf, increment, decrement } = useCart();
  const [favorite, setFavorite] = useState(false);
  const quantity = quantityOf(product.sku);

  const visibleTags = product.tags.slice(0, MAX_VISIBLE_BADGES);
  const hasDiscount = product.oldPrice !== null && product.oldPrice > product.pricePerUnit;

  return (
    <article className="group relative flex flex-col rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 transition hover:shadow-md">
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
        {visibleTags.map((tag) => (
          <ProductBadge key={tag} tag={tag} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFavorite((value) => !value)}
        aria-pressed={favorite}
        aria-label={t('catalog.card.favorite')}
        title={t('catalog.card.favorite')}
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark"
      >
        <svg
          className={`h-5 w-5 ${favorite ? 'text-brand-orange' : ''}`}
          viewBox="0 0 24 24"
          fill={favorite ? 'currentColor' : 'none'}
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

      <div className="flex h-36 items-center justify-center pt-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-textPrimary dark:text-textPrimary-dark">
          {product.name}
        </h3>
        <p className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
          {product.origin}
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-orange">
              {formatPrice(product.pricePerUnit, i18n.language)}
            </span>
            {hasDiscount && product.oldPrice !== null && (
              <span className="text-xs line-through text-textSecondary dark:text-textSecondary-dark">
                {formatPrice(product.oldPrice, i18n.language)}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-textSecondary dark:text-textSecondary-dark">
            {product.pricePerKg === null
              ? t('catalog.card.perSalesUnit', { unit: product.salesUnit })
              : formatUnitPrice(product.pricePerKg, product.salesUnit, i18n.language)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-md border border-border dark:border-border-dark p-0.5">
          <button
            type="button"
            onClick={() => decrement(product.sku)}
            disabled={quantity === 0}
            aria-label={t('catalog.card.decrease')}
            className="h-7 w-7 rounded text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark disabled:opacity-40"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => increment(product)}
            aria-label={t('catalog.card.increase')}
            className="h-7 w-7 rounded bg-brand-orange text-base font-bold leading-none text-white hover:bg-brand-orange-hover"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
