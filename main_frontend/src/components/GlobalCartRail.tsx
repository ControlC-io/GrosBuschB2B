import { useCart } from '../context/CartProvider';
import CartSidebar from './catalog/CartSidebar';

/**
 * Persistent cart rail. Hidden while empty or closed, then shown as a fixed
 * panel on every page.
 */
const GlobalCartRail = () => {
  const { itemCount, isOpen } = useCart();

  if (!isOpen || itemCount === 0) return null;

  return (
    <>
      <div className="hidden xl:flex fixed right-0 top-[8.5rem] bottom-0 z-30 w-80 p-3">
        <CartSidebar />
      </div>
      <div id="cart-rail" className="xl:hidden fixed inset-x-0 bottom-0 z-40 p-3">
        <div className="mx-auto max-h-[45vh] max-w-3xl overflow-hidden rounded-lg shadow-lg">
          <CartSidebar />
        </div>
      </div>
    </>
  );
};

export default GlobalCartRail;
