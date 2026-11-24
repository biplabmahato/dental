import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ClinicSettings } from '../../types/database';

export interface ClinicSettingsPayload {
  clinic_name: string;
  clinic_email: string;
  clinic_phone: string;
  clinic_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
}

interface AdminClinicSettingsProps {
  settings: ClinicSettings | null;
  loading: boolean;
  onSaveSettings: (payload: ClinicSettingsPayload) => Promise<void>;
}

export function AdminClinicSettings({
  settings,
  loading,
  onSaveSettings,
}: AdminClinicSettingsProps) {
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [slotInterval, setSlotInterval] = useState('30');
  const [bookingNotice, setBookingNotice] = useState('2');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setClinicName(settings.clinic_name || '');
    setClinicEmail(settings.clinic_email || '');
    setClinicPhone(settings.clinic_phone || '');
    setClinicAddress(settings.clinic_address || '');
    setSlotInterval(String(settings.slot_interval_minutes ?? 30));
    setBookingNotice(String(settings.booking_notice_hours ?? 2));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const parsedInterval = Number(slotInterval);
    const parsedNotice = Number(bookingNotice);

    if (!clinicName.trim()) {
      setError('Clinic name is required.');
      return;
    }
    if (!Number.isFinite(parsedInterval) || parsedInterval < 5) {
      setError('Slot interval must be at least 5 minutes.');
      return;
    }
    if (!Number.isFinite(parsedNotice) || parsedNotice < 0) {
      setError('Booking notice hours must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await onSaveSettings({
        clinic_name: clinicName.trim(),
        clinic_email: clinicEmail.trim(),
        clinic_phone: clinicPhone.trim(),
        clinic_address: clinicAddress.trim(),
        slot_interval_minutes: Math.round(parsedInterval),
        booking_notice_hours: Math.round(parsedNotice),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save clinic settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDE7EB] rounded-2xl p-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-[#F2F6F8] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden max-w-3xl"
    >
      <div className="px-6 py-5 border-b border-[#EDF2F4]">
        <h2 className="font-display text-base font-semibold text-[#0F2430]">
          Clinic Information &amp; Scheduling Rules
        </h2>
        <p className="mt-0.5 text-xs text-[#5A7280]">
          Changes update your public clinic website header, footer, and booking availability
          calculations.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {saved && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Clinic settings saved successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label
              htmlFor="clinic-name"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Clinic Name <span className="text-[#0D7A7E]">*</span>
            </label>
            <input
              id="clinic-name"
              type="text"
              required
              value={clinicName}
              onChange={(e) => {
                setSaved(false);
                setClinicName(e.target.value);
              }}
              placeholder="Verdant Dental Studio"
              className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
          </div>

          <div>
            <label
              htmlFor="clinic-email"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Clinic Email
            </label>
            <input
              id="clinic-email"
              type="email"
              value={clinicEmail}
              onChange={(e) => {
                setSaved(false);
                setClinicEmail(e.target.value);
              }}
              placeholder="care@verdantdental.com"
              className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
          </div>

          <div>
            <label
              htmlFor="clinic-phone"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Clinic Phone
            </label>
            <input
              id="clinic-phone"
              type="tel"
              value={clinicPhone}
              onChange={(e) => {
                setSaved(false);
                setClinicPhone(e.target.value);
              }}
              placeholder="(555) 390-2100"
              className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="clinic-address"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Clinic Address
            </label>
            <input
              id="clinic-address"
              type="text"
              value={clinicAddress}
              onChange={(e) => {
                setSaved(false);
                setClinicAddress(e.target.value);
              }}
              placeholder="420 Cedar Avenue, Suite 210"
              className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
          </div>

          <div>
            <label
              htmlFor="slot-interval"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Slot Interval (minutes)
            </label>
            <input
              id="slot-interval"
              type="number"
              min={5}
              step={5}
              value={slotInterval}
              onChange={(e) => {
                setSaved(false);
                setSlotInterval(e.target.value);
              }}
              className="w-full px-4 py-2.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
            <p className="mt-1 text-xs text-[#5A7280]">
              Spacing between available start times (e.g., 15 or 30 min).
            </p>
          </div>

          <div>
            <label
              htmlFor="booking-notice"
              className="block text-sm font-medium text-[#0F2430] mb-1.5"
            >
              Advance Booking Notice (hours)
            </label>
            <input
              id="booking-notice"
              type="number"
              min={0}
              step={1}
              value={bookingNotice}
              onChange={(e) => {
                setSaved(false);
                setBookingNotice(e.target.value);
              }}
              className="w-full px-4 py-2.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
            />
            <p className="mt-1 text-xs text-[#5A7280]">
              Minimum hours ahead of an appointment a patient can book.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#F8FAFB] border-t border-[#EDF2F4] flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Save Clinic Settings</span>
        </button>
      </div>
    </form>
  );
}
