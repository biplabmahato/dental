import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  BlockedDate,
  BusinessHour,
  ClinicSettings,
  DentalService,
} from '../types/database';

export interface PublicClinicState {
  services: DentalService[];
  clinicSettings: ClinicSettings | null;
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function formatSupabaseError(tableName: string, err: { code?: string; message?: string }): string {
  if (err.code === '42501') {
    return `Supabase permission denied for table "${tableName}" (42501). Grant SELECT privileges and an RLS read policy for the anon role in Supabase.`;
  }
  return err.message || `Unable to load ${tableName} from Supabase.`;
}

export function useClinicData(): PublicClinicState {
  const [services, setServices] = useState<DentalService[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setError('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [servicesRes, settingsRes, hoursRes, blockedRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('clinic_settings')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase.from('business_hours').select('*'),
        supabase
          .from('blocked_dates')
          .select('*')
          .order('blocked_date', { ascending: true }),
      ]);

      if (servicesRes.error) {
        console.error('Supabase services query failed:', servicesRes.error);
        setServices([]);
        setError(formatSupabaseError('services', servicesRes.error));
      } else {
        setServices((servicesRes.data as DentalService[]) ?? []);
      }

      if (settingsRes.error) {
        console.error('Supabase clinic_settings query failed:', settingsRes.error);
      } else {
        setClinicSettings((settingsRes.data as ClinicSettings | null) ?? null);
      }

      if (hoursRes.error) {
        console.error('Supabase business_hours query failed:', hoursRes.error);
      } else {
        setBusinessHours((hoursRes.data as BusinessHour[]) ?? []);
      }

      if (blockedRes.error) {
        console.error('Supabase blocked_dates query failed:', blockedRes.error);
      } else {
        setBlockedDates((blockedRes.data as BlockedDate[]) ?? []);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load clinic schedule and services.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    services,
    clinicSettings,
    businessHours,
    blockedDates,
    loading,
    error,
    refresh: loadData,
  };
}
