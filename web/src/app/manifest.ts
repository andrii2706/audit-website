import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ТОВ АКФ «Бізнес Партнери»',
    short_name: 'Бізнес Партнери',
    description: 'Аудит, консалтинг, юридичні та податкові послуги для бізнесу. Львів, з 2011 року.',
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
