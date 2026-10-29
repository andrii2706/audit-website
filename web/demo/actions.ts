/**
 * Pages-demo replacement for src/app/actions.ts (copied over it by scripts/prepare-pages-demo.mjs).
 * GitHub Pages has no server, so the form validates like the real one, waits a moment and shows
 * the success state with a "demo — nothing was sent" note. Same exports as the real module.
 */
export type LeadState = {
  ok: boolean;
  error?: boolean;
  demo?: boolean;
  fieldErrors?: Partial<Record<'name' | 'phone' | 'email' | 'contact', 'errName' | 'errPhone' | 'errEmail' | 'errContact'>>;
};

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const name = str(form.get('name'));
  const phone = str(form.get('phone'));
  const email = str(form.get('email'));
  const channel = str(form.get('channel'));
  const fieldErrors: LeadState['fieldErrors'] = {};
  if (name.length < 2) fieldErrors.name = 'errName';
  if (!phone && !email) fieldErrors.contact = 'errContact';
  if (phone && phone.replace(/\D/g, '').length < 9) fieldErrors.phone = 'errPhone';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = 'errEmail';
  if (channel === 'email' && !email && !fieldErrors.contact) fieldErrors.email = 'errEmail';
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, demo: true };
}
