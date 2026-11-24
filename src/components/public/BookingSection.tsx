import { useEffect, useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  generateAvailableSlots,
  normalizeWeekday,
  toSupabaseDateString,
  toSupabaseTimeString,
  type TimeSlot,
} from '../../lib/availability';
import {
  formatCurrency,
  formatDateDisplay,
  formatDuration,
} from '../../lib/formatters';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type {
  Appointment,
  BlockedDate,
  BusinessHour,
  ClinicSettings,
  DentalService,
} from '../../types/database';

interface BookingSectionProps {
  services: DentalService[];
  clinicSettings: ClinicSettings | null;
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  selectedService: DentalService | null;
  selectionNonce: number;
  onSelectService: (service: DentalService) => void;
}

interface ConfirmedBooking {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  service: DentalService;
  appointmentDate: string;
  slot: TimeSlot;
}

const STEPS = [
  { number: 1, label: 'Service' },
  { number: 2, label: 'Date & Time' },
  { number: 3, label: 'Your Details' },
  { number: 4, label: 'Confirmed' },
] as const;

export function BookingSection({
  services,
  clinicSettings,
  businessHours,
  blockedDates,
  selectedService,
  selectionNonce,
  onSelectService,
}: BookingSectionProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Patient form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  useEffect(() => {
    if (selectionNonce > 0 && selectedService) {
      setSelectedSlot(null);
      setConfirmedBooking(null);
      setFormError(null);
      setStep(2);
    }
  }, [selectionNonce, selectedService]);

  // Build upcoming 28 calendar days starting today
  const calendarDays = useMemo(() => {
    const today = startOfDay(new Date());
    return eachDayOfInterval({
      start: today,
      end: addDays(today, 27),
    });
  }, []);

  // Automatically pick first open, unblocked date when entering Step 2 or if hours load
  useEffect(() => {
    if (businessHours.length === 0) return;

    const isDateBookable = (candidate: Date) => {
      const iso = toSupabaseDateString(candidate);
      const isBlocked = blockedDates.some((b) => b.blocked_date?.slice(0, 10) === iso);
      if (isBlocked) return false;
      const hours = businessHours.find(
        (h) => normalizeWeekday(h.weekday) === candidate.getDay()
      );
      return Boolean(hours?.is_open);
    };

    if (!isDateBookable(selectedDate)) {
      const firstOpen = calendarDays.find(isDateBookable);
      if (firstOpen) {
        setSelectedDate(firstOpen);
      }
    }
  }, [businessHours, blockedDates, calendarDays, selectedDate]);

  // Fetch existing appointments for selectedDate from Supabase
  useEffect(() => {
    let active = true;

    async function fetchAppointmentsForDate() {
      if (!isSupabaseConfigured || !supabase) {
        setDayAppointments([]);
        return;
      }

      setLoadingSlots(true);
      setSlotsError(null);

      try {
        const targetIso = toSupabaseDateString(selectedDate);
        const { data, error } = await supabase
          .from('appointments')
          .select('id, appointment_date, start_time, end_time, status')
          .eq('appointment_date', targetIso)
          .neq('status', 'cancelled');

        if (error) {
          if (error.code === '42501') {
            if (active) setDayAppointments([]);
            return;
          }
          throw error;
        }
        if (active) {
          setDayAppointments((data as Appointment[]) ?? []);
        }
      } catch (err) {
        if (active) {
          setSlotsError(
            err instanceof Error
              ? err.message
              : 'Unable to check appointment availability right now.'
          );
          setDayAppointments([]);
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    void fetchAppointmentsForDate();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Compute available time slots whenever date, service, hours, blocked dates, or bookings change
  const availability = useMemo(() => {
    if (!selectedService) {
      return { slots: [], status: 'no_slots' as const, reason: 'Select a service first.' };
    }
    return generateAvailableSlots({
      selectedDate,
      service: selectedService,
      businessHours,
      blockedDates,
      existingAppointments: dayAppointments,
      clinicSettings,
    });
  }, [selectedService, selectedDate, businessHours, blockedDates, dayAppointments, clinicSettings]);

  // Reset selectedSlot if it disappears from availability
  useEffect(() => {
    if (!selectedSlot) return;
    const stillExists = availability.slots.some(
      (s) => s.start.getTime() === selectedSlot.start.getTime()
    );
    if (!stillExists) {
      setSelectedSlot(null);
    }
  }, [availability.slots, selectedSlot]);

  // If user clicks "Book this service" in Services section while on Step 1 or 4, advance cleanly
  const handleChooseServiceInStep = (service: DentalService) => {
    onSelectService(service);
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setStep(2);
  };

  const handleStepNavigation = (targetStep: 1 | 2 | 3) => {
    if (step === 4) return;
    if (targetStep === 1) setStep(1);
    if (targetStep === 2 && selectedService) setStep(2);
    if (targetStep === 3 && selectedService && selectedSlot) setStep(3);
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedService || !selectedSlot) {
      setFormError('Please select a service and an available time slot.');
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = notes.trim();

    if (trimmedName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const digitCount = trimmedPhone.replace(/\D/g, '').length;
    if (digitCount < 7) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setFormError('Supabase connection is not configured yet.');
      return;
    }

    setSubmitting(true);

    try {
      const appointmentDateIso = toSupabaseDateString(selectedDate);
      const startTimeSql = toSupabaseTimeString(selectedSlot.start);
      const endTimeSql = toSupabaseTimeString(selectedSlot.end);

      // Fresh overlap verification against database right before insert (if readable)
      const { data: latestBookings, error: checkError } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, end_time, status')
        .eq('appointment_date', appointmentDateIso)
        .neq('status', 'cancelled');

      if (!checkError && latestBookings) {
        const freshAvailability = generateAvailableSlots({
          selectedDate,
          service: selectedService,
          businessHours,
          blockedDates,
          existingAppointments: latestBookings as Appointment[],
          clinicSettings,
        });

        const slotStillOpen = freshAvailability.slots.some(
          (s) => s.start.getTime() === selectedSlot.start.getTime()
        );

        if (!slotStillOpen) {
          setDayAppointments(latestBookings as Appointment[]);
          setSelectedSlot(null);
          setFormError(
            'That appointment time was just booked. Please choose another open time slot.'
          );
          setStep(2);
          return;
        }
      }

      const bookingRef =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}`;

      const { error: insertError } = await supabase.from('appointments').insert({
        full_name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        service_id: selectedService.id,
        appointment_date: appointmentDateIso,
        start_time: startTimeSql,
        end_time: endTimeSql,
        status: 'pending',
        notes: trimmedNotes || null,
      });

      if (insertError) throw insertError;

      setConfirmedBooking({
        id: bookingRef,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        notes: trimmedNotes,
        service: selectedService,
        appointmentDate: appointmentDateIso,
        slot: selectedSlot,
      });
      setStep(4);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your appointment request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setConfirmedBooking(null);
    setSelectedSlot(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setFormError(null);
    setStep(1);
  };

  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';
  const clinicAddress = clinicSettings?.clinic_address || '';
  const clinicPhone = clinicSettings?.clinic_phone || '';

  return (
    <section id="book" className="py-16 lg:py-24 bg-[#F2F7F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Heading & Step Indicator */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-medium text-[#0D7A7E] mb-2">
              Online Appointment Scheduling
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F2430] text-balance">
              Schedule your visit in a few clear steps.
            </h2>
          </div>

          {/* Stepper */}
          <nav aria-label="Booking progress" className="flex items-center gap-2 sm:gap-3">
            {STEPS.map((item, idx) => {
              const isCompleted = step > item.number;
              const isCurrent = step === item.number;
              const isClickable =
                step !== 4 &&
                (item.number === 1 ||
                  (item.number === 2 && Boolean(selectedService)) ||
                  (item.number === 3 && Boolean(selectedService && selectedSlot)));

              return (
                <div key={item.number} className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => {
                      if (item.number <= 3) handleStepNavigation(item.number as 1 | 2 | 3);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isCurrent
                        ? 'bg-[#0D7A7E] text-white'
                        : isCompleted
                        ? 'bg-white text-[#0F2430] border border-[#CFE0E5] hover:border-[#0D7A7E] cursor-pointer'
                        : 'bg-white/60 text-[#6B8290] border border-[#DDE7EB]'
                    } ${!isClickable && !isCurrent ? 'cursor-default' : ''}`}
                  >
                    <span className="font-mono-tabular text-xs">
                      {isCompleted ? <Check className="w-3.5 h-3.5 text-[#0D7A7E]" /> : `0${item.number}`}
                    </span>
                    <span>{item.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <span aria-hidden="true" className="hidden sm:block w-4 h-px bg-[#C7D8DF]" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Main Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Interactive Panel */}
          <div className="lg:col-span-8 bg-white border border-[#DDE7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* STEP 1: Select a Service */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-[#0F2430]">
                    1. Select your dental service
                  </h3>
                  <p className="mt-1 text-sm text-[#4A606D]">
                    Choose the treatment or consultation you would like to schedule.
                  </p>
                </div>

                {services.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#F6FAFB] border border-[#DDE7EB] text-center">
                    <p className="text-sm font-medium text-[#0F2430]">
                      No active services are available for booking yet.
                    </p>
                    <p className="mt-1 text-xs text-[#5A7280]">
                      Check your Supabase connection or activate services in the Admin Dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((service) => {
                      const active = selectedService?.id === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleChooseServiceInStep(service)}
                          className={`text-left p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                            active
                              ? 'border-[#0D7A7E] bg-[#F2FAFA] ring-2 ring-[#0D7A7E]/15'
                              : 'border-[#DDE7EB] bg-white hover:border-[#8DB7BF] hover:bg-[#FAFDFE]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-display text-base font-semibold text-[#0F2430]">
                                {service.name}
                              </h4>
                              <span className="font-mono-tabular text-sm font-semibold text-[#0D7A7E] shrink-0">
                                {formatCurrency(service.price)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#4A606D] line-clamp-2 leading-relaxed">
                              {service.description ||
                                'Personalized clinical visit with our dental care team.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#EDF2F4] text-xs font-medium text-[#5A7280] tabular-nums">
                            <span>{formatDuration(service.duration_minutes)}</span>
                            <span className="text-[#0D7A7E] inline-flex items-center gap-1">
                              <span>Select</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedService && (
                  <div className="mt-6 pt-6 border-t border-[#EDF2F4] flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Continue to Date &amp; Time</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Date & Time Slot Selection */}
            {step === 2 && selectedService && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[#0F2430]">
                      2. Choose a date and time
                    </h3>
                    <p className="mt-1 text-sm text-[#4A606D]">
                      Showing open times for {selectedService.name} (
                      {formatDuration(selectedService.duration_minutes)}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0D7A7E] hover:text-[#095F63] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change service</span>
                  </button>
                </div>

                {/* Date Selection Strip / Grid */}
                <div className="mb-8">
                  <label className="block text-xs font-medium text-[#5A7280] mb-3">
                    Select Appointment Date (Next 4 Weeks)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const iso = toSupabaseDateString(day);
                      const isBlocked = blockedDates.some(
                        (b) => b.blocked_date?.slice(0, 10) === iso
                      );
                      const hoursEntry = businessHours.find(
                        (h) => normalizeWeekday(h.weekday) === day.getDay()
                      );
                      const isOpenDay = Boolean(hoursEntry?.is_open) && !isBlocked;
                      const isSelected = isSameDay(day, selectedDate);

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedSlot(null);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0D7A7E] border-[#0D7A7E] text-white shadow-xs'
                              : isOpenDay
                              ? 'bg-white border-[#DDE7EB] text-[#0F2430] hover:border-[#0D7A7E]/60 hover:bg-[#F6FAFA]'
                              : 'bg-[#F5F8F9] border-[#E6EEF1] text-[#8EA2AE]'
                          }`}
                        >
                          <div
                            className={`text-[11px] font-medium ${
                              isSelected ? 'text-[#D6F1F2]' : 'text-[#5A7280]'
                            }`}
                          >
                            {format(day, 'EEE')}
                          </div>
                          <div className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {format(day, 'd')}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isSelected ? 'text-[#D6F1F2]' : 'text-[#738A97]'
                            }`}
                          >
                            {isBlocked ? 'Closed' : !hoursEntry?.is_open ? 'Off' : format(day, 'MMM')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[#5A7280]">
                      Available Times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                    {loadingSlots && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0D7A7E]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking schedule...</span>
                      </span>
                    )}
                  </div>

                  {slotsError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                      {slotsError}
                    </div>
                  )}

                  {!loadingSlots && !slotsError && availability.slots.length === 0 && (
                    <div className="p-6 rounded-xl bg-[#F6FAFB] border border-[#DDE7EB] text-center">
                      <Calendar className="w-5 h-5 text-[#5A7280] mx-auto mb-2" />
                      <p className="text-sm font-medium text-[#0F2430]">
                        No open time slots on {format(selectedDate, 'MMM d')}
                      </p>
                      <p className="mt-1 text-xs text-[#5A7280]">{availability.reason}</p>
                    </div>
                  )}

                  {!loadingSlots && !slotsError && availability.slots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {availability.slots.map((slot) => {
                        const isPicked =
                          selectedSlot?.start.getTime() === slot.start.getTime();

                        return (
                          <button
                            key={slot.start.toISOString()}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3.5 py-3 rounded-xl border font-mono-tabular text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                              isPicked
                                ? 'bg-[#0D7A7E] border-[#0D7A7E] text-white shadow-xs'
                                : 'bg-white border-[#DDE7EB] text-[#0F2430] hover:border-[#0D7A7E] hover:bg-[#F4FAFA]'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-[#EDF2F4] flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4A606D] hover:text-[#0F2430] cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Continue to Patient Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Patient Details Form */}
            {step === 3 && selectedService && selectedSlot && (
              <form onSubmit={handleSubmitAppointment} noValidate>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[#0F2430]">
                      3. Enter your patient details
                    </h3>
                    <p className="mt-1 text-sm text-[#4A606D]">
                      We will confirm your visit details via email or phone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0D7A7E] hover:text-[#095F63] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change time</span>
                  </button>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="patient-full-name"
                      className="block text-sm font-medium text-[#0F2430] mb-1.5"
                    >
                      Full Name <span className="text-[#0D7A7E]">*</span>
                    </label>
                    <input
                      id="patient-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Claire Bennett"
                      className="w-full px-4 py-3 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="patient-email"
                      className="block text-sm font-medium text-[#0F2430] mb-1.5"
                    >
                      Email Address <span className="text-[#0D7A7E]">*</span>
                    </label>
                    <input
                      id="patient-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="claire@example.com"
                      className="w-full px-4 py-3 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="patient-phone"
                      className="block text-sm font-medium text-[#0F2430] mb-1.5"
                    >
                      Phone Number <span className="text-[#0D7A7E]">*</span>
                    </label>
                    <input
                      id="patient-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 234-5678"
                      className="w-full px-4 py-3 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="patient-notes"
                      className="block text-sm font-medium text-[#0F2430] mb-1.5"
                    >
                      Notes for the Dental Team <span className="text-[#6B8290] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="patient-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any sensitivity preferences, insurance notes, or questions for your visit..."
                      className="w-full px-4 py-3 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] focus:ring-2 focus:ring-[#0D7A7E]/15 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EDF2F4] flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4A606D] hover:text-[#0F2430] cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Appointment Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success Confirmation Screen */}
            {step === 4 && confirmedBooking && (
              <div className="py-4">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F4F4] border border-[#BFE2E3] flex items-center justify-center shrink-0 text-[#0D7A7E]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0D7A7E] mb-1">
                      Appointment Request Received
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-[#0F2430]">
                      We look forward to seeing you, {confirmedBooking.fullName}.
                    </h3>
                    <p className="mt-1.5 text-sm text-[#4A606D]">
                      Your request has been logged with {clinicName}. Our front desk will send
                      confirmation details to {confirmedBooking.email}.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F6FAFB] border border-[#DDE7EB] divide-y divide-[#E4EDF1]">
                  <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#5A7280]">Service</span>
                    <span className="text-sm font-semibold text-[#0F2430]">
                      {confirmedBooking.service.name} ({formatDuration(confirmedBooking.service.duration_minutes)})
                    </span>
                  </div>
                  <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#5A7280]">Date</span>
                    <span className="text-sm font-semibold text-[#0F2430] tabular-nums">
                      {formatDateDisplay(confirmedBooking.appointmentDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#5A7280]">Time</span>
                    <span className="font-mono-tabular text-sm font-semibold text-[#0D7A7E]">
                      {format(confirmedBooking.slot.start, 'h:mm a')} –{' '}
                      {format(confirmedBooking.slot.end, 'h:mm a')}
                    </span>
                  </div>
                  <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#5A7280]">Estimated Fee</span>
                    <span className="font-mono-tabular text-sm font-semibold text-[#0F2430]">
                      {formatCurrency(confirmedBooking.service.price)}
                    </span>
                  </div>
                  <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#5A7280]">Status</span>
                    <span className="text-sm font-medium text-amber-800">
                      Pending Front Desk Confirmation
                    </span>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-[#5A7280]">
                    Reference ID: <span className="font-mono-tabular">{confirmedBooking.id.slice(0, 8)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleResetBooking}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Persistent Appointment Summary Panel */}
          <aside className="lg:col-span-4 bg-white border border-[#DDE7EB] rounded-2xl p-6 shadow-xs lg:sticky lg:top-24">
            <h3 className="font-display text-base font-semibold text-[#0F2430] pb-4 border-b border-[#EDF2F4]">
              Appointment Summary
            </h3>

            <div className="py-5 space-y-4 border-b border-[#EDF2F4]">
              <div>
                <p className="text-xs text-[#5A7280]">Selected Service</p>
                <p className="mt-1 text-sm font-semibold text-[#0F2430]">
                  {selectedService ? selectedService.name : 'Not selected yet'}
                </p>
                {selectedService && (
                  <p className="mt-0.5 text-xs text-[#4A606D] tabular-nums">
                    {formatDuration(selectedService.duration_minutes)} ·{' '}
                    {formatCurrency(selectedService.price)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-[#5A7280]">Date &amp; Time</p>
                {selectedSlot ? (
                  <p className="mt-1 text-sm font-semibold text-[#0D7A7E] tabular-nums">
                    {format(selectedDate, 'EEE, MMM d, yyyy')} · {selectedSlot.label}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#6B8290]">
                    {selectedService ? 'Choose an open slot' : 'Pending service selection'}
                  </p>
                )}
              </div>

              {step >= 3 && fullName.trim() && (
                <div>
                  <p className="text-xs text-[#5A7280]">Patient</p>
                  <p className="mt-1 text-sm font-medium text-[#0F2430]">{fullName.trim()}</p>
                </div>
              )}
            </div>

            <div className="pt-5 space-y-3 text-xs text-[#4A606D]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0D7A7E] shrink-0 mt-0.5" />
                <span>No prepayment required when scheduling online.</span>
              </div>
              {clinicAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#0D7A7E] shrink-0 mt-0.5" />
                  <span>{clinicAddress}</span>
                </div>
              )}
              {clinicPhone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#0D7A7E] shrink-0 mt-0.5" />
                  <span className="tabular-nums">{clinicPhone}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#0D7A7E] shrink-0 mt-0.5" />
                <span>
                  Please arrive 10 minutes early for your first dental checkup or cleaning.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
