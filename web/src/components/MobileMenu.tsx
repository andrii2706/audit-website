'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from '@/i18n/config';
import { formatPhone, telHref } from '@/lib/format';
import BrandMark from './BrandMark';
import { Close, Menu } from './Icons';
import { LanguageChips } from './LanguageSwitcher';
import { btn, iconBtn } from './ui';

type Props = {
  locale: Locale;
  nav: { href: string; label: string }[];
  phones: string[];
  email: string | null;
  hours: string[];
  name: string;
  labels: { open: string; close: string; menu: string; cta: string; language: string; switching: string };
};

/** Full-screen menu for screens below 1280px. */
export default function MobileMenu({ locale, nav, phones, email, hours, name, labels }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className={`${iconBtn} xl:hidden`} aria-label={labels.open} aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu />
      </button>
      {/* Portal: the sticky header uses backdrop-filter, which would otherwise trap position:fixed inside it. */}
      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label={labels.menu} className="fixed inset-0 z-50 flex animate-fade-in flex-col gap-6 overflow-y-auto bg-ink px-4 pt-5 pb-8 text-white sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white"><BrandMark className="h-7 w-auto" /></span>
              <b className="truncate text-lg">{name}</b>
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className={`${iconBtn} border-dark-line text-white hover:border-white`} aria-label={labels.close} onClick={() => setOpen(false)}>
                <Close />
              </button>
            </div>
          </div>
          <nav aria-label={labels.menu} className="flex flex-col">
            {nav.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${60 + i * 45}ms` }}
                aria-current={pathname.startsWith(n.href) ? 'page' : undefined}
                className="animate-slide-in cursor-pointer border-b aria-[current=page]:text-lime border-dark-line py-3 text-[26px] font-semibold tracking-tight text-white transition-colors hover:text-lime sm:text-3xl"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <LanguageChips locale={locale} label={labels.language} onNavigate={() => setOpen(false)} />
          <div className="mt-auto flex flex-col gap-3">
            {phones.map((p) => (
              <a key={p} href={telHref(p)} className="cursor-pointer text-xl font-semibold text-white">
                {formatPhone(p)}
              </a>
            ))}
            {email && <a href={`mailto:${email}`} className="cursor-pointer break-all text-dark-muted hover:text-white">{email}</a>}
            {hours.map((h) => <span key={h} className="text-sm text-dark-muted">{h}</span>)}
            <Link href={`/${locale}#estimate`} onClick={() => setOpen(false)} className={`${btn.accent} w-full`}>
              {labels.cta}
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
