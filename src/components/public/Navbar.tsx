import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  clinicName: string;
  onBookClick: () => void;
}

export function Navbar({ clinicName, onBookClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#DDE7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#0F2430] whitespace-nowrap shrink-0 truncate max-w-[220px] sm:max-w-xs"
        >
          {clinicName}
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A606D]"
        >
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('services');
            }}
            className="hover:text-[#0F2430] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#0D7A7E]"
          >
            Services
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('about');
            }}
            className="hover:text-[#0F2430] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#0D7A7E]"
          >
            Our Practice
          </a>
          <a
            href="#hours"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('hours');
            }}
            className="hover:text-[#0F2430] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#0D7A7E]"
          >
            Hours
          </a>
          <a
            href="#book"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('book');
            }}
            className="hover:text-[#0F2430] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#0D7A7E]"
          >
            Book Visit
          </a>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onBookClick();
            }}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-lg hover:bg-[#095F63] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D7A7E]"
          >
            Book Appointment
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#0F2430] hover:bg-[#EFF5F7] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DDE7EB] bg-white px-4 py-4 space-y-2">
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('services');
            }}
            className="block px-3 py-2.5 text-sm font-medium text-[#0F2430] rounded-lg hover:bg-[#F1F6F8]"
          >
            Services
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('about');
            }}
            className="block px-3 py-2.5 text-sm font-medium text-[#0F2430] rounded-lg hover:bg-[#F1F6F8]"
          >
            Our Practice
          </a>
          <a
            href="#hours"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('hours');
            }}
            className="block px-3 py-2.5 text-sm font-medium text-[#0F2430] rounded-lg hover:bg-[#F1F6F8]"
          >
            Hours
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onBookClick();
            }}
            className="w-full mt-2 px-4 py-3 text-sm font-medium text-white bg-[#0D7A7E] rounded-lg hover:bg-[#095F63] transition-colors cursor-pointer"
          >
            Book Appointment
          </button>
        </div>
      )}
    </header>
  );
}
