import { normalizeWeekday } from '../../lib/availability';
import { formatTimeValue, formatWeekdayName } from '../../lib/formatters';
import type { BusinessHour, ClinicSettings } from '../../types/database';

interface FooterProps {
  clinicSettings: ClinicSettings | null;
  businessHours: BusinessHour[];
  onNavigateAdmin: () => void;
}

export function Footer({
  clinicSettings,
  businessHours,
  onNavigateAdmin,
}: FooterProps) {
  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';
  const clinicEmail = clinicSettings?.clinic_email;
  const clinicPhone = clinicSettings?.clinic_phone;
  const clinicAddress = clinicSettings?.clinic_address;

  const sortedHours = [...businessHours].sort(
    (a, b) => (normalizeWeekday(a.weekday) ?? 9) - (normalizeWeekday(b.weekday) ?? 9)
  );

  return (
    <footer className="bg-[#0F2430] text-[#D7E4EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/12">
          {/* Brand & Contact */}
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-display text-xl font-semibold text-white tracking-tight">
              {clinicName}
            </h2>
            <p className="text-sm text-[#A9C0CC] leading-relaxed max-w-sm">
              Preventive, restorative, and cosmetic dental care focused on patient comfort,
              clinical precision, and honest guidance.
            </p>
            <div className="pt-2 space-y-1.5 text-sm text-[#CFE0E8]">
              {clinicAddress && <p>{clinicAddress}</p>}
              {clinicPhone && <p className="tabular-nums">{clinicPhone}</p>}
              {clinicEmail && <p>{clinicEmail}</p>}
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold tracking-wide text-[#8DB3C2] mb-4">
              Clinic Hours
            </h3>
            {sortedHours.length > 0 ? (
              <dl className="space-y-2 text-sm">
                {sortedHours.map((day) => (
                  <div key={day.id} className="flex items-center justify-between gap-4">
                    <dt className="text-[#A9C0CC]">{formatWeekdayName(day.weekday)}</dt>
                    <dd className="font-mono-tabular text-xs text-white">
                      {day.is_open
                        ? `${formatTimeValue(day.start_time)} – ${formatTimeValue(day.end_time)}`
                        : 'Closed'}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-[#A9C0CC]">
                Schedule hours will appear once configured in Clinic Settings.
              </p>
            )}
          </div>

          {/* Navigation & Admin Portal */}
          <div className="md:col-span-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#8DB3C2] mb-4">
                Patient Links
              </h3>
              <ul className="space-y-2.5 text-sm text-[#CFE0E8]">
                <li>
                  <a href="#services" className="hover:text-white transition-colors">
                    Dental Services
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    Our Practice
                  </a>
                </li>
                <li>
                  <a href="#book" className="hover:text-white transition-colors">
                    Book Appointment
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateAdmin}
                    className="text-[#8AD2D5] hover:text-white transition-colors cursor-pointer"
                  >
                    Clinic Admin Portal
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8CA7B5]">
          <p>
            © {new Date().getFullYear()} {clinicName}. All rights reserved.
          </p>
          <p>Online patient appointment scheduling</p>
        </div>
      </div>
    </footer>
  );
}
