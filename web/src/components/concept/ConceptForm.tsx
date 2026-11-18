'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { submitLead, type LeadState } from '@/app/actions';
import { ChatDots, ChatRound, Mail, Phone, Telegram } from '@/components/Icons';
import Spinner from '@/components/Spinner';
import type { Locale } from '@/i18n/config';
import { t } from '@/i18n/format';
import type { Dictionary } from '@/i18n/get-dictionary';
import { cx } from '@/lib/format';
import './concept-form.css';

type Props = {
  locale: Locale;
  dict: Dictionary['form'];
  /** "estimate": service + revenue questions (home, audiences); "compact": contacts and service pages (+ comment). */
  variant?: 'estimate' | 'compact';
  /** Answers to "Which service?" (estimate). */
  serviceOptions?: string[];
  /** Fixed service (service page). */
  service?: string;
  /** Small heading inside the card ("Замовити: …"). */
  title?: string;
  sourcePage: string;
  submitLabel?: string;
  className?: string;
};

const initial: LeadState = { ok: false };
/** Step texts used until the dictionaries have them (scripts/apply-form-update.mjs adds them), so the form never breaks. */
const STEP_TEXT: Record<Locale, { stepOf: string; steps: string[]; next: string; back: string }> = {
  uk: { stepOf: 'Крок {n} з {total}', steps: ['Ваш запит', 'Контакти', 'Куди відповісти'], next: 'Далі', back: 'Назад' },
  en: { stepOf: 'Step {n} of {total}', steps: ['Your request', 'Contacts', 'Where to reply'], next: 'Next', back: 'Back' },
};
const Back = () => (
  <svg width="18" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M20 6H2M7 1 2 6l5 5" />
  </svg>
);
const Next = () => (
  <svg width="18" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M0 6h18M13 1l5 5-5 5" />
  </svg>
);
const UpRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 12 12 4M5.5 4H12v6.5" />
  </svg>
);

/** One question of the form: a legend and a segmented choice (2 columns for services, 3 for revenue). */
function Choice({ legend, options, value, onChange, cols }: { legend: string; options: string[]; value: string; onChange: (v: string) => void; cols: 2 | 3 }) {
  return (
    <fieldset className="q">
      <legend className="q-l">{legend}</legend>
      <div className={cx('seg', cols === 3 && 'seg-3')}>
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Request form of the editorial design, with everything the previous site form had: which service and the revenue
 * (estimate), name, phone and/or e-mail (one of them is enough), a comment (compact) and where to answer:
 * Telegram, Viber, WhatsApp, a call or e-mail. Validation, honeypot, minimum fill time and rate limits live on the
 * server (lib/lead.ts via the submitLead action), so the field names stay the same as before.
 *
 * The estimate variant turns into three steps on phones (request → contacts → where to answer, see concept.css
 * "steps"): one <form> throughout, CSS only hides the other steps, so wider screens show everything at once.
 */
export default function ConceptForm({ locale, dict, variant = 'compact', serviceOptions = [], service, title, sourcePage, submitLabel, className }: Props) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [svc, setSvc] = useState(service ?? serviceOptions[0] ?? '');
  const [revenue, setRevenue] = useState(dict.revenue[1]);
  const [channel, setChannel] = useState('telegram');
  const [step, setStep] = useState(1);
  const [local, setLocal] = useState<{ name?: boolean; contact?: boolean }>({});
  const [seen, setSeen] = useState(state);
  const startedRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  // A new answer from the server with a contact error: go back to the contacts step.
  if (state !== seen) {
    setSeen(state);
    const f = state.fieldErrors;
    if (f && (f.name || f.phone || f.email || f.contact)) setStep(2);
  }
  // Steps are on only where CSS shows the step bar (phones).
  const stepped = () => (topRef.current?.getClientRects().length ?? 0) > 0;
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    const top = topRef.current;
    if (!top || !top.getClientRects().length) return;
    headRef.current?.focus({ preventScroll: true });
    const y = top.getBoundingClientRect().top;
    if (y < 90) window.scrollBy({ top: y - 96, behavior: 'smooth' });
  }, [step]);

  const channels: { id: string; label: string; icon: ReactNode }[] = [
    { id: 'telegram', label: 'Telegram', icon: <Telegram size={18} color="currentColor" /> },
    { id: 'viber', label: 'Viber', icon: <ChatDots size={18} color="currentColor" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <ChatRound size={18} color="currentColor" /> },
    { id: 'call', label: dict.call, icon: <Phone size={17} /> },
    { id: 'email', label: dict.channelEmail, icon: <Mail size={18} /> },
  ];
  const estimate = variant === 'estimate';
  // Read loosely: a branch whose dictionaries don't have the step texts yet still builds and renders.
  const d = dict as unknown as { stepOf?: string; steps?: string[]; next?: string; back?: string };
  const fb = STEP_TEXT[locale] ?? STEP_TEXT.uk;
  const st = { stepOf: d.stepOf ?? fb.stepOf, steps: d.steps?.length === 3 ? d.steps : fb.steps, next: d.next ?? fb.next, back: d.back ?? fb.back };
  const steps = estimate;
  const next = () => {
    if (step === 2) {
      const fd = new FormData(formRef.current!);
      const v = (k: string) => String(fd.get(k) ?? '').trim();
      const e = { name: !v('name'), contact: !v('phone') && !v('email') };
      setLocal(e);
      if (e.name || e.contact) {
        formRef.current?.querySelector<HTMLInputElement>(e.name ? 'input[name="name"]' : 'input[name="phone"]')?.focus();
        return;
      }
    }
    setStep((n) => Math.min(3, n + 1));
  };

  const channelLabel = channels.find((c) => c.id === channel)?.label ?? 'Telegram';

  if (state.ok) {
    return (
      <div role="status" className={cx('form form-done', className)}>
        <span className={cx('done-mark', state.demo && 'done-mark-demo')} aria-hidden="true">{state.demo ? '!' : <span className="tick tick-lg" />}</span>
        <p className="form-h">{state.demo ? dict.demoTitle : dict.successTitle}</p>
        <p className="muted">{state.demo ? dict.demoNote : t(dict.successText, { channel: channelLabel })}</p>
      </div>
    );
  }

  const fe = state.fieldErrors ?? {};
  const err = (k: 'name' | 'phone' | 'email' | 'contact') =>
    fe[k] ? dict[fe[k] as 'errName' | 'errPhone' | 'errEmail' | 'errContact'] : k === 'name' && local.name ? dict.errName : k === 'contact' && local.contact ? dict.errContact : null;
  const contactErr = !!fe.contact || !!local.contact;
  const on = (n: number) => cx('st', step === n && 'on');
  const later = steps && step < 3 ? 'st-hide' : undefined;
  const hintId = `${variant}-contact-hint`;

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      aria-busy={pending}
      data-step={steps ? step : undefined}
      className={cx('form form-full', steps && 'form-steps', pending && 'is-pending', className)}
      onSubmit={(e) => {
        // Enter in a field of steps 1–2 goes to the next step instead of sending.
        if (steps && step < 3 && stepped()) { e.preventDefault(); next(); }
      }}
      onInput={() => { if (local.name || local.contact) setLocal({}); }}
    >
      {title && <p className="form-h">{title}</p>}
      {steps && (
        <div ref={topRef} className="st-top">
          <p ref={headRef} tabIndex={-1} className="st-head" aria-live="polite">
            {t(st.stepOf, { n: step, total: 3 })} · <b>{st.steps[step - 1]}</b>
          </p>
          <div className="st-bar" aria-hidden="true"><i /><i /><i /></div>
        </div>
      )}
      <input type="hidden" name="service" value={svc} />
      <input type="hidden" name="revenue" value={estimate ? revenue : ''} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <input type="hidden" name="locale" value={locale} />
      {/* Filled after hydration: the server treats forms sent within a couple of seconds as bots. */}
      <input ref={startedRef} type="hidden" name="startedAt" defaultValue="" />
      <div aria-hidden="true" className="hp">
        <label>{dict.honeypot}<input type="text" name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {estimate && (
        <div className={cx('st-1', on(1))}>
          {serviceOptions.length > 0 && <Choice legend={dict.q1} options={serviceOptions} value={svc} onChange={setSvc} cols={2} />}
          <Choice legend={dict.q2} options={dict.revenue} value={revenue} onChange={setRevenue} cols={3} />
        </div>
      )}

      <div className={cx('f-grid', steps && on(2))}>
        <label className="f-wide">
          {dict.name}
          <input type="text" name="name" autoComplete="name" placeholder={dict.namePlaceholder} required aria-invalid={!!fe.name || !!local.name} />
          {err('name') && <span className="form-err">{err('name')}</span>}
        </label>
        {/* Phone OR e-mail: one of them is enough (checked on the server). */}
        <label>
          {dict.phone}
          <input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="+380" aria-invalid={!!fe.phone || contactErr} aria-describedby={hintId} />
          {err('phone') && <span className="form-err">{err('phone')}</span>}
        </label>
        <label>
          {dict.email}
          <input type="email" name="email" autoComplete="email" inputMode="email" placeholder={dict.emailPlaceholder} aria-invalid={!!fe.email || contactErr} aria-describedby={hintId} />
          {err('email') && <span className="form-err">{err('email')}</span>}
        </label>
        <p id={hintId} className={cx('f-wide f-hint', contactErr && 'form-err')}>{contactErr ? err('contact') : dict.contactHint}</p>
        {!estimate && (
          <label className="f-wide">
            {dict.comment}
            <textarea name="comment" rows={3} />
          </label>
        )}
      </div>

      <fieldset className={cx('q', steps && on(3))}>
        <legend className="q-l">{estimate ? dict.q3 : dict.where}</legend>
        <div className="ch">
          {channels.map((c) => (
            <button key={c.id} type="button" aria-pressed={channel === c.id} onClick={() => setChannel(c.id)} title={c.label}>
              {c.icon}
              <span className="ch-n">{c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {(state.error || state.rateLimited) && <p className="form-alert" role="alert">{state.rateLimited ? dict.errTooMany : dict.errGeneric}</p>}

      <div className="f-actions">
        {steps && step > 1 && (
          <button type="button" className="btn st-only st-back" onClick={() => setStep((n) => n - 1)} aria-label={st.back} title={st.back}>
            <Back />
          </button>
        )}
        {steps && step < 3 && (
          <button type="button" className="btn btn-accent st-only st-next" onClick={next}>
            {st.next} <Next />
          </button>
        )}
        <button className={cx('btn btn-accent f-submit', later)} type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <><Spinner /> {dict.sending}</> : <>{submitLabel ?? (estimate ? dict.submit : dict.submitCompact)} <UpRight /></>}
        </button>
      </div>
      <p className={cx('form-note', later)}>{dict.consent}</p>
    </form>
  );
}
