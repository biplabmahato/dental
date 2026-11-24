export interface ClinicImageAsset {
  src: string;
  alt: string;
  caption: string;
}

/**
 * Centralized dental clinic imagery registry.
 * Replace any URL here to update imagery across the public site.
 */
export const CLINIC_IMAGES = {
  heroSuite: {
    src: '/src/assets/images/hero_dental_clinic_1795532221321.jpg',
    alt: 'Bright modern dental clinic treatment suite with floor-to-ceiling garden windows and ergonomic chair',
    caption: 'Calm architectural treatment suite bathed in natural daylight',
  },
  aboutConsultation: {
    src: '/src/assets/images/about_dentist_consultation_1795532220844.jpg',
    alt: 'Dentist consulting warmly with a smiling patient in a bright contemporary dental office',
    caption: 'Unrushed one-on-one consultations focused on clarity and comfort',
  },
  checkupExam: {
    src: '/src/assets/images/service_checkup_exam_1795532222292.jpg',
    alt: 'Clean modern dental examination room with digital diagnostics and calm pale aqua interior',
    caption: 'Precision digital diagnostics in a tranquil exam suite',
  },
  teethCleaning: {
    src: '/src/assets/images/service_teeth_cleaning_1795532222610.jpg',
    alt: 'Sterilized stainless steel dental hygiene mirrors and instruments neatly arranged on a matte ceramic tray',
    caption: 'Hospital-grade sterilization and gentle preventive hygiene',
  },
  teethWhitening: {
    src: '/src/assets/images/service_teeth_whitening_1795532222718.jpg',
    alt: 'Smiling patient with natural healthy bright teeth seated in a sunlit modern dental lounge',
    caption: 'Natural-looking shade brightening tailored to enamel health',
  },
  clinicLounge: {
    src: '/src/assets/images/service_clinic_lounge_1795532222529.jpg',
    alt: 'Minimalist modern dental clinic reception and patient lounge with travertine desk and teal seating',
    caption: 'Welcoming reception lounge designed for calm arrival',
  },
} as const;

const SERVICE_IMAGE_POOL: ClinicImageAsset[] = [
  CLINIC_IMAGES.checkupExam,
  CLINIC_IMAGES.teethCleaning,
  CLINIC_IMAGES.teethWhitening,
  CLINIC_IMAGES.aboutConsultation,
  CLINIC_IMAGES.clinicLounge,
];

/**
 * Matches a service name to the most relevant dental visual asset,
 * falling back cleanly across the curated pool for newly created services.
 */
export function getServiceImage(serviceName: string, index = 0): ClinicImageAsset {
  const normalized = serviceName.toLowerCase();

  if (normalized.includes('clean') || normalized.includes('hygiene') || normalized.includes('polish') || normalized.includes('scale')) {
    return CLINIC_IMAGES.teethCleaning;
  }
  if (normalized.includes('whiten') || normalized.includes('bright') || normalized.includes('bleach')) {
    return CLINIC_IMAGES.teethWhitening;
  }
  if (normalized.includes('checkup') || normalized.includes('exam') || normalized.includes('x-ray') || normalized.includes('diagnostic')) {
    return CLINIC_IMAGES.checkupExam;
  }
  if (normalized.includes('cosmetic') || normalized.includes('veneer') || normalized.includes('align') || normalized.includes('smile')) {
    return CLINIC_IMAGES.teethWhitening;
  }
  if (normalized.includes('emergency') || normalized.includes('urgent') || normalized.includes('pain') || normalized.includes('relief')) {
    return CLINIC_IMAGES.clinicLounge;
  }
  if (normalized.includes('fill') || normalized.includes('crown') || normalized.includes('restor') || normalized.includes('consult')) {
    return CLINIC_IMAGES.aboutConsultation;
  }

  return SERVICE_IMAGE_POOL[index % SERVICE_IMAGE_POOL.length];
}
