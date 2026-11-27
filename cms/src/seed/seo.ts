/**
 * Short search-result titles (`seo.metaTitle`) for services and articles whose full title is too long for
 * Google (~60 characters). Pages without an entry use their normal title. The web app adds
 * " — Бізнес Партнери" / " — Business Partners" itself when the result still fits in 60 characters.
 * Editors can change these later in Strapi (SEO block of each entry; limit 70 characters).
 */
type Titles = Record<string, string>;

const uk: Titles = {
  // Audit services: the words people search for (service + city), client request 27.11.2026.
  'obovyazkovyy-audyt': 'Обов’язковий аудит фінансової звітності у Львові',
  'initsiatyvnyy-audyt': 'Ініціативний аудит фінансової звітності у Львові',
  'perevirka-zvitu-diia-city': 'Аудит звіту резидента Дія Сіті',
  'perevirka-zvitu-defence-city': 'Аудит звіту резидента Дефенс Сіті',
  'nadannia-vpevnenosti': 'Надання впевненості: Дія Сіті, Дефенс Сіті, регулятори',
  'due-diligence': 'Фінансовий і податковий Due Diligence',
  'peredprodazhnyi-audyt': 'Передпродажний аудит компанії (Due Diligence)',
  'pidhotovka-do-e-audytu': 'Підготовка до е-аудиту SAF-T UA',
  'uzghodzheni-protsedury': 'Узгоджені аудиторські процедури',
  'ohliad-promizhnoi-zvitnosti': 'Огляд проміжної фінансової звітності',
  'audyt-neprybutkovykh-orhanizatsii': 'Аудит неприбуткових організацій і грантових проєктів',
  'torhova-marka-nerezydenta-podatkovi-ryzyky': 'Торгова марка нерезидента без оплати: податкові ризики',
  'bezoplatni-pakety-ryzyk-pdv': 'Безоплатні пакети покупцям: ризик донарахування ПДВ',
  'optova-torhivlia-pyvom-filiieiu': 'Чи може філія вести оптову торгівлю пивом',
};

const en: Titles = {
  'obovyazkovyy-audyt': 'Statutory audit of financial statements in Lviv',
  'initsiatyvnyy-audyt': 'Voluntary audit of financial statements in Lviv',
  'perevirka-zvitu-diia-city': 'Audit of a Diia City resident’s report',
  'perevirka-zvitu-defence-city': 'Audit of a Defence City resident’s report',
  'nadannia-vpevnenosti': 'Assurance: Diia City, Defence City, regulators',
  'due-diligence': 'Financial and tax due diligence',
  'peredprodazhnyi-audyt': 'Pre-sale audit of a company (due diligence)',
  'pidhotovka-do-e-audytu': 'Preparing for e-audit (SAF-T UA)',
  'uzghodzheni-protsedury': 'Agreed-upon audit procedures',
  'ohliad-promizhnoi-zvitnosti': 'Review of interim financial statements',
  'audyt-dlia-nktspfr': 'Statutory audit for the NSSMC',
  'audyt-neprybutkovykh-orhanizatsii': 'Audit of non-profits and grant project reports',
  'do-uvahy-rezydentiv-diia-city': 'Diia City compliance report and its audit',
  'reorhanizatsiia-biznesu': 'Reorganising a business: what to know in advance',
  'torhova-marka-nerezydenta-podatkovi-ryzyky': 'Free use of a non-resident’s trademark: tax risks',
  'bezoplatni-pakety-ryzyk-pdv': 'Free shopping bags for customers: VAT risk',
  'optova-torhivlia-pyvom-filiieiu': 'Can a branch do wholesale trade in beer?',
};

const TITLES: Record<string, Titles> = { uk, en };

/** `seo` component value for a service/article, or null when the normal title is short enough. */
export function seoFor(locale: string, slug: string) {
  const metaTitle = TITLES[locale]?.[slug];
  return metaTitle ? { metaTitle } : null;
}
