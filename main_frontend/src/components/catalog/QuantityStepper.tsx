import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const QuantityStepper = ({
  quantity,
  onIncrement,
  onDecrement,
  disabled = false,
  size = 'sm',
}: QuantityStepperProps) => {
  const { t } = useTranslation('common');
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pulseTimer.current !== null) {
        window.clearTimeout(pulseTimer.current);
      }
    };
  }, []);

  const handleIncrement = () => {
    onIncrement();
    setPulse(true);
    if (pulseTimer.current !== null) {
      window.clearTimeout(pulseTimer.current);
    }
    pulseTimer.current = window.setTimeout(() => setPulse(false), 280);
  };

  const buttonSize = size === 'md' ? 'h-9 w-9 text-lg' : 'h-7 w-7 text-base';
  const qtyWidth = size === 'md' ? 'w-8 text-base' : 'w-6 text-sm';

  const plusButton = (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleIncrement();
      }}
      disabled={disabled}
      aria-label={t('catalog.card.increase')}
      className={`${buttonSize} rounded bg-brand-orange font-bold leading-none text-white hover:bg-brand-orange-hover disabled:hover:bg-brand-orange ${
        pulse ? 'scale-110' : ''
      } transition-transform`}
    >
      +
    </button>
  );

  if (quantity === 0) {
    return <div className="flex shrink-0 items-center">{plusButton}</div>;
  }

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-border dark:border-border-dark p-0.5">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDecrement();
        }}
        aria-label={t('catalog.card.decrease')}
        className={`${buttonSize} rounded text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark`}
      >
        −
      </button>
      <span className={`${qtyWidth} text-center font-semibold tabular-nums`}>{quantity}</span>
      {plusButton}
    </div>
  );
};

export default QuantityStepper;
