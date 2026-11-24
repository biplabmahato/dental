import { Calendar, CheckCircle2, Clock, Stethoscope, ArrowRight } from 'lucide-react';
import { toSupabaseDateString } from '../../lib/availability';
import {
  APPOINTMENT_STATUS_META,
  formatDateDisplay,
  formatTimeValue,
} from '../../lib/formatters';
import type { Appointment, AppointmentStatus, DentalService } from '../../types/database';

interface AdminOverviewProps {
  appointments: Appointment[];
  services: DentalService[];
  loading: boolean;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onNavigateTab: (tab: 'appointments' | 'services') => void;
}

export function AdminOverview({
  appointments,
  services,
  loading,
  onUpdateAppointmentStatus,
  onNavigateTab,
}: AdminOverviewProps) {
  const todayIso = toSupabaseDateString(new Date());

  const upcomingCount = appointments.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'confirmed') &&
      a.appointment_date >= todayIso
  ).length;

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const activeServicesCount = services.filter((s) => s.is_active).length;

  const pendingQueue = appointments
    .filter((a) => a.status === 'pending')
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
    .slice(0, 5);

  const upcomingSchedule = appointments
    .filter(
      (a) =>
        a.appointment_date >= todayIso &&
        (a.status === 'confirmed' || a.status === 'pending')
    )
    .sort((a, b) => {
      const dateDiff = a.appointment_date.localeCompare(b.appointment_date);
      return dateDiff !== 0 ? dateDiff : a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 6);

  const stats = [
    {
      label: 'Upcoming Visits',
      value: upcomingCount,
      detail: 'Confirmed & pending from today',
      icon: Calendar,
      accent: 'text-[#0D7A7E] bg-[#EBF5F6] border-[#CFE2E6]',
    },
    {
      label: 'Pending Requests',
      value: pendingCount,
      detail: 'Awaiting front desk review',
      icon: Clock,
      accent: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Completed Visits',
      value: completedCount,
      detail: 'Total finished appointments',
      icon: CheckCircle2,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Active Services',
      value: activeServicesCount,
      detail: `${services.length} total configured`,
      icon: Stethoscope,
      accent: 'text-[#0F2430] bg-[#F1F6F8] border-[#DDE7EB]',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white border border-[#DDE7EB] rounded-2xl p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-white border border-[#DDE7EB] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-[#DDE7EB] rounded-2xl p-5 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-xs font-medium text-[#5A7280]">{stat.label}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-[#0F2430] tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-[#6B8290]">{stat.detail}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${stat.accent}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Queues */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Pending Requests Queue */}
        <div className="xl:col-span-6 bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF2F4] flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F2430]">
                Pending Confirmations
              </h2>
              <p className="text-xs text-[#5A7280]">
                New patient requests ready for confirmation
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('appointments')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0D7A7E] hover:text-[#095F63] cursor-pointer whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5A7280]">
              All appointment requests have been reviewed.
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2F4]">
              {pendingQueue.map((appt) => (
                <div
                  key={appt.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFDFE] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F2430] truncate">
                      {appt.full_name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4A606D] tabular-nums">
                      {appt.services?.name || 'Dental Service'} ·{' '}
                      {formatDateDisplay(appt.appointment_date, 'MMM d, yyyy')} at{' '}
                      {formatTimeValue(appt.start_time)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void onUpdateAppointmentStatus(appt.id, 'confirmed')}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#0D7A7E] rounded-lg hover:bg-[#095F63] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => void onUpdateAppointmentStatus(appt.id, 'cancelled')}
                      className="px-3 py-1.5 text-xs font-medium text-[#4A606D] bg-[#F2F6F8] rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Clinic Schedule */}
        <div className="xl:col-span-6 bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF2F4] flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F2430]">
                Upcoming Schedule
              </h2>
              <p className="text-xs text-[#5A7280]">Next scheduled patient visits</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('services')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0D7A7E] hover:text-[#095F63] cursor-pointer whitespace-nowrap"
            >
              <span>Manage services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingSchedule.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5A7280]">
              No upcoming appointments scheduled yet.
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2F4]">
              {upcomingSchedule.map((appt) => {
                const statusMeta = APPOINTMENT_STATUS_META[appt.status];
                return (
                  <div
                    key={appt.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFDFE] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2430] truncate">
                        {appt.full_name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#4A606D] tabular-nums">
                        {formatDateDisplay(appt.appointment_date, 'EEE, MMM d')} ·{' '}
                        {formatTimeValue(appt.start_time)} – {formatTimeValue(appt.end_time)}
                        {' · '}
                        {appt.services?.name || 'Appointment'}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border shrink-0 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
