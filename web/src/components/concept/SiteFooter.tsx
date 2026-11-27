import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import type { Category, Global } from '@/lib/strapi';
import { Phones, UpRight } from './parts';

/** Dark footer: a big call to action, contacts, service categories, company pages, office and hours, legal line. */
export default function SiteFooter({ locale, dict, global: g, categories, ctaTitle }: { locale: Locale; dict: Dictionary; global: Global | null; categories: Category[]; ctaTitle?: string | null }) {
  const f = dict.footer;
  const company = [
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/team`, label: dict.nav.team },
    { href: `/${locale}/career`, label: dict.nav.career },
    { href: `/${locale}/reports`, label: dict.nav.reports },
    { href: `/${locale}/news`, label: dict.nav.news },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/contacts`, label: dict.nav.contacts },
  ];
  const legal = [
    g?.legalName,
    g?.edrpou && t(f.edrpou, { code: g.edrpou }),
    g?.registryNumber && t(f.registry, { n: g.registryNumber }),
    `© ${new Date().getFullYear()} ${g?.siteName ?? dict.meta.siteName}. ${f.rights}`,
  ].filter(Boolean);
  return (
    <footer className="footer" aria-labelledby="foot-title">
      <div className="wrap">
        <div className="foot-cta">
          <h2 id="foot-title" className="display foot-title">{ctaTitle || dict.concept.ctaFallback}</h2>
          <Link className="btn btn-lime" href={`/${locale}/request`}>
            {dict.nav.consultation} <UpRight />
          </Link>
        </div>
        <div className="foot-cols">
          <div>
            {g?.phone && (<><span className="dim">{f.phone}</span><p><Phones g={g} /></p></>)}
            {g?.email && (<><span className="dim c-mt-s">{f.email}</span><p><a href={`mailto:${g.email}`}>{g.email}</a></p></>)}
          </div>
          <div>
            <span className="dim">{f.services}</span>
            <ul className="foot-links">
              {categories.map((c) => (
                <li key={c.documentId}><Link href={`/${locale}/services#${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <span className="dim">{f.company}</span>
            <ul className="foot-links">
              {company.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            {g?.address && (<><span className="dim">{f.office}</span><p>{g.address}</p></>)}
            {g?.workingHours && (<><span className="dim c-mt-s">{f.hours}</span><p>{g.workingHours}</p></>)}
          </div>
        </div>
        <p className="dim fine">{legal.join(' · ')}</p>
      </div>
    </footer>
  );
}
