import { describe, expect, it } from 'vitest';
import { deliverableCards, splitDeliverable } from '@/lib/deliverables';

describe('splitDeliverable', () => {
  it('splits «Title: text» and turns a list of regulators in brackets into tags', () => {
    expect(
      splitDeliverable('Підтвердження для регуляторів (АМКУ, НКЦПФР та НБУ): офіційні висновки аудитора для підтвердження стану'),
    ).toEqual({ title: 'Підтвердження для регуляторів', text: 'Офіційні висновки аудитора для підтвердження стану.', tags: ['АМКУ', 'НКЦПФР', 'НБУ'] });
    expect(splitDeliverable('Confirmation for regulators (AMCU, NSSMC and NBU): official reports')!.tags).toEqual(['AMCU', 'NSSMC', 'NBU']);
  });
  it('keeps a remark in brackets as part of the title and ends the text with one full stop', () => {
    expect(splitDeliverable('Аудит звітності зі сталого розвитку (ESG): підтвердження нефінансових звітів;')).toEqual({
      title: 'Аудит звітності зі сталого розвитку (ESG)', text: 'Підтвердження нефінансових звітів.', tags: [],
    });
  });
  it('gives up on text that is not in that form', () => {
    expect(splitDeliverable('Просто пункт списку')).toBeNull();
    expect(splitDeliverable('Назва: ')).toBeNull();
  });
});

describe('deliverableCards', () => {
  it('makes cards only when every item fits', () => {
    expect(deliverableCards(['A title: one', 'B title: two'])).toHaveLength(2);
    expect(deliverableCards(['A title: one', 'plain item'])).toBeNull();
    expect(deliverableCards([])).toBeNull();
  });
});
