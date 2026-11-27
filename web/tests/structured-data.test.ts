import { describe, expect, it } from 'vitest';
import { articleLd, breadcrumbLd, buildMetadata, faqLd, newsLd, organizationLd, serviceLd, websiteLd } from '@/lib/seo';
import { daysUntil, formatDate, initials } from '@/lib/format';

describe('buildMetadata', () => {
  it('sets canonical, hreflang, Open Graph and Twitter for a page', () => {
    const m = buildMetadata({ locale: 'en', path: '/services/audit', title: 'Audit', description: 'Statutory audit for companies of every size in Ukraine.' });
    expect(m.title).toEqual({ absolute: 'Audit — Business Partners' });
    expect(m.alternates?.canonical).toBe('https://bp-audit.com.ua/en/services/audit');
    expect(m.alternates?.languages).toMatchObject({ uk: 'https://bp-audit.com.ua/uk/services/audit', 'x-default': 'https://bp-audit.com.ua/uk/services/audit' });
    expect((m.openGraph as { images: { url: string }[] }).images[0].url).toBe('/en/opengraph-image');
  });
  it('supports articles with dates, custom images and absolute titles', () => {
    const m = buildMetadata({ locale: 'uk', path: '/news/x', title: 'Новина', absoluteTitle: true, type: 'article', image: 'https://cms/x.jpg', publishedTime: '2026-01-02', modifiedTime: '2026-01-03' });
    expect(m.title).toEqual({ absolute: 'Новина' });
    expect(m.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-01-02', modifiedTime: '2026-01-03' });
    expect(m.twitter).toMatchObject({ images: ['https://cms/x.jpg'] });
  });
});

describe('JSON-LD', () => {
  it('describes the website, breadcrumbs and FAQ', () => {
    expect(websiteLd('uk', 'Бізнес Партнери')).toMatchObject({ '@type': 'WebSite', url: 'https://bp-audit.com.ua/uk', inLanguage: 'uk' });
    expect(breadcrumbLd([{ name: 'Головна', url: 'u1' }, { name: 'Послуги', url: 'u2' }]).itemListElement[1]).toEqual({ '@type': 'ListItem', position: 2, name: 'Послуги', item: 'u2' });
    expect(faqLd([{ question: 'Q?', answer: 'A.' }]).mainEntity[0]).toMatchObject({ name: 'Q?', acceptedAnswer: { text: 'A.' } });
  });
  it('describes services, articles and news with the company as publisher', () => {
    expect(serviceLd('uk', { title: 'Аудит', excerpt: 'Опис', slug: 'audyt', category: 'Аудит' })).toMatchObject({ '@type': 'Service', url: 'https://bp-audit.com.ua/uk/services/audyt', serviceType: 'Аудит' });
    const ld = serviceLd('uk', { title: 'Надання впевненості', excerpt: 'Опис', slug: 'nv', items: ['Підтвердження для регуляторів: висновки'] });
    expect(ld.areaServed).toEqual([{ '@type': 'City', name: 'Lviv' }, { '@type': 'Country', name: 'Ukraine' }]);
    expect(ld.hasOfferCatalog?.itemListElement).toEqual([{ '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Підтвердження для регуляторів: висновки' } }]);
    expect(serviceLd('uk', { title: 'A', excerpt: 'B', slug: 'a' }).hasOfferCatalog).toBeUndefined();
    const a = articleLd('en', { title: 'T', slug: 's', publishedAt: '2026-01-01' });
    expect(a).toMatchObject({ url: 'https://bp-audit.com.ua/en/blog/s', dateModified: '2026-01-01', image: 'https://bp-audit.com.ua/en/opengraph-image' });
    const n = newsLd('uk', { title: 'N', slug: 'n', date: '2026-02-01', image: 'https://cms/n.jpg' });
    expect(n).toMatchObject({ '@type': 'NewsArticle', image: ['https://cms/n.jpg'], dateModified: '2026-02-01' });
    expect(n.publisher).toEqual({ '@id': 'https://bp-audit.com.ua/#organization' });
  });
  it('organization: no data → nothing; street address → no geo', () => {
    expect(organizationLd('uk', null)).toBeNull();
    expect(organizationLd('uk', { siteName: 'BP', mapQuery: 'вулиця Лемківська, 9а' })!.geo).toBeUndefined();
  });
});

describe('format helpers', () => {
  it('formats dates per language', () => {
    expect(formatDate('2026-03-05', 'uk')).toBe('05.03.2026');
    expect(formatDate(null, 'uk')).toBe('');
  });
  it('counts days to a deadline, nothing for past or empty dates', () => {
    const in10 = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    expect(daysUntil(in10)).toBeGreaterThanOrEqual(9);
    expect(daysUntil('2000-01-01')).toBeNull();
    expect(daysUntil('')).toBeNull();
  });
  it('builds initials for avatar placeholders', () => {
    expect(initials('Олена  Петрівна Коваль')).toBe('ОП');
  });
});
