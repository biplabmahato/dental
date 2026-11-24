import { format, isValid } from 'date-fns';
import { combineDateAndTime, normalizeWeekday, parseIsoDateLocal } from './availability';
import type { AppointmentStatus } from '../types/database';

const FULL_WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatWeekdayName(weekday: number | string): string {
  const index = normalizeWeekday(weekday);
  if (index === null) return String(weekday);
  return FULL_WEEKDAY_LABELS[index];
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatTimeValue(timeValue: string | null | undefined): string {
  const refDate = new Date(2026, 0, 1);
  const parsed = combineDateAndTime(refDate, timeValue);
  if (!parsed || !isValid(parsed)) return '--:--';
  return format(parsed, 'h:mm a');
}

export function formatTimeInput(timeValue: string | null | undefined): string {
  const refDate = new Date(2026, 0, 1);
  const parsed = combineDateAndTime(refDate, timeValue);
  if (!parsed || !isValid(parsed)) return '09:00';
  return format(parsed, 'HH:mm');
}

export function formatDateDisplay(
  dateStr: string | null | undefined,
  pattern = 'EEE, MMM d, yyyy'
): string {
  const parsed = parseIsoDateLocal(dateStr);
  if (!parsed || !isValid(parsed)) return 'Invalid date';
  return format(parsed, pattern);
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '30 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};
