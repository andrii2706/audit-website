/**
 * Short search-result titles (`seo.metaTitle`) for services and articles whose full title is too long for
 * Google (~60 characters). Pages without an entry use their normal title. The web app adds
 * " — Бізнес Партнери" / " — Business Partners" itself when the result still fits in 60 characters.
 * Editors can change these later in Strapi (SEO block of each entry; limit 70 characters).
 */
type Titles = Record<string, string>;

const uk: Titles = {
  'audyt-neprybutkovykh-orhanizatsii': 'Аудит неприбуткових організацій і грантових проєктів',
  'torhova-marka-nerezydenta-podatkovi-ryzyky': 'Торгова марка нерезидента без оплати: податкові ризики',
  'bezoplatni-pakety-ryzyk-pdv': 'Безоплатні пакети покупцям: ризик донарахування ПДВ',
  'optova-torhivlia-pyvom-filiieiu': 'Чи може філія вести оптову торгівлю пивом',
};

const en: Titles = {
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
