import type { Locale } from '@/i18n/config';
import { cx, formatPhone, telHref } from '@/lib/format';
import type { Global } from '@/lib/strapi';
import { Clock, Mail, MapPin, Navigation, Phone } from './Icons';
import { badge, btn } from './ui';

type Labels = { title: string; office: string; open: string; route: string; phone: string; email: string; hours: string };
type Props = {
  locale: Locale;
  global: Global;
  labels: Labels;
  /** Full card with the dark contact panel (home page). `false` = map only, buttons on the map (contacts page). */
  withInfo?: boolean;
  className?: string;
};

/**
 * Office map in the site style: a dark contact panel next to a toned Google Maps embed (no API key).
 * `global.mapQuery` is coordinates ("49.85,24.02") or an address. The iframe is lazy-loaded over a shimmer
 * and gets its colours back on hover/focus; with reduced motion the filter change is instant.
 */
export default function MapEmbed({ locale, global: g, labels, withInfo = true, className }: Props) {
  const query = (g.mapQuery || g.address)!;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=${locale}&z=17&output=embed`;
  const route = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  const open = g.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const phones = [g.phone, g.phoneSecondary].filter(Boolean) as string[];
  const [street, ...rest] = (g.address ?? '').split(/,\s*(?=Офісний|офісний|Na Lemkivska|Office)/);

  const buttons = (dark: boolean) => (
    <div className="flex flex-col gap-2.5 xs:flex-row xs:flex-wrap">
      <a href={route} target="_blank" rel="noopener noreferrer" className={cx(btn.accentSm, 'w-full xs:w-auto')}>
        <Navigation /> {labels.route}
      </a>
      <a
        href={open}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-5 text-[15px] font-semibold transition-colors duration-300 xs:w-auto',
          dark ? 'border-white/25 text-white hover:border-white hover:bg-white hover:text-ink' : 'border-transparent bg-white text-ink shadow-[0_10px_30px_-12px_rgba(11,18,32,0.45)] hover:bg-bg',
        )}
      >
        <MapPin /> {labels.open}
      </a>
    </div>
  );

  return (
    <div
      className={cx(
        'group/map overflow-hidden rounded-card border border-line bg-card sm:rounded-block',
        withInfo && 'grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]',
        className,
      )}
    >
      {withInfo && (
        <div className="relative flex flex-col gap-6 overflow-hidden bg-ink p-6 text-white sm:p-8 lg:p-10">
          {/* Soft accent glow, same as the dark blocks elsewhere on the site. */}
          <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent/35 blur-3xl" />
          <span className={cx(badge.glass, 'relative self-start')}>{labels.office}</span>
          <address className="relative flex flex-col gap-1 not-italic">
            <span className="text-xl leading-snug font-semibold break-words sm:text-2xl">{street}</span>
            {rest.length > 0 && <span className="text-white/70">{rest.join(', ')}</span>}
          </address>
          <dl className="relative flex flex-col gap-4 text-[15px]">
            {phones.length > 0 && (
              <div className="flex gap-3">
                <dt className="mt-0.5 text-accent-on"><Phone size={18} /><span className="sr-only">{labels.phone}</span></dt>
                <dd className="flex flex-col gap-1">
                  {phones.map((ph) => (
                    <a key={ph} href={telHref(ph)} className="cursor-pointer font-semibold hover:underline">{formatPhone(ph)}</a>
                  ))}
                </dd>
              </div>
            )}
            {g.workingHours && (
              <div className="flex gap-3">
                <dt className="mt-0.5 text-accent-on"><Clock size={18} /><span className="sr-only">{labels.hours}</span></dt>
                <dd className="flex flex-col gap-0.5">
                  <span>{g.workingHours}</span>
                  {g.workingHoursNote && <span className="text-sm text-white/60">{g.workingHoursNote}</span>}
                </dd>
              </div>
            )}
            {g.email && (
              <div className="flex gap-3">
                <dt className="mt-0.5 text-accent-on"><Mail size={18} /><span className="sr-only">{labels.email}</span></dt>
                <dd className="min-w-0"><a href={`mailto:${g.email}`} className="cursor-pointer break-all hover:underline">{g.email}</a></dd>
              </div>
            )}
          </dl>
          <div className="relative mt-auto pt-2">{buttons(true)}</div>
        </div>
      )}

      <div className={cx('skeleton relative isolate', withInfo ? 'h-[340px] sm:h-[420px] lg:h-auto lg:min-h-[480px]' : 'h-[360px] sm:h-[460px]')}>
        <iframe
          title={labels.title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 size-full border-0 [filter:saturate(0.55)_contrast(1.04)] transition-[filter] duration-700 ease-(--ease-out-expo) group-hover/map:[filter:none] focus-within:[filter:none] motion-reduce:transition-none"
        />
        {/* Brand tint over the tiles; it fades on hover so the real colours come back. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-soft mix-blend-multiply transition-opacity duration-700 group-hover/map:opacity-0 motion-reduce:transition-none" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(11,18,32,0.06),inset_0_40px_60px_-50px_rgba(11,18,32,0.35)]" />
        <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-full bg-white/95 py-1.5 pr-4 pl-1.5 shadow-[0_10px_30px_-12px_rgba(11,18,32,0.45)] backdrop-blur sm:top-4 sm:left-4">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white"><MapPin size={15} /></span>
          <span className="truncate text-sm font-semibold text-ink">{g.siteName}{street ? ` · ${street}` : ''}</span>
        </div>
        {!withInfo && <div className="absolute right-3 bottom-3 left-3 sm:right-auto sm:bottom-4 sm:left-4">{buttons(false)}</div>}
      </div>
    </div>
  );
}
