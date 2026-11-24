import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import { DentalImage } from '../DentalImage';
import { getServiceImage } from '../../lib/images';
import { formatCurrency, formatDuration } from '../../lib/formatters';
import type { DentalService } from '../../types/database';

interface ServicesSectionProps {
  services: DentalService[];
  loading: boolean;
  error: string | null;
  selectedServiceId: string | null;
  onSelectService: (service: DentalService) => void;
}

export function ServicesSection({
  services,
  loading,
  error,
  selectedServiceId,
  onSelectService,
}: ServicesSectionProps) {
  return (
    <section id="services" className="py-16 lg:py-24 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#0D7A7E] mb-2">
              Dental Care Services
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F2430] text-balance">
              Preventive, restorative, and smile care tailored to every stage.
            </h2>
          </div>
          <p className="text-sm text-[#4A606D] max-w-md leading-relaxed">
            Every treatment begins with clear imaging, transparent pricing, and a calm pace.
            Select any service below to check open appointment times.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-4/3 bg-[#E9F1F4]" />
                <div className="p-6 space-y-3">
                  <div className="h-5 w-2/3 bg-[#E9F1F4] rounded" />
                  <div className="h-4 w-full bg-[#F1F6F8] rounded" />
                  <div className="h-4 w-4/5 bg-[#F1F6F8] rounded" />
                  <div className="pt-4 h-10 w-full bg-[#E9F1F4] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error / Permission Notice */}
        {!loading && error && (
          <div className="bg-white border border-[#DDE7EB] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0F2430]">
                Unable to load dental services
              </h3>
              <p className="mt-1 text-sm text-[#4A606D] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="bg-white border border-[#DDE7EB] rounded-2xl p-10 text-center">
            <h3 className="font-display text-lg font-semibold text-[#0F2430]">
              No active dental services available right now
            </h3>
            <p className="mt-2 text-sm text-[#4A606D] max-w-md mx-auto">
              Services added and activated in the clinic dashboard will appear here
              automatically for patient booking.
            </p>
          </div>
        )}

        {/* Populated Services Grid */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {services.map((service, index) => {
              const image = getServiceImage(service.name, index);
              const isSelected = selectedServiceId === service.id;

              return (
                <article
                  key={service.id}
                  className={`group flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#0D7A7E] ring-2 ring-[#0D7A7E]/15'
                      : 'border-[#DDE7EB] hover:border-[#9EC2CA]'
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-[#EFF5F7]">
                    <DentalImage
                      src={image.src}
                      alt={image.alt}
                      fallbackTitle={service.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    {/* Clean unboxed metadata row (zero pills) */}
                    <div className="flex items-center gap-2 text-xs font-medium text-[#5A7280] tabular-nums mb-2">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDuration(service.duration_minutes)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0F2430] font-semibold">
                        {formatCurrency(service.price)}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[#0F2430] tracking-tight">
                      {service.name}
                    </h3>

                    <p className="mt-2.5 text-sm text-[#4A606D] leading-relaxed flex-1">
                      {service.description ||
                        'Personalized dental consultation and care tailored to your oral health goals.'}
                    </p>

                    <div className="mt-6 pt-4 border-t border-[#EDF2F4]">
                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#0D7A7E] text-white hover:bg-[#095F63]'
                            : 'bg-[#F2F7F8] text-[#0F2430] hover:bg-[#0D7A7E] hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Selected for booking</span>
                          </>
                        ) : (
                          <>
                            <span>Book this service</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
