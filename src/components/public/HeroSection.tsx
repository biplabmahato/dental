import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { DentalImage } from '../DentalImage';
import { CLINIC_IMAGES } from '../../lib/images';
import { formatTimeValue, formatWeekdayName } from '../../lib/formatters';
import { normalizeWeekday } from '../../lib/availability';
import type { BusinessHour, ClinicSettings } from '../../types/database';

interface HeroSectionProps {
  clinicSettings: ClinicSettings | null;
  businessHours: BusinessHour[];
  onBookClick: () => void;
  onExploreServices: () => void;
}

export function HeroSection({
  clinicSettings,
  businessHours,
  onBookClick,
  onExploreServices,
}: HeroSectionProps) {
  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';
  const clinicPhone = clinicSettings?.clinic_phone || 'Available via clinic settings';
  const clinicAddress = clinicSettings?.clinic_address || 'Modern Preventive & Cosmetic Dentistry';
  const noticeHours = clinicSettings?.booking_notice_hours ?? 2;

  const openDays = [...businessHours]
    .filter((h) => h.is_open)
    .sort((a, b) => (normalizeWeekday(a.weekday) ?? 9) - (normalizeWeekday(b.weekday) ?? 9));

  const hoursHeadline =
    openDays.length > 0
      ? `${formatWeekdayName(openDays[0].weekday).slice(0, 3)}–${formatWeekdayName(
          openDays[openDays.length - 1].weekday
        ).slice(0, 3)}, ${formatTimeValue(openDays[0].start_time)}–${formatTimeValue(
          openDays[0].end_time
        )}`
      : 'Schedule online anytime';

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-[#EFF6F8] via-[#F6FAFB] to-[#F8FAFB] border-b border-[#DDE7EB]"
    >
      {/* Subtle architectural ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(13,122,126,0.08)_0%,rgba(248,250,251,0)_70%)]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-14 lg:pt-20 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Clear Clinical Value Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-center py-2 lg:py-6">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[#0D7A7E] mb-5">
              <span>{clinicName}</span>
              <span aria-hidden="true" className="text-[#8CA3B0]">
                ·
              </span>
              <span className="text-[#4A606D]">Preventive &amp; Restorative Care</span>
            </div>

            <h1
              className="font-display font-semibold tracking-tight text-[#0F2430] leading-[1.08] text-balance max-w-xl"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)' }}
            >
              Thoughtful dental care designed around comfort and clarity.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#4A606D] leading-relaxed max-w-xl">
              From routine checkups and gentle cleanings to subtle cosmetic consultations, every
              visit is unhurried, transparent, and tailored to your long-term oral health.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] active:scale-[0.99] transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D7A7E]"
              >
                <span>Schedule your visit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreServices}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm sm:text-base font-medium text-[#0F2430] bg-white border border-[#CEDCE2] rounded-xl hover:border-[#0D7A7E]/50 hover:bg-[#F4F9FA] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Explore services
              </button>
            </div>
          </div>

          {/* Right Column: High-Impact Architectural Clinic Visual */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full min-h-[320px] sm:min-h-[420px] lg:h-full rounded-2xl overflow-hidden border border-[#DDE7EB] shadow-sm bg-[#EBF4F6]">
              <DentalImage
                src={CLINIC_IMAGES.heroSuite.src}
                alt={CLINIC_IMAGES.heroSuite.alt}
                fallbackTitle={clinicName}
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0F2430]/70 via-[#0F2430]/15 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#CFE9EA] mb-1">
                    Calm Clinical Environment
                  </p>
                  <p className="text-sm sm:text-base font-medium text-white max-w-md leading-snug">
                    {CLINIC_IMAGES.heroSuite.caption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Clinic Info Strip */}
        <div
          id="hours"
          className="mt-10 lg:mt-14 pt-8 border-t border-[#DDE7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE7EB] flex items-center justify-center shrink-0 text-[#0D7A7E]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#5A7280]">Clinic Hours</p>
              <p className="mt-1 text-sm font-semibold text-[#0F2430] tabular-nums">
                {hoursHeadline}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE7EB] flex items-center justify-center shrink-0 text-[#0D7A7E]">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#5A7280]">Patient Desk</p>
              <p className="mt-1 text-sm font-semibold text-[#0F2430] tabular-nums truncate">
                {clinicPhone}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE7EB] flex items-center justify-center shrink-0 text-[#0D7A7E]">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#5A7280]">Location</p>
              <p className="mt-1 text-sm font-semibold text-[#0F2430] truncate">
                {clinicAddress}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE7EB] flex items-center justify-center shrink-0 text-[#0D7A7E]">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#5A7280]">Online Scheduling</p>
              <p className="mt-1 text-sm font-semibold text-[#0F2430] tabular-nums">
                {noticeHours > 0
                  ? `${noticeHours}h advance booking notice`
                  : 'Same-day slots available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
