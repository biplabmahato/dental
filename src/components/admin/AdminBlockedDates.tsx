import { useState } from 'react';
import { CalendarOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { formatDateDisplay } from '../../lib/formatters';
import { toSupabaseDateString } from '../../lib/availability';
import type { BlockedDate } from '../../types/database';

interface AdminBlockedDatesProps {
  blockedDates: BlockedDate[];
  loading: boolean;
  onAddBlockedDate: (blockedDate: string, reason: string) => Promise<void>;
  onRemoveBlockedDate: (id: string) => Promise<void>;
}

export function AdminBlockedDates({
  blockedDates,
  loading,
  onAddBlockedDate,
  onRemoveBlockedDate,
}: AdminBlockedDatesProps) {
  const [dateValue, setDateValue] = useState(() => toSupabaseDateString(new Date()));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateValue) {
      setError('Please select a date to block.');
      return;
    }

    const alreadyBlocked = blockedDates.some(
      (b) => b.blocked_date?.slice(0, 10) === dateValue
    );
    if (alreadyBlocked) {
      setError('This date is already blocked.');
      return;
    }

    setSubmitting(true);
    try {
      await onAddBlockedDate(dateValue, reason.trim());
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to block date.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await onRemoveBlockedDate(id);
    } finally {
      setRemovingId(null);
    }
  };

  const sortedDates = [...blockedDates].sort((a, b) =>
    a.blocked_date.localeCompare(b.blocked_date)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Add Blocked Date Card */}
      <form
        onSubmit={handleAdd}
        className="lg:col-span-5 bg-white border border-[#DDE7EB] rounded-2xl p-6 space-y-5"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-[#0F2430]">
            Block a Clinic Date
          </h2>
          <p className="mt-1 text-xs text-[#5A7280]">
            Patients will not be able to select blocked dates for holidays, training, or
            maintenance.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="blocked-date-input"
            className="block text-sm font-medium text-[#0F2430] mb-1.5"
          >
            Date <span className="text-[#0D7A7E]">*</span>
          </label>
          <input
            id="blocked-date-input"
            type="date"
            required
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full px-4 py-2.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
          />
        </div>

        <div>
          <label
            htmlFor="blocked-reason-input"
            className="block text-sm font-medium text-[#0F2430] mb-1.5"
          >
            Reason <span className="text-[#6B8290] font-normal">(Optional)</span>
          </label>
          <input
            id="blocked-reason-input"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Public Holiday or Staff Continuing Education"
            className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Blocking Date...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Blocked Date</span>
            </>
          )}
        </button>
      </form>

      {/* Blocked Dates List */}
      <div className="lg:col-span-7 bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDF2F4]">
          <h2 className="font-display text-base font-semibold text-[#0F2430]">
            Scheduled Blocked Dates
          </h2>
          <p className="text-xs text-[#5A7280] tabular-nums">
            {sortedDates.length} date{sortedDates.length === 1 ? '' : 's'} currently blocked
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#F2F6F8] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarOff className="w-6 h-6 text-[#6B8290] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#0F2430]">No blocked dates</p>
            <p className="mt-1 text-xs text-[#5A7280]">
              All open weekdays are currently available for booking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDF2F4]">
            {sortedDates.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFDFE]"
              >
                <div>
                  <p className="font-mono-tabular text-sm font-semibold text-[#0F2430]">
                    {formatDateDisplay(item.blocked_date, 'EEEE, MMM d, yyyy')}
                  </p>
                  <p className="mt-0.5 text-xs text-[#5A7280]">
                    {item.reason || 'Clinic closed'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={removingId === item.id}
                  onClick={() => void handleRemove(item.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
