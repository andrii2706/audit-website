/**
 * Pages-demo replacement for src/app/actions.ts (copied over it by scripts/prepare-pages-demo.mjs).
 * GitHub Pages has no server, so the form validates like the real one (same lib/lead.ts), waits a moment and
 * shows the success state with a "demo — nothing was sent" note. Same exports as the real module.
 */
import { parseLead, type FieldErrors } from '@/lib/lead';

export type LeadState = {
  ok: boolean;
  error?: boolean;
  rateLimited?: boolean;
  demo?: boolean;
  fieldErrors?: FieldErrors;
};

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const parsed = parseLead(form);
  if (parsed.kind === 'invalid') return { ok: false, fieldErrors: parsed.fieldErrors };
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, demo: true };
}
