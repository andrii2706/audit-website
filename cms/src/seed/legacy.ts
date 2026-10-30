/**
 * Content carried over from the client's previous website (https://bp-audit.com.ua, Joomla, 30 Oct 2026 snapshot).
 * Structure (slugs, files, order) lives here; the texts are copied word for word from the old pages into
 * ./old-site/{uk,en}.ts (also collected in the document «Тексти старого сайту bp-audit.com.ua").
 * Images and PDFs are not stored here: each entry keeps `sourceUrl` (a path on the old site) and
 * `npm run import-media` downloads them into the Strapi media library on a machine with internet access.
 * Where the old site and the 2026 brief disagree, the brief wins (it is newer).
 */
import type { Block, CategoryKey } from './structure';
import uk from './old-site/uk';
import en from './old-site/en';

export const LEGACY_SITE = 'https://bp-audit.com.ua';

/** Services that exist on the old site but not in the brief. Inserted after the last service of their category. */
export const newServices: { slug: string; cat: CategoryKey }[] = [
  { slug: 'audyt-dlia-nktspfr', cat: 'audit' },
  { slug: 'bukhhalterske-obsluhovuvannia', cat: 'consulting' },
  { slug: 'rozrobka-biznes-planiv', cat: 'consulting' },
  { slug: 'kompleksnyi-analiz-diialnosti', cat: 'consulting' },
  { slug: 'biznes-konsaltynh', cat: 'consulting' },
  { slug: 'yurydychnyi-suprovid-biznesu', cat: 'legal' },
];

/** «Публікації» of the old site (all dated 02.10.2018). Their publishedAt is set to that date. */
export const legacyArticles = [
  { slug: 'torhova-marka-nerezydenta-podatkovi-ryzyky', readingMinutes: 4, date: '2018-10-02T09:00:00.000Z' },
  { slug: 'bezoplatni-pakety-ryzyk-pdv', readingMinutes: 4, date: '2018-10-02T09:00:00.000Z' },
  { slug: 'optova-torhivlia-pyvom-filiieiu', readingMinutes: 6, date: '2018-10-02T09:00:00.000Z' },
];

/** Client logos («Нам довіряють»). Names = the logos' alt texts on the old site; check them before launch. */
export const clients: { name: string; sourceUrl: string }[] = [
  { name: 'Galka', sourceUrl: '/images/2019/12/22/galka.jpg' },
  { name: 'Ензим', sourceUrl: '/images/2019/12/23/enzym-logo.jpg' },
  { name: 'Електрон', sourceUrl: '/images/2019/12/23/electron.jpg' },
  { name: 'Електронтранс', sourceUrl: '/images/2019/12/23/electrontrans.jpg' },
  { name: 'Шувар', sourceUrl: '/images/2019/12/23/shuvar.jpg' },
  { name: 'Скарбниця', sourceUrl: '/images/2019/12/23/skarbnytsa.jpg' },
  { name: 'Дністер', sourceUrl: '/images/2019/12/23/logo-dnister.jpg' },
  { name: 'Екскомбуд', sourceUrl: '/images/2019/12/23/logo-exkombud.jpg' },
  { name: 'Козятинхліб', sourceUrl: '/images/2019/12/23/hlib.jpg' },
  { name: 'LPP', sourceUrl: '/images/2019/12/23/logo-lpp.jpg' },
  { name: 'LPK', sourceUrl: '/images/2019/12/23/lpk.jpg' },
  { name: 'Rik Auto', sourceUrl: '/images/2019/12/23/rik-auto.jpg' },
  { name: 'Дрогобич хліб', sourceUrl: '/images/2019/12/23/logo-drogobych.jpg' },
  { name: 'Ikadan', sourceUrl: '/images/2018/10/02/logo-ikadan.jpg' },
  { name: 'J&L', sourceUrl: '/images/2018/10/02/jl-logo.jpg' },
  { name: 'Джерело', sourceUrl: '/images/2018/10/02/djerelo.jpg' },
];

/** Scans from «Про компанію» (certificates) and «Рекомендації» (letters). Titles per locale below. */
export const documents: { key: string; kind: 'certificate' | 'recommendation'; sourceUrl: string }[] = [
  { key: 'registry', kind: 'certificate', sourceUrl: '/images/2018/10/04/5.jpg' },
  { key: 'qualityOrder', kind: 'certificate', sourceUrl: '/images/2023/02/20/nakaz03022023.jpg' },
  { key: 'insurance', kind: 'certificate', sourceUrl: '/images/2023/11/28/sert-11-23.jpg' },
  { key: 'minfin', kind: 'certificate', sourceUrl: '/images/2022/01/18/list-minfin.jpg' },
  { key: 'diplomaTsupryk', kind: 'certificate', sourceUrl: '/images/2019/12/22/dyplom-tsupryk.jpg' },
  { key: 'diplomaShevchuk', kind: 'certificate', sourceUrl: '/images/2019/12/22/dyplom-shevchuk.jpg' },
  { key: 'certTsupryk1', kind: 'certificate', sourceUrl: '/images/2018/10/04/svcn1.jpg' },
  { key: 'certTsupryk2', kind: 'certificate', sourceUrl: '/images/2018/10/04/4.jpg' },
  { key: 'certTsupryk3', kind: 'certificate', sourceUrl: '/images/2018/10/04/sert4.jpg' },
  { key: 'certStelmakh1', kind: 'certificate', sourceUrl: '/images/2018/10/04/sertif1.jpg' },
  { key: 'certStelmakh2', kind: 'certificate', sourceUrl: '/images/2018/10/04/svsv1.jpg' },
  { key: 'certSoloviy1', kind: 'certificate', sourceUrl: '/images/2018/10/04/sert-solov.jpg' },
  { key: 'certSoloviy2', kind: 'certificate', sourceUrl: '/images/2018/10/04/svsm1.jpg' },
  { key: 'certHubar', kind: 'certificate', sourceUrl: '/images/2018/10/04/1.jpg' },
  { key: 'certShyhanov', kind: 'certificate', sourceUrl: '/images/2020/05/10/sertificat-shiganov.jpg' },
  { key: 'recZherelo', kind: 'recommendation', sourceUrl: '/images/2018/10/08/zerelo.jpg' },
  { key: 'recGlynyany', kind: 'recommendation', sourceUrl: '/images/2018/10/08/glinyany.jpg' },
  { key: 'recKua', kind: 'recommendation', sourceUrl: '/images/2018/10/08/kua.jpg' },
  { key: 'recJl', kind: 'recommendation', sourceUrl: '/images/2018/10/08/j-l.jpg' },
  { key: 'recIkadan', kind: 'recommendation', sourceUrl: '/images/2018/10/08/ikadan.jpg' },
];

/**
 * «Звіти» of the old site, in its order. Only the 2025 report has a known file path; the others are
 * created without a file (the page shows «Файл ще не завантажено») — upload the PDFs in Strapi.
 */
export const reports: { key: string; year: number; isCorrection: boolean; docType: 'report' | 'balance'; publishedOn?: string; sourceUrl?: string }[] = [
  { key: 'r2025', year: 2025, isCorrection: false, docType: 'report', publishedOn: '2026-04-30', sourceUrl: '/doc/zvit-prozorist-2025.pdf' },
  { key: 'r2024c', year: 2024, isCorrection: true, docType: 'report', publishedOn: '2026-04-14' },
  { key: 'r2024', year: 2024, isCorrection: false, docType: 'report', publishedOn: '2025-04-30' },
  { key: 'b2024', year: 2024, isCorrection: false, docType: 'balance', publishedOn: '2025-04-30' },
  { key: 'r2023c', year: 2023, isCorrection: true, docType: 'report', publishedOn: '2026-04-14' },
  { key: 'r2023', year: 2023, isCorrection: false, docType: 'report', publishedOn: '2024-04-18' },
  { key: 'b2023', year: 2023, isCorrection: false, docType: 'balance', publishedOn: '2024-04-18' },
  { key: 'r2022', year: 2022, isCorrection: false, docType: 'report', publishedOn: '2023-04-30' },
  { key: 'b2022', year: 2022, isCorrection: false, docType: 'balance', publishedOn: '2023-04-30' },
  { key: 'r2021', year: 2021, isCorrection: false, docType: 'report' },
  { key: 'r2020c', year: 2020, isCorrection: true, docType: 'report' },
  { key: 'r2020', year: 2020, isCorrection: false, docType: 'report' },
  { key: 'r2019c', year: 2019, isCorrection: true, docType: 'report' },
  { key: 'r2019', year: 2019, isCorrection: false, docType: 'report' },
];

/** Auditor register numbers from «Ключові співробітники», by team order (structure.teamCount). */
export const teamRegistry: (string | null)[] = ['102031', '102032', null, '102128', '101761', null, null];

type Item = { title: string; text: string };
export type LegacyContent = {
  address: string;
  serviceExtras: Record<string, Block[]>;
  newServices: Record<string, { title: string; excerpt: string; badge?: string; body: Block[] }>;
  articles: Record<string, { title: string; kind: string; excerpt: string; content: Block[] }>;
  clientsTitle: string;
  documents: Record<string, string>;
  reports: Record<string, string>;
  registryLabel: (n: string) => string;
  kovalBio: string;
  homeReason: Item;
  /** «Про компанію» and «Ми готові допомогти» blocks of the old home page, appended to the About page intro. */
  introExtra: Block[];
  about: {
    requisitesTitle: string;
    requisites: Block[];
    policyTitle: string;
    policy: Block[];
    documentsTitle: string;
    recommendationsTitle: string;
  };
};

export const LEGACY: Record<'uk' | 'en', LegacyContent> = { uk, en };
