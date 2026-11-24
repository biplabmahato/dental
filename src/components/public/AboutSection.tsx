import { DentalImage } from '../DentalImage';
import { CLINIC_IMAGES } from '../../lib/images';
import type { ClinicSettings } from '../../types/database';

interface AboutSectionProps {
  clinicSettings: ClinicSettings | null;
  onBookClick: () => void;
}

const CARE_PRINCIPLES = [
  {
    number: '01',
    title: 'Unhurried Consultations',
    body: 'Every checkup reserves dedicated time to walk through digital imaging and answer questions before any treatment begins.',
  },
  {
    number: '02',
    title: 'Hospital-Grade Cleanliness',
    body: 'Closed-loop instrument sterilization, HEPA clinical air filtration, and spotless treatment suites prepared individually for each patient.',
  },
  {
    number: '03',
    title: 'Clear Preventive Planning',
    body: 'Honest clinical recommendations with upfront duration and fee clarity—focused on preserving natural tooth structure.',
  },
];

export function AboutSection({ clinicSettings, onBookClick }: AboutSectionProps) {
  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';

  return (
    <section id="about" className="py-16 lg:py-24 bg-white border-y border-[#DDE7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Visual Column */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="relative flex-1 min-h-[340px] rounded-2xl overflow-hidden border border-[#DDE7EB] bg-[#EFF5F7]">
              <DentalImage
                src={CLINIC_IMAGES.aboutConsultation.src}
                alt={CLINIC_IMAGES.aboutConsultation.alt}
                fallbackTitle="Patient-Centered Dental Consultation"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="aspect-4/3 rounded-2xl overflow-hidden border border-[#DDE7EB] bg-[#EFF5F7]">
                <DentalImage
                  src={CLINIC_IMAGES.clinicLounge.src}
                  alt={CLINIC_IMAGES.clinicLounge.alt}
                  fallbackTitle="Clinic Reception Lounge"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-4/3 rounded-2xl overflow-hidden border border-[#DDE7EB] bg-[#EFF5F7]">
                <DentalImage
                  src={CLINIC_IMAGES.teethCleaning.src}
                  alt={CLINIC_IMAGES.teethCleaning.alt}
                  fallbackTitle="Sterilized Hygiene Instruments"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-[#0D7A7E] mb-2">Our Practice</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F2430] text-balance">
              Calm, meticulous dentistry built on trust.
            </h2>

            <p className="mt-5 text-base text-[#4A606D] leading-relaxed">
              At {clinicName}, we believe routine dental care should feel reassuring from the
              moment you step into reception. Our clinical rooms combine quiet architectural warmth
              with modern low-dose diagnostics so you always feel informed and at ease.
            </p>

            <div className="mt-8 divide-y divide-[#E6EEF1] border-y border-[#E6EEF1]">
              {CARE_PRINCIPLES.map((item) => (
                <div key={item.number} className="py-5 flex items-start gap-4">
                  <span className="font-mono-tabular text-xs font-semibold text-[#0D7A7E] pt-1 shrink-0">
                    {item.number}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#0F2430]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#4A606D] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-5">
              <button
                type="button"
                onClick={onBookClick}
                className="px-5 py-3 text-sm font-medium text-white bg-[#0F2430] rounded-xl hover:bg-[#19384A] transition-colors cursor-pointer whitespace-nowrap"
              >
                Book your appointment
              </button>
              <span className="text-xs text-[#5A7280]">
                New &amp; returning patients welcome
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
