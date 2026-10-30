import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import type { Locale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { formatPhone } from './format';
import type { LeadInput } from './strapi';

/**
 * E-mail delivery for leads (SMTP via nodemailer). Configured by env:
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("true" for port 465), SMTP_USER, SMTP_PASS,
 *   MAIL_FROM            — sender, e.g. "Бізнес Партнери <noreply@bp-audit.com.ua>" (default: SMTP_USER)
 *   LEAD_EMAIL_TO        — where new leads go, comma-separated (default: e-mail from Strapi Global)
 *   LEAD_CONFIRMATION    — "false" disables the confirmation e-mail to the client
 * Without SMTP_HOST e-mail is simply skipped (leads are still stored in Strapi).
 */
let transporter: Transporter | null | undefined;
function getTransport() {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  transporter = host
    ? nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

export const mailEnabled = () => !!getTransport();

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function layout(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0b1220">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e3e6eb;border-radius:20px;padding:28px">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:16px">${esc(title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${inner}</td></tr>
</table></td></tr></table></body></html>`;
}

const CHANNEL_UK: Record<string, string> = { telegram: 'Telegram', viber: 'Viber', whatsapp: 'WhatsApp', call: 'Дзвінок', email: 'E-mail' };

/** Notification to the company (in Ukrainian — the team's language). Reply-To = the client's e-mail. */
async function sendCompanyMail(lead: LeadInput, to: string, from: string) {
  const rows: [string, string | undefined][] = [
    ["Ім'я", lead.name],
    ['Телефон', lead.phone ? formatPhone(lead.phone) : undefined],
    ['E-mail', lead.email],
    ['Послуга', lead.service],
    ['Виручка', lead.revenue],
    ['Куди відповісти', lead.channel ? CHANNEL_UK[lead.channel] ?? lead.channel : undefined],
    ['Коментар', lead.comment],
    ['Мова сайту', lead.locale_code?.toUpperCase()],
    ['Сторінка', lead.sourcePage],
  ];
  const filled = rows.filter((r): r is [string, string] => !!r[1]);
  const html = layout(
    'Нова заявка з сайту',
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${filled
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#4a5363;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
      .join('')}</table>${lead.email ? '<p style="margin-top:18px;color:#4a5363;font-size:13px">Натисніть «Відповісти», щоб написати клієнту.</p>' : ''}`,
  );
  const text = ['Нова заявка з сайту', '', ...filled.map(([k, v]) => `${k}: ${v}`)].join('\n');
  await getTransport()!.sendMail({
    from,
    to,
    replyTo: lead.email || undefined,
    subject: `Нова заявка: ${lead.service || 'консультація'} — ${lead.name}`,
    text,
    html,
  });
}

/** Confirmation to the client in the language of the page they used. */
async function sendClientMail(lead: LeadInput & { email: string }, locale: Locale, from: string, site: string, companyEmail?: string | null, phone?: string | null) {
  const m = (await getDictionary(locale)).mail;
  const service = lead.service ? t(m.service, { service: lead.service }) : '';
  const lines = [
    t(m.hello, { name: lead.name }),
    t(m.body, { service }),
    phone ? t(m.contact, { phone: formatPhone(phone) }) : '',
    t(m.signature, { site }),
  ].filter(Boolean);
  await getTransport()!.sendMail({
    from,
    to: lead.email,
    replyTo: companyEmail || undefined,
    subject: t(m.subject, { site }),
    text: [...lines, '', m.auto].join('\n\n'),
    html: layout(
      t(m.subject, { site }),
      `${lines.map((l) => `<p style="margin:0 0 12px">${esc(l).replace(/\n/g, '<br>')}</p>`).join('')}<p style="margin-top:20px;color:#4a5363;font-size:13px">${esc(m.auto)}</p>`,
    ),
  });
}

/**
 * Sends the lead e-mails. Returns true when the company notification was delivered to the SMTP server.
 * Never throws — a mail failure must not lose the lead.
 */
export async function sendLeadEmails(lead: LeadInput, locale: Locale, ctx: { site: string; companyEmail?: string | null; phone?: string | null }) {
  if (!getTransport()) return false;
  const to = process.env.LEAD_EMAIL_TO || ctx.companyEmail;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || ctx.companyEmail || 'noreply@localhost';
  let companyOk = false;
  if (to) {
    try {
      await sendCompanyMail(lead, to, from);
      companyOk = true;
    } catch (err) {
      console.error('[mail] company notification failed:', (err as Error).message);
    }
  } else {
    console.error('[mail] no recipient: set LEAD_EMAIL_TO or the e-mail in Strapi → Global');
  }
  if (lead.email && process.env.LEAD_CONFIRMATION !== 'false') {
    try {
      await sendClientMail({ ...lead, email: lead.email }, locale, from, ctx.site, ctx.companyEmail, ctx.phone);
    } catch (err) {
      console.error('[mail] client confirmation failed:', (err as Error).message);
    }
  }
  return companyOk;
}
