import { addHours, addMinutes, format, isValid, startOfDay } from 'date-fns';
import type {
  Appointment,
  BlockedDate,
  BusinessHour,
  ClinicSettings,
  DentalService,
} from '../types/database';

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

export interface AvailabilityResult {
  slots: TimeSlot[];
  status: 'available' | 'blocked' | 'closed' | 'no_slots';
  reason?: string;
}

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/**
 * Normalizes business_hours.weekday whether stored as 0-6, "0"-"6", or "Monday"/"Mon".
 * Returns JS Date.getDay() integer (0 = Sunday .. 6 = Saturday) or null if invalid.
 */
export function normalizeWeekday(weekday: number | string): number | null {
  if (typeof weekday === 'number' && Number.isInteger(weekday)) {
    if (weekday >= 0 && weekday <= 6) return weekday;
    if (weekday === 7) return 0;
    return null;
  }

  if (typeof weekday === 'string') {
    const trimmed = weekday.trim().toLowerCase();
    if (/^[0-6]$/.test(trimmed)) return Number(trimmed);
    if (trimmed === '7') return 0;

    const fullIdx = WEEKDAY_NAMES.findIndex(
      (name) => name === trimmed || name.slice(0, 3) === trimmed
    );
    if (fullIdx !== -1) return fullIdx;
  }

  return null;
}

/**
 * Parses a "HH:mm" or "HH:mm:ss" time string onto a given calendar Date,
 * returning a real Date object or null if invalid.
 */
export function combineDateAndTime(date: Date, timeValue: string | null | undefined): Date | null {
  if (!isValid(date) || !timeValue) return null;
  const match = String(timeValue).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const combined = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    0
  );

  return isValid(combined) ? combined : null;
}

/**
 * Parses a "YYYY-MM-DD" Supabase date string into a local Date at 00:00:00.
 */
export function parseIsoDateLocal(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day, 0, 0, 0, 0);

  if (!isValid(parsed)) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
    return null;
  }
  return parsed;
}

export function toSupabaseDateString(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid Date passed to toSupabaseDateString');
  }
  return format(date, 'yyyy-MM-dd');
}

export function toSupabaseTimeString(date: Date): string {
  if (!isValid(date)) {
    throw new Error('Invalid Date passed to toSupabaseTimeString');
  }
  return format(date, 'HH:mm:ss');
}

/**
 * Generates normalized available booking time slots for a specific date and service.
 */
export function generateAvailableSlots({
  selectedDate,
  service,
  businessHours,
  blockedDates,
  existingAppointments,
  clinicSettings,
  now = new Date(),
}: {
  selectedDate: Date;
  service: DentalService;
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  existingAppointments: Appointment[];
  clinicSettings: ClinicSettings | null;
  now?: Date;
}): AvailabilityResult {
  if (!isValid(selectedDate)) {
    return { slots: [], status: 'closed', reason: 'Please select a valid date.' };
  }

  const dayStart = startOfDay(selectedDate);
  const todayStart = startOfDay(now);
  if (dayStart.getTime() < todayStart.getTime()) {
    return { slots: [], status: 'closed', reason: 'Past dates cannot be booked.' };
  }

  const targetDateIso = toSupabaseDateString(dayStart);

  // 1. Check blocked dates
  const blockedEntry = blockedDates.find(
    (item) => item.blocked_date?.slice(0, 10) === targetDateIso
  );
  if (blockedEntry) {
    return {
      slots: [],
      status: 'blocked',
      reason: blockedEntry.reason || 'The clinic is closed on this date.',
    };
  }

  // 2. Check business hours for weekday
  const weekdayIndex = dayStart.getDay();
  const dayHours = businessHours.find(
    (entry) => normalizeWeekday(entry.weekday) === weekdayIndex
  );

  if (!dayHours || !dayHours.is_open) {
    return {
      slots: [],
      status: 'closed',
      reason: 'The clinic is closed on this day of the week.',
    };
  }

  const openStart = combineDateAndTime(dayStart, dayHours.start_time);
  const openEnd = combineDateAndTime(dayStart, dayHours.end_time);

  if (!openStart || !openEnd || openEnd.getTime() <= openStart.getTime()) {
    return {
      slots: [],
      status: 'closed',
      reason: 'Clinic hours are not configured for this day.',
    };
  }

  // 3. Interval, duration, and notice rules
  const durationMinutes = Math.max(5, Number(service.duration_minutes) || 30);
  const intervalMinutes = Math.max(
    5,
    Number(clinicSettings?.slot_interval_minutes) || 30
  );
  const bookingNoticeHours = Math.max(
    0,
    Number(clinicSettings?.booking_notice_hours) ?? 2
  );
  const minimumAllowedStart = addHours(now, bookingNoticeHours);

  // 4. Filter active (non-cancelled) appointments on this date
  const dayAppointments = existingAppointments
    .filter((appt) => {
      if (appt.status === 'cancelled') return false;
      return appt.appointment_date?.slice(0, 10) === targetDateIso;
    })
    .map((appt) => ({
      start: combineDateAndTime(dayStart, appt.start_time),
      end: combineDateAndTime(dayStart, appt.end_time),
    }))
    .filter(
      (range): range is { start: Date; end: Date } =>
        range.start !== null && range.end !== null
    );

  // 5. Generate normalized slots
  const slots: TimeSlot[] = [];
  let cursor = openStart;

  while (true) {
    const slotStart = cursor;
    const slotEnd = addMinutes(slotStart, durationMinutes);

    if (slotEnd.getTime() > openEnd.getTime()) {
      break;
    }

    const respectsNotice = slotStart.getTime() >= minimumAllowedStart.getTime();

    const hasOverlap = dayAppointments.some(
      (existing) =>
        slotStart.getTime() < existing.end.getTime() &&
        slotEnd.getTime() > existing.start.getTime()
    );

    if (respectsNotice && !hasOverlap) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        label: format(slotStart, 'h:mm a'),
      });
    }

    cursor = addMinutes(cursor, intervalMinutes);
  }

  if (slots.length === 0) {
    return {
      slots: [],
      status: 'no_slots',
      reason: 'All appointment times for this date are unavailable or inside the advance notice window.',
    };
  }

  return { slots, status: 'available' };
}
