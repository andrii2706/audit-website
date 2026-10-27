import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Аудит Консультант — Audit Consultant',
    short_name: 'Аудит Консультант',
    description: 'Audit, accounting, Diia.City, grants and legal support for businesses in Ukraine.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F5F7',
    theme_color: '#0B1220',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
