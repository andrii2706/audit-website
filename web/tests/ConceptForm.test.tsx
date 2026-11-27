// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import uk from '@/i18n/dictionaries/uk.json';
import type { LeadState } from '@/app/actions';

const submitLead = vi.fn<(prev: LeadState, form: FormData) => Promise<LeadState>>();
vi.mock('@/app/actions', () => ({ submitLead: (prev: LeadState, form: FormData) => submitLead(prev, form) }));
const { default: ConceptForm } = await import('@/components/concept/ConceptForm');

const dict = uk.form;
const services = ['Аудит', 'Податковий консалтинг', 'Due diligence'];
const renderForm = (variant: 'estimate' | 'compact' = 'estimate') =>
  render(<ConceptForm locale="uk" dict={dict} variant={variant} serviceOptions={services} sourcePage="/uk" />);
const submit = async () => {
  await act(async () => {
    fireEvent.submit(document.querySelector('form')!);
  });
};
const lastForm = () => submitLead.mock.calls.at(-1)![1];

beforeEach(() => submitLead.mockReset().mockResolvedValue({ ok: true }));

describe('<ConceptForm>', () => {
  it('renders the questions, fields, five reply channels and a hidden bot trap', () => {
    renderForm();
    expect(screen.getByText(dict.q1)).toBeTruthy();
    expect(screen.getByText('2. Хто звертається?')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Коротко про ваше питання/ })).toBeTruthy();
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
  it('sends the chosen service, who is asking, the short question and the channel with the fields', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Due diligence' }));
    expect(screen.getByRole('button', { name: 'Юридична особа' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Фізична особа' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Коротко про ваше питання/ }), { target: { value: 'Аудит за 2026 рік' } });
    fireEvent.click(screen.getByRole('button', { name: 'Viber' }));
    fireEvent.change(document.querySelector<HTMLInputElement>('input[name="name"]')!, { target: { value: 'Олена' } });
    expect(screen.getByRole('button', { name: 'Viber' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('4. Куди відповісти?')).toBeTruthy();
    await submit();
    const f = lastForm();
    expect([f.get('service'), f.get('clientType'), f.get('comment'), f.get('channel'), f.get('name'), f.get('locale')]).toEqual([
      'Due diligence', 'individual', 'Аудит за 2026 рік', 'viber', 'Олена', 'uk',
    ]);
    expect(f.get('revenue')).toBeNull();
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
  it('compact variant (service page) has no "who is asking" question', () => {
    renderForm('compact');
    expect(screen.queryByText('2. Хто звертається?')).toBeNull();
    expect(document.querySelector('input[name="clientType"]')!.getAttribute('value')).toBe('');
    expect(screen.getByText(dict.where)).toBeTruthy();
  });
  describe('steps (phones)', () => {
    const form = () => document.querySelector('form')!;
    const nextBtn = () => screen.getByRole('button', { name: /Далі/ });
    it('goes request → contacts → where to answer, checking the contacts first', () => {
      renderForm();
      expect(form().dataset.step).toBe('1');
      expect(screen.getByText(/Крок 1 з 3/)).toBeTruthy();
      fireEvent.click(nextBtn());
      expect(form().dataset.step).toBe('2');
      fireEvent.click(nextBtn());
      expect(form().dataset.step).toBe('2');
      expect(screen.getByText(dict.errName)).toBeTruthy();
      expect(screen.getByText(dict.errContact)).toBeTruthy();
      const name = document.querySelector<HTMLInputElement>('input[name="name"]')!;
      fireEvent.change(name, { target: { value: 'Олена' } });
      fireEvent.input(name);
      expect(screen.queryByText(dict.errName)).toBeNull();
      fireEvent.change(document.querySelector('input[name="email"]')!, { target: { value: 'o@example.com' } });
      fireEvent.click(nextBtn());
      expect(form().dataset.step).toBe('3');
      expect(screen.queryByRole('button', { name: /Далі/ })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
      expect(form().dataset.step).toBe('2');
    });
    it('returns to the contacts step when the server finds a problem there', async () => {
      submitLead.mockResolvedValue({ ok: false, fieldErrors: { contact: 'errContact' } });
      renderForm();
      fireEvent.click(nextBtn());
      await submit();
      expect(form().dataset.step).toBe('2');
    });
    it('the compact form has no steps', () => {
      renderForm('compact');
      expect(form().dataset.step).toBeUndefined();
      expect(screen.queryByRole('button', { name: /Далі/ })).toBeNull();
    });
  });
});
