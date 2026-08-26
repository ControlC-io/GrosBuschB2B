import type { ReactNode } from 'react';
import { useAuth } from '@shared/auth';
import { useCart } from '../context/CartProvider';
import DeliverySlotPicker from './catalog/DeliverySlotPicker';
import GlobalCartRail from './GlobalCartRail';

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { user } = useAuth();
  const { itemCount, isOpen } = useCart();
  const cartOpen = Boolean(user) && isOpen && itemCount > 0;

  return (
    <div className={`relative flex-1 min-w-0 ${cartOpen ? 'xl:pr-80 pb-52 xl:pb-0' : ''}`}>
      {children}
      {user ? <GlobalCartRail /> : null}
      <DeliverySlotPicker />
    </div>
  );
};

export default AppShell;
