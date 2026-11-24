import { useCallback, useEffect, useState } from 'react';
import { AboutSection } from './components/public/AboutSection';
import { BookingSection } from './components/public/BookingSection';
import { Footer } from './components/public/Footer';
import { HeroSection } from './components/public/HeroSection';
import { Navbar } from './components/public/Navbar';
import { ServicesSection } from './components/public/ServicesSection';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { useClinicData } from './hooks/useClinicData';
import type { DentalService } from './types/database';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function App() {
  const [routeIsAdmin, setRouteIsAdmin] = useState<boolean>(() =>
    isAdminPath(window.location.pathname)
  );
  const [selectedService, setSelectedService] = useState<DentalService | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);

  const {
    services,
    clinicSettings,
    businessHours,
    blockedDates,
    loading,
    error,
    refresh,
  } = useClinicData();

  useEffect(() => {
    const handlePopState = () => {
      setRouteIsAdmin(isAdminPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep selectedService synced if admin edits/deactivates it
  useEffect(() => {
    if (!selectedService) return;
    const match = services.find((s) => s.id === selectedService.id);
    if (!match) {
      setSelectedService(null);
    } else {
      setSelectedService(match);
    }
  }, [services, selectedService]);

  const navigateTo = useCallback((path: '/' | '/admin') => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRouteIsAdmin(isAdminPath(path));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectServiceFromCard = useCallback(
    (service: DentalService) => {
      setSelectedService(service);
      setSelectionNonce((n) => n + 1);
      scrollToSection('book');
    },
    [scrollToSection]
  );

  const clinicName = clinicSettings?.clinic_name || 'Verdant Dental Studio';

  // Update document title dynamically with clinic name when loaded
  useEffect(() => {
    document.title = routeIsAdmin
      ? `${clinicName} — Clinic Admin`
      : `${clinicName} — Modern Preventive & Cosmetic Dental Care`;
  }, [clinicName, routeIsAdmin]);

  if (routeIsAdmin) {
    return (
      <AdminRouteGuard
        clinicName={clinicName}
        onNavigatePublic={() => navigateTo('/')}
        onPublicDataChanged={refresh}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFB] text-[#0F2430]">
      <Navbar
        clinicName={clinicName}
        onBookClick={() => scrollToSection('book')}
      />

      <main className="flex-1">
        <HeroSection
          clinicSettings={clinicSettings}
          businessHours={businessHours}
          onBookClick={() => scrollToSection('book')}
          onExploreServices={() => scrollToSection('services')}
        />

        <ServicesSection
          services={services}
          loading={loading}
          error={error}
          selectedServiceId={selectedService?.id ?? null}
          onSelectService={handleSelectServiceFromCard}
        />

        <AboutSection
          clinicSettings={clinicSettings}
          onBookClick={() => scrollToSection('book')}
        />

        <BookingSection
          services={services}
          clinicSettings={clinicSettings}
          businessHours={businessHours}
          blockedDates={blockedDates}
          selectedService={selectedService}
          selectionNonce={selectionNonce}
          onSelectService={setSelectedService}
        />
      </main>

      <Footer
        clinicSettings={clinicSettings}
        businessHours={businessHours}
        onNavigateAdmin={() => navigateTo('/admin')}
      />
    </div>
  );
}
