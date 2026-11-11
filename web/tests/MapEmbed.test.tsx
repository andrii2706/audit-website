// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MapEmbed from '@/components/MapEmbed';
import type { Global } from '@/lib/strapi';

const labels = { title: 'Як нас знайти', office: 'Офіс', open: 'Відкрити в Google Maps', route: 'Прокласти маршрут', phone: 'Телефон', email: 'Пошта', hours: 'Графік' };
const g = {
  siteName: 'Бізнес Партнери',
  address: 'вулиця Лемківська, 9а, Львів',
  mapQuery: '49.8531048,24.0258748',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=49.85,24.02&query_place_id=ChIJabc123-XYZ&place_id:ChIJabc123-XYZ',
  phone: '+380322424242',
} as Global;

describe('<MapEmbed>', () => {
  it('routes to the office place card (destination_place_id) and embeds the map by coordinates', () => {
    const { container } = render(<MapEmbed locale="uk" global={g} labels={labels} />);
    const route = screen.getByRole('link', { name: new RegExp(labels.route) }).getAttribute('href')!;
    expect(route).toContain('destination=49.8531048%2C24.0258748');
    expect(route).toContain('destination_place_id=ChIJabc123-XYZ');
    expect(screen.getByRole('link', { name: new RegExp(labels.open) }).getAttribute('href')).toBe(g.mapUrl);
    const iframe = container.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toMatch(/^https:\/\/www\.google\.com\/maps\?q=49\.8531048%2C24\.0258748&hl=uk/);
  });
  it('searches by mapPlace when set, and works without a Maps link', () => {
    const { container } = render(<MapEmbed locale="en" global={{ ...g, mapPlace: 'Business Partners Lviv', mapUrl: null }} labels={labels} withInfo={false} />);
    expect(container.querySelector('iframe')!.getAttribute('src')).toContain('q=Business%20Partners%20Lviv&hl=en');
    expect(screen.getByRole('link', { name: new RegExp(labels.route) }).getAttribute('href')).not.toContain('destination_place_id');
    expect(screen.getByRole('link', { name: new RegExp(labels.open) }).getAttribute('href')).toContain('maps/search/?api=1&query=');
  });
  it('opens external map links safely', () => {
    render(<MapEmbed locale="uk" global={g} labels={labels} />);
    for (const a of screen.getAllByRole('link').filter((l) => l.getAttribute('target') === '_blank')) expect(a.getAttribute('rel')).toContain('noopener');
  });
});
