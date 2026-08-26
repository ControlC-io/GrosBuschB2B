import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CALENDAR_MONTHS_AHEAD,
  getFirstAvailableSlot,
  getMonthCalendarCells,
  getWindowsForDate,
} from '../../config/catalog';
import { useCart } from '../../context/CartProvider';

const weekdayLabels = (language: string): string[] => {
  const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)));
};

const monthTitle = (year: number, monthIndex: number, language: string): string =>
  new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  );

const DeliverySlotPicker = () => {
  const { t, i18n } = useTranslation('common');
  const {
    slotPickerOpen,
    deliverySlot,
    pendingProduct,
    confirmDeliverySlot,
    cancelSlotPicker,
  } = useCart();
  const titleId = useId();
  const today = new Date();
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + CALENDAR_MONTHS_AHEAD, 1);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWindow, setSelectedWindow] = useState('');

  useEffect(() => {
    if (!slotPickerOpen) return;

    const first = getFirstAvailableSlot();
    const prefill = pendingProduct || !deliverySlot ? first : deliverySlot;
    const date = prefill.date >= first.date ? prefill.date : first.date;
    const nextWindows = getWindowsForDate(date);
    const windowValue = nextWindows.includes(prefill.window)
      ? prefill.window
      : nextWindows[0] ?? '';
    const [year, month] = date.split('-').map(Number);

    setSelectedDate(date);
    setSelectedWindow(windowValue);
    setViewYear(year ?? new Date().getFullYear());
    setViewMonth((month ?? 1) - 1);
  }, [slotPickerOpen, deliverySlot, pendingProduct]);

  useEffect(() => {
    if (!slotPickerOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelSlotPicker();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [slotPickerOpen, cancelSlotPicker]);

  const cells = useMemo(
    () => getMonthCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );
  const windows = selectedDate ? getWindowsForDate(selectedDate) : [];
  const canConfirm = Boolean(selectedDate && selectedWindow && windows.includes(selectedWindow));
  const viewCursor = new Date(viewYear, viewMonth, 1);
  const canGoPrev = viewCursor > minMonth;
  const canGoNext = viewCursor < maxMonth;
  const labels = weekdayLabels(i18n.language);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  if (!slotPickerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={cancelSlotPicker}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg dark:border-border-dark dark:bg-surface-dark"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-border p-4 dark:border-border-dark">
          <h2
            id={titleId}
            className="text-base font-bold text-textPrimary dark:text-textPrimary-dark"
          >
            {t('catalog.slotPicker.title')}
          </h2>
          <p className="mt-1 text-xs text-textSecondary dark:text-textSecondary-dark">
            {t('catalog.slotPicker.subtitle')}
          </p>
        </header>

        <div className="space-y-4 overflow-y-auto p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
              {t('catalog.slotPicker.dateLabel')}
            </p>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrev}
                aria-label={t('catalog.slotPicker.prevMonth')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-textPrimary hover:bg-background disabled:opacity-30 dark:text-textPrimary-dark dark:hover:bg-background-dark"
              >
                ‹
              </button>
              <p className="text-sm font-semibold capitalize text-textPrimary dark:text-textPrimary-dark">
                {monthTitle(viewYear, viewMonth, i18n.language)}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canGoNext}
                aria-label={t('catalog.slotPicker.nextMonth')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-textPrimary hover:bg-background disabled:opacity-30 dark:text-textPrimary-dark dark:hover:bg-background-dark"
              >
                ›
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {labels.map((label) => (
                <span
                  key={label}
                  className="text-[10px] font-semibold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark"
                >
                  {label}
                </span>
              ))}
              {cells.map((cell) => {
                const active = cell.isoDate === selectedDate;
                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    disabled={!cell.selectable}
                    onClick={() => {
                      setSelectedDate(cell.isoDate);
                      const nextWindows = getWindowsForDate(cell.isoDate);
                      setSelectedWindow(
                        nextWindows.includes(selectedWindow)
                          ? selectedWindow
                          : nextWindows[0] ?? '',
                      );
                    }}
                    className={`h-9 rounded-md text-sm tabular-nums ${
                      active
                        ? 'bg-brand-orange font-semibold text-white'
                        : cell.selectable
                          ? `${cell.inCurrentMonth ? 'text-textPrimary dark:text-textPrimary-dark' : 'text-textSecondary dark:text-textSecondary-dark'} hover:bg-brand-orange-bg dark:hover:bg-brand-orange/10`
                          : 'text-textSecondary/40 dark:text-textSecondary-dark/40'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-textSecondary dark:text-textSecondary-dark">
              {t('catalog.slotPicker.weekdaysOnly')}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
              {t('catalog.slotPicker.windowLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {windows.map((slotWindow) => {
                const active = slotWindow === selectedWindow;
                return (
                  <button
                    key={slotWindow}
                    type="button"
                    onClick={() => setSelectedWindow(slotWindow)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? 'border-brand-green bg-brand-green text-white'
                        : 'border-border text-textPrimary hover:border-brand-green dark:border-border-dark dark:text-textPrimary-dark'
                    }`}
                  >
                    {slotWindow}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border p-4 dark:border-border-dark">
          <button
            type="button"
            onClick={cancelSlotPicker}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-textPrimary dark:border-border-dark dark:text-textPrimary-dark"
          >
            {t('catalog.slotPicker.cancel')}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              confirmDeliverySlot({ date: selectedDate, window: selectedWindow })
            }
            className="rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-hover disabled:opacity-50"
          >
            {t('catalog.slotPicker.confirm')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DeliverySlotPicker;
