import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CalendarOff,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  Stethoscope,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AdminOverview } from './AdminOverview';
import { AdminAppointments } from './AdminAppointments';
import { AdminServices, type ServiceFormPayload } from './AdminServices';
import { AdminBusinessHours } from './AdminBusinessHours';
import { AdminBlockedDates } from './AdminBlockedDates';
import { AdminClinicSettings, type ClinicSettingsPayload } from './AdminClinicSettings';
import type {
  Appointment,
  AppointmentStatus,
  BlockedDate,
  BusinessHour,
  ClinicSettings,
  DentalService,
} from '../../types/database';

type AdminTab =
  | 'overview'
  | 'appointments'
  | 'services'
  | 'hours'
  | 'blocked'
  | 'settings';

interface AdminDashboardProps {
  user: User;
  onSignOut: () => Promise<void>;
  onNavigatePublic: () => void;
  onPublicDataChanged: () => Promise<void>;
}

const NAV_ITEMS: Array<{
  id: AdminTab;
  label: string;
  title: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', title: 'Clinic Overview', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', title: 'Patient Appointments', icon: Calendar },
  { id: 'services', label: 'Services', title: 'Dental Services', icon: Stethoscope },
  { id: 'hours', label: 'Business Hours', title: 'Business Hours', icon: Clock },
  { id: 'blocked', label: 'Blocked Dates', title: 'Blocked Dates', icon: CalendarOff },
  { id: 'settings', label: 'Clinic Settings', title: 'Clinic Settings', icon: Settings },
];

export function AdminDashboard({
  user,
  onSignOut,
  onNavigatePublic,
  onPublicDataChanged,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<DentalService[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (!supabase) return;
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [apptsRes, servicesRes, hoursRes, blockedRes, settingsRes] =
        await Promise.all([
          supabase
            .from('appointments')
            .select('*, services(id, name, duration_minutes, price)')
            .order('appointment_date', { ascending: false })
            .order('start_time', { ascending: true }),
          supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: true }),
          supabase.from('business_hours').select('*'),
          supabase
            .from('blocked_dates')
            .select('*')
            .order('blocked_date', { ascending: true }),
          supabase
            .from('clinic_settings')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

      if (apptsRes.error) throw apptsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (hoursRes.error) throw hoursRes.error;
      if (blockedRes.error) throw blockedRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setAppointments((apptsRes.data as Appointment[]) ?? []);
      setServices((servicesRes.data as DentalService[]) ?? []);
      setBusinessHours((hoursRes.data as BusinessHour[]) ?? []);
      setBlockedDates((blockedRes.data as BlockedDate[]) ?? []);
      setClinicSettings((settingsRes.data as ClinicSettings | null) ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load clinic dashboard data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData(false);
  }, [loadDashboardData]);

  const handleUpdateAppointmentStatus = async (
    id: string,
    status: AppointmentStatus
  ) => {
    if (!supabase) return;
    const { error: updateErr } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateErr) throw updateErr;

    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleCreateService = async (payload: ServiceFormPayload) => {
    if (!supabase) return;
    const { data, error: insertErr } = await supabase
      .from('services')
      .insert(payload)
      .select('*')
      .single();

    if (insertErr) throw insertErr;
    setServices((prev) => [...prev, data as DentalService]);
    await onPublicDataChanged();
  };

  const handleUpdateService = async (id: string, payload: ServiceFormPayload) => {
    if (!supabase) return;
    const { data, error: updateErr } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;
    setServices((prev) =>
      prev.map((s) => (s.id === id ? (data as DentalService) : s))
    );
    await onPublicDataChanged();
  };

  const handleToggleServiceActive = async (id: string, nextActive: boolean) => {
    if (!supabase) return;
    const { data, error: updateErr } = await supabase
      .from('services')
      .update({ is_active: nextActive })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;
    setServices((prev) =>
      prev.map((s) => (s.id === id ? (data as DentalService) : s))
    );
    await onPublicDataChanged();
  };

  const handleSaveBusinessHours = async (rows: BusinessHour[]) => {
    if (!supabase) return;

    await Promise.all(
      rows.map(async (row) => {
        const { error: updateErr } = await supabase!
          .from('business_hours')
          .update({
            is_open: row.is_open,
            start_time: row.start_time,
            end_time: row.end_time,
          })
          .eq('id', row.id);
        if (updateErr) throw updateErr;
      })
    );

    setBusinessHours(rows);
    await onPublicDataChanged();
  };

  const handleInitializeBusinessHours = async () => {
    if (!supabase) return;
    const defaults = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      is_open: weekday >= 1 && weekday <= 5,
      start_time: '09:00:00',
      end_time: '17:00:00',
    }));

    const { data, error: insertErr } = await supabase
      .from('business_hours')
      .insert(defaults)
      .select('*');

    if (insertErr) throw insertErr;
    setBusinessHours((data as BusinessHour[]) ?? []);
    await onPublicDataChanged();
  };

  const handleAddBlockedDate = async (blockedDate: string, reason: string) => {
    if (!supabase) return;
    const { data, error: insertErr } = await supabase
      .from('blocked_dates')
      .insert({
        blocked_date: blockedDate,
        reason: reason || null,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;
    setBlockedDates((prev) => [...prev, data as BlockedDate]);
    await onPublicDataChanged();
  };

  const handleRemoveBlockedDate = async (id: string) => {
    if (!supabase) return;
    const { error: deleteErr } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;
    setBlockedDates((prev) => prev.filter((item) => item.id !== id));
    await onPublicDataChanged();
  };

  const handleSaveClinicSettings = async (payload: ClinicSettingsPayload) => {
    if (!supabase) return;

    if (clinicSettings?.id) {
      const { data, error: updateErr } = await supabase
        .from('clinic_settings')
        .update(payload)
        .eq('id', clinicSettings.id)
        .select('*')
        .single();
      if (updateErr) throw updateErr;
      setClinicSettings(data as ClinicSettings);
    } else {
      const { data, error: insertErr } = await supabase
        .from('clinic_settings')
        .insert(payload)
        .select('*')
        .single();
      if (insertErr) throw insertErr;
      setClinicSettings(data as ClinicSettings);
    }

    await onPublicDataChanged();
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-[#E5EEF2]">
        <p className="text-xs font-medium text-[#0D7A7E]">Clinic Management</p>
        <p className="mt-1 font-display text-base font-semibold text-[#0F2430] truncate">
          {clinicName}
        </p>
      </div>

      <nav aria-label="Dashboard sections" className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#E9F5F5] text-[#095F63]'
                  : 'text-[#4A606D] hover:bg-[#F3F7F9] hover:text-[#0F2430]'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.id === 'appointments' && pendingCount > 0 && (
                <span className="font-mono-tabular text-xs font-semibold text-[#0D7A7E]">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E5EEF2] space-y-2">
        <button
          type="button"
          onClick={onNavigatePublic}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[#0F2430] bg-[#F4F8FA] rounded-xl hover:bg-[#E7F0F4] transition-colors cursor-pointer whitespace-nowrap"
        >
          <ExternalLink className="w-4 h-4 text-[#0D7A7E]" />
          <span>View Public Website</span>
        </button>

        <div className="px-3.5 py-2">
          <p className="text-xs text-[#6B8290] truncate" title={user.email || undefined}>
            {user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onSignOut()}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-[#4A606D] hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-[#DDE7EB] shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F2430]/35"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-r border-[#DDE7EB] z-10">
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-[#5A7280] hover:bg-[#F2F6F8]"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDE7EB] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open sidebar navigation"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#0F2430] hover:bg-[#F2F6F8] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0 whitespace-nowrap">
              <span className="text-[#6B8290] hidden sm:inline">Dashboard</span>
              <span aria-hidden="true" className="text-[#B4C4CC] hidden sm:inline">
                /
              </span>
              <h1 className="font-display font-semibold text-[#0F2430] truncate">
                {currentNav.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#0F2430] bg-[#F4F8FA] border border-[#DDE7EB] rounded-lg hover:bg-[#E9F1F5] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <AdminOverview
              appointments={appointments}
              services={services}
              loading={loading}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'appointments' && (
            <AdminAppointments
              appointments={appointments}
              loading={loading}
              onUpdateStatus={handleUpdateAppointmentStatus}
            />
          )}

          {activeTab === 'services' && (
            <AdminServices
              services={services}
              loading={loading}
              onCreateService={handleCreateService}
              onUpdateService={handleUpdateService}
              onToggleActive={handleToggleServiceActive}
            />
          )}

          {activeTab === 'hours' && (
            <AdminBusinessHours
              businessHours={businessHours}
              loading={loading}
              onSaveHours={handleSaveBusinessHours}
              onInitializeHours={handleInitializeBusinessHours}
            />
          )}

          {activeTab === 'blocked' && (
            <AdminBlockedDates
              blockedDates={blockedDates}
              loading={loading}
              onAddBlockedDate={handleAddBlockedDate}
              onRemoveBlockedDate={handleRemoveBlockedDate}
            />
          )}

          {activeTab === 'settings' && (
            <AdminClinicSettings
              settings={clinicSettings}
              loading={loading}
              onSaveSettings={handleSaveClinicSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
