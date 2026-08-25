import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@shared/auth';
import { useCart } from '../../context/CartProvider';
import type { Product } from '../../types/catalog';
import AvailabilityBadge from './AvailabilityBadge';
import FavoriteButton from './FavoriteButton';
import ProductBadge from './ProductBadge';
import ProductPrice from './ProductPrice';
import QuantityStepper from './QuantityStepper';

const MAX_VISIBLE_BADGES = 2;

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { quantityOf, increment, decrement } = useCart();
  const [favorite, setFavorite] = useState(false);
  const quantity = quantityOf(product.sku);
  const visibleTags = product.tags.slice(0, MAX_VISIBLE_BADGES);
  const extraTagCount = product.tags.length - visibleTags.length;
  const sheetHref = `/catalog/${encodeURIComponent(product.sku)}`;
  const canOrder = Boolean(user) && product.isAvailable;

  return (
    <article className="group relative flex flex-col rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 transition hover:shadow-md">
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
        {visibleTags.map((tag) => (
          <ProductBadge key={tag} tag={tag} />
        ))}
        {extraTagCount > 0 ? (
          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
            +{extraTagCount}
          </span>
        ) : null}
      </div>

      <FavoriteButton
        pressed={favorite}
        onToggle={() => setFavorite((value) => !value)}
        className="absolute right-3 top-3 z-10"
      />

      <Link
        to={sheetHref}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        aria-label={t('catalog.card.openSheet', { name: product.name })}
      >
        <div className={`relative flex h-36 items-center justify-center pt-6 ${product.isAvailable ? '' : 'opacity-60'}`}>
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-textPrimary dark:text-textPrimary-dark group-hover:text-brand-orange">
            {product.name}
          </h3>
          <p className="text-xs uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
            {product.origin}
          </p>
          <AvailabilityBadge available={product.isAvailable} compact />
        </div>
      </Link>

      <div className="mt-3 flex items-end justify-between gap-2">
        <ProductPrice product={product} size="card" />
        {user ? (
          <QuantityStepper
            quantity={quantity}
            onIncrement={() => increment(product)}
            onDecrement={() => decrement(product.sku)}
            disabled={!canOrder}
          />
        ) : null}
      </div>
    </article>
  );
};

export default ProductCard;
