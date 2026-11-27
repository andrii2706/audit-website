'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitLead, type LeadState } from '@/app/actions';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import { cx } from '@/lib/format';
import Spinner from './Spinner';
import { ChatDots, ChatRound, Mail, Phone, Telegram } from './Icons';
import { btn, field } from './ui';

type Props = {
  locale: Locale;
  dict: Dictionary['form'];
  /** "estimate": full form with service + revenue; "compact": service page sidebar. */
  variant?: 'estimate' | 'compact';
  serviceOptions?: string[];
  /** Fixed service (service page). */
  service?: string;
  sourcePage: string;
  className?: string;
};

const initial: LeadState = { ok: false };

// Standalone recipe (not built on `chip`): icon-only square-ish buttons on phones, icon + label pills from sm.
const channelBtn =
  'inline-flex h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-card text-[15px] font-medium text-ink transition-[border-color,translate,scale,background-color,color,box-shadow] duration-300 ease-(--ease-out-expo) hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_20px_-12px_rgba(11,18,32,0.35)] active:scale-[0.97] active:duration-100 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white aria-pressed:[&_svg]:stroke-current sm:h-11 sm:shrink-0 sm:pr-4 sm:pl-3.5';

export default function LeadForm({ locale, dict, variant = 'estimate', serviceOptions = [], service, sourcePage, className }: Props) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [svc, setSvc] = useState(service ?? serviceOptions[0] ?? '');
  const [revenue, setRevenue] = useState(dict.revenue[1]);
  const [channel, setChannel] = useState('telegram');
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  const channels = [
    { id: 'telegram', label: 'Telegram', icon: <Telegram size={20} /> },
    { id: 'viber', label: 'Viber', icon: <ChatDots size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <ChatRound size={20} /> },
    { id: 'call', label: dict.call, icon: <Phone size={19} /> },
    { id: 'email', label: dict.channelEmail, icon: <Mail size={20} /> },
  ];
  const isEstimate = variant === 'estimate';
  const shell = cx('flex min-w-0 flex-col gap-5 sm:gap-6', isEstimate && 'rounded-card bg-card p-5 sm:p-8', className);

  // GitHub Pages demo: there is no server, so say plainly that nothing was sent (no success tick, no "we'll call you").
  if (state.ok && state.demo) {
    return (
      <div role="status" className={cx(shell, 'min-h-72 animate-fade-up justify-center')}>
        <span aria-hidden="true" className="inline-flex size-14 animate-pop items-center justify-center rounded-full bg-star text-2xl font-bold text-ink">!</span>
        <h3 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{dict.demoTitle}</h3>
        <p className="text-muted">{dict.demoNote}</p>
      </div>
    );
  }
  if (state.ok) {
    return (
      <div role="status" className={cx(shell, 'min-h-72 animate-fade-up justify-center')}>
        <span aria-hidden="true" className="inline-flex size-14 animate-pop items-center justify-center rounded-full bg-accent text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" />
          </svg>
        </span>
        <h3 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{dict.successTitle}</h3>
        <p className="text-muted">{t(dict.successText, { channel: channels.find((c) => c.id === channel)?.label ?? 'Telegram' })}</p>
      </div>
    );
  }

  const fe = state.fieldErrors ?? {};
  const err = (k: 'name' | 'phone' | 'email' | 'contact') => (fe[k] ? dict[fe[k] as 'errName' | 'errPhone' | 'errEmail' | 'errContact'] : null);
  const contactErr = !!fe.contact;

  return (
    <form action={action} noValidate aria-busy={pending} className={cx(shell, 'transition-opacity', pending && '[&_fieldset]:pointer-events-none [&_fieldset]:opacity-60 [&_input]:opacity-70')}>
      <input type="hidden" name="service" value={svc} />
      <input type="hidden" name="revenue" value={isEstimate ? revenue : ''} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <input type="hidden" name="locale" value={locale} />
      {/* Filled after hydration: the server treats forms sent within a couple of seconds as bots (lib/lead.ts). */}
      <input ref={startedRef} type="hidden" name="startedAt" defaultValue="" />
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>{dict.honeypot}<input type="text" name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {isEstimate && serviceOptions.length > 0 && (
        <fieldset className="min-w-0">
          <legend className="mb-2.5 text-sm font-semibold">{dict.q1}</legend>
          {/* Same segmented panel as the revenue question below: an even 2-column grid (an odd last option spans both). */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-bg p-1.5 [&>*:last-child:nth-child(odd)]:col-span-2">
            {serviceOptions.map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={svc === o}
                onClick={() => setSvc(o)}
                className="flex min-h-12 min-w-0 cursor-pointer items-center justify-center rounded-xl px-2.5 py-2 text-center text-[13px] leading-tight font-semibold break-words text-ink/75 transition hover:text-ink aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-sm xs:text-sm"
              >
                {o}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isEstimate && (
        <fieldset className="min-w-0">
          <legend className="mb-2.5 text-sm font-semibold">{dict.q2}</legend>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-bg p-1.5">
            {dict.revenue.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={revenue === r}
                onClick={() => setRevenue(r)}
                className="h-12 cursor-pointer rounded-xl px-1 text-[13px] font-semibold text-ink/75 transition hover:text-ink aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-sm xs:text-sm"
              >
                {r}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className={cx('grid gap-3.5', isEstimate && 'sm:grid-cols-2')}>
        <label className={cx('flex flex-col gap-1.5 text-sm font-semibold', isEstimate && 'sm:col-span-2')}>
          {dict.name}
          <input type="text" name="name" autoComplete="name" placeholder={dict.namePlaceholder} required aria-invalid={!!fe.name} className={cx(field, fe.name && 'animate-shake')} />
          {err('name') && <span className="animate-fade-in text-[13px] font-medium text-danger">{err('name')}</span>}
        </label>
        {/* Phone OR e-mail: at least one is required (validated on the server). */}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {dict.phone}
          <input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="+380" aria-invalid={!!fe.phone || contactErr} aria-describedby="lead-contact-hint" className={cx(field, (fe.phone || contactErr) && 'animate-shake')} />
          {err('phone') && <span className="animate-fade-in text-[13px] font-medium text-danger">{err('phone')}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {dict.email}
          <input type="email" name="email" autoComplete="email" inputMode="email" placeholder={dict.emailPlaceholder} aria-invalid={!!fe.email || contactErr} aria-describedby="lead-contact-hint" className={cx(field, (fe.email || contactErr) && 'animate-shake')} />
          {err('email') && <span className="animate-fade-in text-[13px] font-medium text-danger">{err('email')}</span>}
        </label>
        <p id="lead-contact-hint" className={cx('-mt-1 text-[13px]', isEstimate && 'sm:col-span-2', contactErr ? 'animate-fade-in font-medium text-danger' : 'text-muted')}>
          {contactErr ? err('contact') : dict.contactHint}
        </p>
        {!isEstimate && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {dict.comment}
            <textarea name="comment" rows={3} className={cx(field, 'py-3')} />
          </label>
        )}
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2.5 text-sm font-semibold">{isEstimate ? dict.q3 : dict.where}</legend>
        {/* Phones: five icon buttons in one row (names stay for screen readers, the chosen one is named below).
            From sm: icon + name chips. */}
        <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
          {channels.map((c) => (
            <button key={c.id} type="button" className={channelBtn} aria-pressed={channel === c.id} onClick={() => setChannel(c.id)} title={c.label}>
              {c.icon}
              <span className="max-sm:sr-only">{c.label}</span>
            </button>
          ))}
        </div>
        <p aria-hidden="true" className="mt-2 text-[13px] text-muted sm:hidden">{channels.find((c) => c.id === channel)?.label}</p>
      </fieldset>

      {(state.error || state.rateLimited) && (
        <div role="alert" className="animate-shake rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">{state.rateLimited ? dict.errTooMany : dict.errGeneric}</div>
      )}

      <button type="submit" disabled={pending} aria-busy={pending} className={cx(btn.accent, 'w-full disabled:cursor-wait disabled:opacity-90')}>
        {pending ? <><Spinner /> {dict.sending}</> : isEstimate ? dict.submit : dict.submitCompact}
      </button>
      <span className="text-center text-[13px] text-muted">{dict.consent}</span>
    </form>
  );
}
