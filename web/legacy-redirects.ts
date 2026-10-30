/**
 * Permanent (308) redirects from the URLs of the client's previous Joomla site (bp-audit.com.ua) to the new
 * pages, so search results, bookmarks and links from other sites keep working after the switch.
 * Next runs these before proxy.ts, so locale detection doesn't interfere. Not used by the static Pages demo.
 */
type Redirect = { source: string; destination: string; permanent: true };

const pages: [string, string][] = [
  ['/about', '/about'],
  ['/polityka-iakosti', '/about#policy'],
  ['/service/audyt', '/services#audyt'],
  ['/service/audyt-zvitu-pro-vidpovidnist-rezydenta-diia-siti', '/services/perevirka-zvitu-diia-city'],
  ['/service/yurydychni-posluhy', '/services/yurydychnyi-suprovid-biznesu'],
  ['/service/bukhhalterske-obsluhovuvannia', '/services/bukhhalterske-obsluhovuvannia'],
  ['/service/pytannia-opodatkuvannia', '/services/podatkovyi-konsaltynh'],
  ['/service/konsaltynh', '/services/biznes-konsaltynh'],
  ['/service/rozrobka-biznes-planiv', '/services/rozrobka-biznes-planiv'],
  ['/service/kompleksnyi-analiz-diialnosti', '/services/kompleksnyi-analiz-diialnosti'],
  ['/service/oboviazkovyi-audyt-dlia-nktspfr', '/services/audyt-dlia-nktspfr'],
  ['/service', '/services'],
  ['/zvity/zvit-pro-prozorist', '/reports'],
  ['/zvity', '/reports'],
  ['/rekomendatsii', '/about#recommendations'],
  ['/news/123-ryzyky-podatkovykh-donarakhuvan', '/blog/torhova-marka-nerezydenta-podatkovi-ryzyky'],
  ['/news/121-ryzyk-donarakhuvannia-pdv', '/blog/bezoplatni-pakety-ryzyk-pdv'],
  ['/news/122-zdiisnennia-optovoi-torhivli-pyvom', '/blog/optova-torhivlia-pyvom-filiieiu'],
  ['/news', '/blog'],
  ['/contact-us', '/contacts'],
];

/** `/en/about` and `/en/news` are real pages on the new site, so their English variants are not redirected. */
const sameOnNewSite = new Set(['/about', '/news']);

export const legacyRedirects: Redirect[] = [
  ...pages.map(([from, to]) => ({ source: from, destination: `/uk${to}`, permanent: true as const })),
  ...pages
    .filter(([from]) => !sameOnNewSite.has(from))
    .map(([from, to]) => ({ source: `/en${from}`, destination: `/en${to}`, permanent: true as const })),
  // Joomla entry points and the old PDF folder.
  { source: '/index.php', destination: '/uk', permanent: true },
  { source: '/index.php/:path*', destination: '/uk', permanent: true },
  { source: '/doc/:file*', destination: '/uk/reports', permanent: true },
];
