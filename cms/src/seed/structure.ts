/**
 * Language-independent structure of the starter content for «Бізнес Партнери» (bp-audit.com.ua):
 * slugs, order, relations and contacts. Texts live in ./content/<locale>.ts (same keys).
 * Source: the client's technical specification (Oct 2026). Nothing here is invented. Requisites missing from the brief
 * (EDRPOU, register number) come from the client's old site — see ./legacy.ts.
 */

export type Block = { type: string; [k: string]: unknown };
const txt = (text: string, bold = false) => ({ type: 'text', text, ...(bold ? { bold: true } : {}) });
export const p = (text: string): Block => ({ type: 'paragraph', children: [txt(text)] });
/** Paragraph that starts with a bold lead-in: pb('Lead:', ' rest') */
export const pb = (lead: string, rest: string): Block => ({ type: 'paragraph', children: [txt(lead, true), txt(rest)] });
export const h2 = (text: string): Block => ({ type: 'heading', level: 2, children: [txt(text)] });
export const h3 = (text: string): Block => ({ type: 'heading', level: 3, children: [txt(text)] });
export const ul = (items: string[]): Block => ({
  type: 'list',
  format: 'unordered',
  children: items.map((text) => ({ type: 'list-item', children: [txt(text)] })),
});

export const categories = [
  { key: 'audit', slug: 'audyt', order: 1 },
  { key: 'consulting', slug: 'konsaltynh', order: 2 },
  { key: 'legal', slug: 'yurydychni-posluhy', order: 3 },
] as const;

export type CategoryKey = (typeof categories)[number]['key'];

/** Services in display order. homeOrder 1 = the big tile, 2–5 small tiles, 6–7 wide tiles. */
export const services: { slug: string; cat: CategoryKey; homeOrder?: number; steps?: boolean }[] = [
  { slug: 'obovyazkovyy-audyt', cat: 'audit', homeOrder: 1, steps: true },
  { slug: 'initsiatyvnyy-audyt', cat: 'audit', homeOrder: 2, steps: true },
  { slug: 'ohliad-promizhnoi-zvitnosti', cat: 'audit', steps: true },
  { slug: 'nadannia-vpevnenosti', cat: 'audit', homeOrder: 3, steps: true },
  { slug: 'audyt-neprybutkovykh-orhanizatsii', cat: 'audit', steps: true },
  { slug: 'due-diligence', cat: 'audit', homeOrder: 4, steps: true },
  { slug: 'perevirka-zvitu-diia-city', cat: 'audit', homeOrder: 5, steps: true },
  { slug: 'perevirka-zvitu-defence-city', cat: 'audit', steps: true },
  { slug: 'taksonomiia-xbrl', cat: 'audit' },
  { slug: 'uzghodzheni-protsedury', cat: 'audit', homeOrder: 6, steps: true },
  { slug: 'podatkove-planuvannia', cat: 'consulting', homeOrder: 7 },
  { slug: 'podatkovyi-konsaltynh', cat: 'consulting' },
  { slug: 'metodolohiia-obliku-msfz', cat: 'consulting' },
  { slug: 'reorhanizatsiia-likvidatsiia', cat: 'consulting' },
  { slug: 'finansova-ekspertyza', cat: 'consulting' },
  { slug: 'legal-due-diligence', cat: 'legal' },
  { slug: 'korporatyvne-pravo', cat: 'legal' },
  { slug: 'sudove-predstavnytstvo', cat: 'legal' },
  { slug: 'dohovirne-pravo-zed', cat: 'legal' },
  { slug: 'suprovid-hrantiv-mtd', cat: 'legal' },
  { slug: 'litsenzuvannia-akredytatsiia', cat: 'legal' },
  { slug: 'finansovyi-monitorynh', cat: 'legal' },
  { slug: 'ekspertni-konsultatsii', cat: 'legal' },
];

/** "Who we help" tabs → related services (same order as content.audiences). */
export const audiences = [
  { order: 1, services: ['obovyazkovyy-audyt', 'ohliad-promizhnoi-zvitnosti', 'taksonomiia-xbrl', 'metodolohiia-obliku-msfz'] },
  { order: 2, services: ['initsiatyvnyy-audyt', 'due-diligence', 'podatkove-planuvannia', 'korporatyvne-pravo'] },
  { order: 3, services: ['audyt-neprybutkovykh-orhanizatsii', 'uzghodzheni-protsedury', 'suprovid-hrantiv-mtd', 'finansovyi-monitorynh'] },
  { order: 4, services: ['perevirka-zvitu-diia-city', 'perevirka-zvitu-defence-city', 'nadannia-vpevnenosti', 'finansova-ekspertyza'] },
];

/** Team members in display order (texts in content.team, same order). Photos: to be provided by the client. */
export const teamCount = 7;

export const articles = [
  { slug: 'reorhanizatsiia-biznesu', readingMinutes: 5 },
  { slug: 'do-uvahy-rezydentiv-diia-city', readingMinutes: 5 },
  { slug: 'shcho-take-defence-city', readingMinutes: 4 },
];

export const quickServices = ['obovyazkovyy-audyt', 'initsiatyvnyy-audyt', 'perevirka-zvitu-diia-city', 'perevirka-zvitu-defence-city', 'due-diligence', 'uzghodzheni-protsedury'];
export const deadlineService = 'perevirka-zvitu-diia-city';

/** Contacts and requisites (not translated). Empty strings = not provided yet. */
export const contacts = {
  phone: '+380673705846',
  phoneSecondary: '+380503173661',
  email: 'businesspartners@ukr.net',
  // From the old site (bp-audit.com.ua → «Про компанію»).
  edrpou: '37741155',
  registryNumber: '4463',
  // Exact office point (same coordinates as mapUrl from the brief).
  mapQuery: '49.8525392,24.02329',
  mapUrl: 'https://www.google.com/maps/@49.8525392,24.02329,17z',
  telegramUrl: '',
  viberUrl: '',
  whatsappUrl: '',
};
