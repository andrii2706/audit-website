'use client';

import { useParams } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';

// loading.tsx files receive no params, so the screen-reader text is picked from the URL on the client.
const LABEL: Record<Locale, string> = {
  uk: 'Завантаження…',
  en: 'Loading…',
};

export default function SkeletonStatus() {
  const { locale } = useParams<{ locale?: string }>();
  return (
    <span role="status" className="sr-only">
      {LABEL[locale && isLocale(locale) ? locale : 'uk']}
    </span>
  );
}
