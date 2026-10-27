'use client';

import { useActionState, useState } from 'react';
import { submitLead, type LeadState } from '@/app/actions';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import { cx } from '@/lib/format';
import Spinner from './Spinner';
import { btn, chip, field } from './ui';

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

export default function LeadForm({ locale, dict, variant = 'estimate', serviceOptions = [], service, sourcePage, className }: Props) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [svc, setSvc] = useState(service ?? serviceOptions[0] ?? '');
  const [revenue, setRevenue] = useState(dict.revenue[1]);
  const [channel, setChannel] = useState('telegram');
  const channels = [
    { id: 'telegram', label: 'Telegram' },
    { id: 'viber', label: 'Viber' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'call', label: dict.call },
    { id: 'email', label: dict.channelEmail },
  ];
  const isEstimate = variant === 'estimate';
  const shell = cx('flex min-w-0 flex-col gap-5 sm:gap-6', isEstimate && 'rounded-card bg-card p-5 sm:p-8', className);

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
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>{dict.honeypot}<input type="text" name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {isEstimate && serviceOptions.length > 0 && (
        <fieldset className="min-w-0">
          <legend className="mb-2.5 text-sm font-semibold">{dict.q1}</legend>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((o) => (
              <button key={o} type="button" className={chip} aria-pressed={svc === o} onClick={() => setSvc(o)}>{o}</button>
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
                className="h-11 cursor-pointer rounded-xl px-1 text-[13px] font-semibold transition aria-pressed:bg-white aria-pressed:shadow-sm xs:text-sm"
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
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <button key={c.id} type="button" className={chip} aria-pressed={channel === c.id} onClick={() => setChannel(c.id)}>{c.label}</button>
          ))}
        </div>
      </fieldset>

      {state.error && <div role="alert" className="animate-shake rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">{dict.errGeneric}</div>}

      <button type="submit" disabled={pending} aria-busy={pending} className={cx(btn.accent, 'w-full disabled:cursor-wait disabled:opacity-90')}>
        {pending ? <><Spinner /> {dict.sending}</> : isEstimate ? dict.submit : dict.submitCompact}
      </button>
      <span className="text-center text-[13px] text-muted">{dict.consent}</span>
    </form>
  );
}
