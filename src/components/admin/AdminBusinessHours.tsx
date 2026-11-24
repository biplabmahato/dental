import { useEffect, useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { normalizeWeekday } from '../../lib/availability';
import { formatTimeInput, formatWeekdayName } from '../../lib/formatters';
import type { BusinessHour } from '../../types/database';

interface AdminBusinessHoursProps {
  businessHours: BusinessHour[];
  loading: boolean;
  onSaveHours: (rows: BusinessHour[]) => Promise<void>;
  onInitializeHours: () => Promise<void>;
}

export function AdminBusinessHours({
  businessHours,
  loading,
  onSaveHours,
  onInitializeHours,
}: AdminBusinessHoursProps) {
  const [draftRows, setDraftRows] = useState<BusinessHour[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const sorted = [...businessHours].sort(
      (a, b) => (normalizeWeekday(a.weekday) ?? 9) - (normalizeWeekday(b.weekday) ?? 9)
    );
    setDraftRows(
      sorted.map((row) => ({
        ...row,
        start_time: formatTimeInput(row.start_time),
        end_time: formatTimeInput(row.end_time),
      }))
    );
  }, [businessHours]);

  const updateRow = (id: string, patch: Partial<BusinessHour>) => {
    setSavedNotice(false);
    setError(null);
    setDraftRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);

    for (const row of draftRows) {
      if (row.is_open && row.start_time >= row.end_time) {
        setError(
          `Opening time must be earlier than closing time for ${formatWeekdayName(
            row.weekday
          )}.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      await onSaveHours(
        draftRows.map((row) => ({
          ...row,
          start_time: row.start_time.length === 5 ? `${row.start_time}:00` : row.start_time,
          end_time: row.end_time.length === 5 ? `${row.end_time}:00` : row.end_time,
        }))
      );
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save business hours.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDE7EB] rounded-2xl p-8 space-y-3">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className="h-12 bg-[#F2F6F8] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (draftRows.length === 0) {
    return (
      <div className="bg-white border border-[#DDE7EB] rounded-2xl p-10 text-center">
        <h2 className="font-display text-lg font-semibold text-[#0F2430]">
          No weekday schedule rows found
        </h2>
        <p className="mt-1.5 text-sm text-[#5A7280] max-w-md mx-auto">
          Initialize standard Monday–Saturday dental clinic hours to begin generating
          bookable appointment slots.
        </p>
        <button
          type="button"
          onClick={() => void onInitializeHours()}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Initialize 7-Day Schedule</span>
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-[#EDF2F4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0F2430]">
            Weekly Operating Hours
          </h2>
          <p className="mt-0.5 text-xs text-[#5A7280]">
            Controls which weekdays and hours appear in the patient booking calendar.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Hours...</span>
            </>
          ) : (
            <span>Save Business Hours</span>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-6 mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="mx-6 mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Business hours updated. Public booking slots now reflect this schedule.</span>
        </div>
      )}

      <div className="divide-y divide-[#EDF2F4]">
        {draftRows.map((row) => (
          <div
            key={row.id}
            className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center justify-between md:w-56">
              <span className="font-display text-sm font-semibold text-[#0F2430]">
                {formatWeekdayName(row.weekday)}
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4A606D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.is_open}
                  onChange={(e) => updateRow(row.id, { is_open: e.target.checked })}
                  className="w-4 h-4 accent-[#0D7A7E] rounded cursor-pointer"
                />
                <span>{row.is_open ? 'Open' : 'Closed'}</span>
              </label>
            </div>

            {row.is_open ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`start-${row.id}`}
                    className="text-xs text-[#5A7280]"
                  >
                    Opens
                  </label>
                  <input
                    id={`start-${row.id}`}
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.id, { start_time: e.target.value })}
                    className="px-3 py-1.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-lg focus:outline-none focus:border-[#0D7A7E]"
                  />
                </div>

                <span className="text-xs text-[#8CA3B0]">to</span>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`end-${row.id}`}
                    className="text-xs text-[#5A7280]"
                  >
                    Closes
                  </label>
                  <input
                    id={`end-${row.id}`}
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.id, { end_time: e.target.value })}
                    className="px-3 py-1.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-lg focus:outline-none focus:border-[#0D7A7E]"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#6B8290] italic">
                Clinic closed — no online bookings accepted
              </div>
            )}
          </div>
        ))}
      </div>
    </form>
  );
}
