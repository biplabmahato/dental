import { useMemo, useState } from 'react';
import { Calendar, Mail, Phone, Search } from 'lucide-react';
import {
  APPOINTMENT_STATUS_META,
  formatDateDisplay,
  formatTimeValue,
} from '../../lib/formatters';
import type { Appointment, AppointmentStatus } from '../../types/database';

interface AdminAppointmentsProps {
  appointments: Appointment[];
  loading: boolean;
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
}

const STATUS_FILTERS: Array<{ value: 'all' | AppointmentStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminAppointments({
  appointments,
  loading,
  onUpdateStatus,
}: AdminAppointmentsProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return appointments
      .filter((appt) => {
        if (statusFilter !== 'all' && appt.status !== statusFilter) return false;
        if (!query) return true;
        return (
          appt.full_name.toLowerCase().includes(query) ||
          appt.email.toLowerCase().includes(query) ||
          appt.phone.toLowerCase().includes(query) ||
          (appt.services?.name || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateOrder = b.appointment_date.localeCompare(a.appointment_date);
        return dateOrder !== 0 ? dateOrder : a.start_time.localeCompare(b.start_time);
      });
  }, [appointments, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, nextStatus: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#DDE7EB] rounded-2xl p-4">
        {/* Segmented Status Filter */}
        <div
          role="tablist"
          aria-label="Filter appointments by status"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F6F8] rounded-xl"
        >
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.value === 'all'
                ? appointments.length
                : appointments.filter((a) => a.status === tab.value).length;
            const active = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                  active
                    ? 'bg-white text-[#0F2430] shadow-xs'
                    : 'text-[#4A606D] hover:text-[#0F2430]'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#6B8290] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, email, or service..."
            className="w-full pl-10 pr-4 py-2 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-[#F2F6F8] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-6 h-6 text-[#6B8290] mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold text-[#0F2430]">
              No matching appointments
            </h3>
            <p className="mt-1 text-sm text-[#5A7280]">
              {appointments.length === 0
                ? 'Patient bookings submitted from the public website will appear here.'
                : 'Try adjusting your status filter or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EEF2] bg-[#F8FAFB] text-xs font-medium text-[#5A7280]">
                  <th className="py-3.5 px-5">Patient</th>
                  <th className="py-3.5 px-5">Service</th>
                  <th className="py-3.5 px-5">Date &amp; Time</th>
                  <th className="py-3.5 px-5">Notes</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F4] text-sm">
                {filteredAppointments.map((appt) => {
                  const statusMeta = APPOINTMENT_STATUS_META[appt.status];
                  const isUpdating = updatingId === appt.id;

                  return (
                    <tr
                      key={appt.id}
                      className="hover:bg-[#FAFDFE] transition-colors align-top"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#0F2430]">{appt.full_name}</div>
                        <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#5A7280]">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{appt.email}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{appt.phone}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-[#0F2430] font-medium whitespace-nowrap">
                        {appt.services?.name || 'Dental Service'}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-medium text-[#0F2430] tabular-nums">
                          {formatDateDisplay(appt.appointment_date, 'MMM d, yyyy')}
                        </div>
                        <div className="mt-0.5 font-mono-tabular text-xs text-[#0D7A7E]">
                          {formatTimeValue(appt.start_time)} – {formatTimeValue(appt.end_time)}
                        </div>
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        <p className="text-xs text-[#4A606D] leading-relaxed">
                          {appt.notes ? appt.notes : '—'}
                        </p>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <select
                          aria-label={`Update status for ${appt.full_name}`}
                          disabled={isUpdating}
                          value={appt.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              appt.id,
                              e.target.value as AppointmentStatus
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium text-[#0F2430] bg-white border border-[#CEDCE2] rounded-lg focus:outline-none focus:border-[#0D7A7E] disabled:opacity-50 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
