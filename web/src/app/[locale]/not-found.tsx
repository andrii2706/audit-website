'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import uk from '@/i18n/dictionaries/uk.json';
import en from '@/i18n/dictionaries/en.json';
import { btn, container, h2 } from '@/components/ui';

const texts: Record<Locale, { nf: typeof uk.notFound; services: string }> = {
  uk: { nf: uk.notFound, services: uk.pages.servicesTitle },
  en: { nf: en.notFound, services: en.pages.servicesTitle },
};

export default function NotFound() {
  const p = useParams<{ locale?: string }>();
  const locale: Locale = p?.locale && isLocale(p.locale) ? p.locale : 'uk';
  const { nf, services } = texts[locale];
  return (
    <section className={`${container} flex min-h-[60vh] flex-col items-start justify-center gap-5 py-24`}>
      <b className="font-mono text-muted">404</b>
      <h1 className={h2}>{nf.title}</h1>
      <p className="max-w-xl text-lg text-muted">{nf.text}</p>
      <div className="flex flex-wrap gap-3">
        <Link href={`/${locale}/services`} className={btn.dark}>{services}</Link>
        <Link href={`/${locale}`} className={btn.light}>{nf.home}</Link>
      </div>
    </section>
  );
}
