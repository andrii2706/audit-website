// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import uk from '@/i18n/dictionaries/uk.json';
import type { LeadState } from '@/app/actions';

const submitLead = vi.fn<(prev: LeadState, form: FormData) => Promise<LeadState>>();
vi.mock('@/app/actions', () => ({ submitLead: (prev: LeadState, form: FormData) => submitLead(prev, form) }));
const { default: LeadForm } = await import('@/components/LeadForm');

const dict = uk.form;
const services = ['Аудит', 'Податковий консалтинг', 'Due diligence'];
const renderForm = (variant: 'estimate' | 'compact' = 'estimate') =>
  render(<LeadForm locale="uk" dict={dict} variant={variant} serviceOptions={services} sourcePage="/uk" />);
const submit = async () => {
  await act(async () => {
    fireEvent.submit(document.querySelector('form')!);
  });
};
const lastForm = () => submitLead.mock.calls.at(-1)![1];

beforeEach(() => submitLead.mockReset().mockResolvedValue({ ok: true }));

describe('<LeadForm>', () => {
  it('renders the questions, fields, five reply channels and a hidden bot trap', () => {
    renderForm();
    expect(screen.getByText(dict.q1)).toBeTruthy();
    expect(screen.getByText(dict.q2)).toBeTruthy();
    expect(screen.getByRole('textbox', { name: dict.name })).toBeTruthy();
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThan(5);
    const trap = document.querySelector<HTMLInputElement>('input[name="company_site"]')!;
    expect(trap.tabIndex).toBe(-1);
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });
  it('stamps the start time for the minimum-fill-time check', () => {
    renderForm();
    const started = Number(document.querySelector<HTMLInputElement>('input[name="startedAt"]')!.value);
    expect(Math.abs(Date.now() - started)).toBeLessThan(5000);
  });
  it('sends the chosen service, revenue and channel with the fields', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Due diligence' }));
    fireEvent.click(screen.getByRole('button', { name: dict.revenue[2] }));
    fireEvent.click(screen.getByRole('button', { name: 'Viber' }));
    fireEvent.change(screen.getByRole('textbox', { name: dict.name }), { target: { value: 'Олена' } });
    expect(screen.getByRole('button', { name: 'Viber' }).getAttribute('aria-pressed')).toBe('true');
    await submit();
    const f = lastForm();
    expect([f.get('service'), f.get('revenue'), f.get('channel'), f.get('name'), f.get('locale')]).toEqual(['Due diligence', dict.revenue[2], 'viber', 'Олена', 'uk']);
  });
  it('shows field errors returned by the server', async () => {
    submitLead.mockResolvedValue({ ok: false, fieldErrors: { name: 'errName', contact: 'errContact' } });
    renderForm();
    await submit();
    expect(screen.getByText(dict.errName)).toBeTruthy();
    expect(screen.getByText(dict.errContact)).toBeTruthy();
    expect(document.querySelector('input[name="name"]')!.getAttribute('aria-invalid')).toBe('true');
  });
  it('tells people when they sent too many requests', async () => {
    submitLead.mockResolvedValue({ ok: false, rateLimited: true });
    renderForm();
    await submit();
    expect(screen.getByRole('alert').textContent).toBe(dict.errTooMany);
  });
  it('shows a general error and the success message', async () => {
    submitLead.mockResolvedValueOnce({ ok: false, error: true }).mockResolvedValueOnce({ ok: true });
    renderForm();
    await submit();
    expect(screen.getByRole('alert').textContent).toBe(dict.errGeneric);
    await submit();
    expect(screen.getByRole('status').textContent).toContain(dict.successTitle);
    expect(screen.getByRole('status').textContent).toContain('Telegram');
  });
  it('says plainly that nothing was sent in the static demo', async () => {
    submitLead.mockResolvedValue({ ok: true, demo: true });
    renderForm();
    await submit();
    expect(screen.getByRole('status').textContent).toContain(dict.demoTitle);
  });
  it('compact variant (service page) has no revenue question', () => {
    renderForm('compact');
    expect(screen.queryByText(dict.q2)).toBeNull();
    expect(screen.getByText(dict.where)).toBeTruthy();
  });
});
