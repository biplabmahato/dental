export interface DentalService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  services?: Pick<DentalService, 'id' | 'name' | 'duration_minutes' | 'price'> | null;
}

export interface BusinessHour {
  id: string;
  weekday: number | string;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  clinic_email: string;
  clinic_phone: string;
  clinic_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
}
