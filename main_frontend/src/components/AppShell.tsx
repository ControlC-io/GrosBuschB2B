import type { ReactNode } from 'react';
import { useCart } from '../context/CartProvider';
import GlobalCartRail from './GlobalCartRail';

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { itemCount } = useCart();
  const cartOpen = itemCount > 0;

  return (
    <div className={`relative flex-1 min-w-0 ${cartOpen ? 'xl:pr-80 pb-52 xl:pb-0' : ''}`}>
      {children}
      <GlobalCartRail />
    </div>
  );
};

export default AppShell;
