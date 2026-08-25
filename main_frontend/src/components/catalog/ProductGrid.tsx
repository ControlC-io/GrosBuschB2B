import ProductCard from './ProductCard';
import type { Product } from '../../types/catalog';

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
    {products.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);

export default ProductGrid;
