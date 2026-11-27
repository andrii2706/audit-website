'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import uk from '@/i18n/dictionaries/uk.json';
import en from '@/i18n/dictionaries/en.json';

const texts: Record<Locale, { nf: typeof uk.notFound; services: string }> = {
  uk: { nf: uk.notFound, services: uk.pages.servicesTitle },
  en: { nf: en.notFound, services: en.pages.servicesTitle },
};

export default function NotFound() {
  const p = useParams<{ locale?: string }>();
  const locale: Locale = p?.locale && isLocale(p.locale) ? p.locale : 'uk';
  const { nf, services } = texts[locale];
  return (
    <section className="wrap notfound">
      <p className="display nf-code">404</p>
      <h1 className="display h2-left">{nf.title}</h1>
      <p className="lead muted">{nf.text}</p>
      <div className="hero-cta">
        <Link className="btn btn-dark" href={`/${locale}/services`}>{services}</Link>
        <Link className="fxlink" href={`/${locale}`}>{nf.home}</Link>
      </div>
    </section>
  );
}
