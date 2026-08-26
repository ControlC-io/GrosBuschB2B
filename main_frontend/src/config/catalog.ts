import type { DeliverySlot } from '../types/catalog';

const parsedMinimum = Number(import.meta.env.VITE_ORDER_MINIMUM_EUR);

export const ORDER_MINIMUM_EUR = Number.isFinite(parsedMinimum) && parsedMinimum > 0
  ? parsedMinimum
  : 30;

export const CURRENCY = 'EUR';

/** Weight reference used under the selling price (F017). */
export const REFERENCE_WEIGHT_UNIT = 'KG';

export const SLOT_START_HOUR = 11;
export const SLOT_END_HOUR = 19;
export const CALENDAR_MONTHS_AHEAD = 3;

export interface CalendarCell {
  isoDate: string;
  day: number;
  inCurrentMonth: boolean;
  selectable: boolean;
}

const padTwo = (value: number): string => String(value).padStart(2, '0');

export const formatSlotWindow = (startHour: number): string =>
  `${padTwo(startHour)}:00 – ${padTwo(startHour + 1)}:00`;

export const getHourWindows = (): string[] => {
  const windows: string[] = [];
  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour += 1) {
    windows.push(formatSlotWindow(hour));
  }
  return windows;
};

export const toIsoDate = (value: Date): string =>
  `${value.getFullYear()}-${padTwo(value.getMonth() + 1)}-${padTwo(value.getDate())}`;

export const parseIsoDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const startOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isWeekday = (value: Date): boolean => {
  const day = value.getDay();
  return day !== 0 && day !== 6;
};

const nextWeekday = (value: Date): Date => {
  const cursor = startOfDay(value);
  while (!isWeekday(cursor)) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return cursor;
};

const windowStartHour = (slotWindow: string): number => Number(slotWindow.slice(0, 2));

/** Next working day with the first one hour slot that has not started yet. */
export const getFirstAvailableSlot = (): DeliverySlot => {
  const now = new Date();
  const windows = getHourWindows();
  const firstWindow = windows[0] ?? formatSlotWindow(SLOT_START_HOUR);
  const today = startOfDay(now);

  if (isWeekday(today)) {
    const remaining = windows.find((slotWindow) => windowStartHour(slotWindow) > now.getHours());
    if (remaining) {
      return { date: toIsoDate(today), window: remaining };
    }
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: toIsoDate(nextWeekday(tomorrow)), window: firstWindow };
  }

  return { date: toIsoDate(nextWeekday(today)), window: firstWindow };
};

export const getWindowsForDate = (isoDate: string): string[] => {
  const first = getFirstAvailableSlot();
  const windows = getHourWindows();
  if (isoDate > first.date) return windows;
  if (isoDate < first.date) return [];
  const startIndex = windows.indexOf(first.window);
  return startIndex >= 0 ? windows.slice(startIndex) : windows;
};

export const isSelectableDeliveryDate = (isoDate: string): boolean => {
  const date = parseIsoDate(isoDate);
  if (!isWeekday(date)) return false;
  return isoDate >= getFirstAvailableSlot().date && getWindowsForDate(isoDate).length > 0;
};

export const getMonthCalendarCells = (year: number, monthIndex: number): CalendarCell[] => {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - mondayOffset);
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const isoDate = toIsoDate(cellDate);
    cells.push({
      isoDate,
      day: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      selectable: isSelectableDeliveryDate(isoDate),
    });
  }

  return cells;
};
