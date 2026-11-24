import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface DentalImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export function DentalImage({
  src,
  alt,
  fallbackTitle = 'Modern Dental Care',
  className = '',
}: DentalImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EBF4F6] via-[#F4F9FA] to-[#DCEBED] text-[#1C4D57] p-6 text-center ${className}`}
      >
        <div className="w-11 h-11 rounded-xl bg-white/80 border border-[#CFE2E6] flex items-center justify-center mb-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#0D7A7E]" />
        </div>
        <span className="text-sm font-medium text-[#0F2430] max-w-[18ch]">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
