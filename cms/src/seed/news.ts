import type { Core } from '@strapi/strapi';

/**
 * Two news TEMPLATES created as DRAFTS (never published automatically), so editors see how a news item
 * is structured. They contain instructions, not invented company facts. Created once: if editors delete
 * them, they don't come back (a flag is kept in the Strapi core store).
 */

type Sample = { title: string; tag: string; excerpt: string; h: string; body: string[] };
type Lang = 'uk' | 'en';

const SAMPLES: { slug: string; pinned: boolean; t: Record<Lang, Sample> }[] = [
  {
    slug: 'shablon-novyny-kompanii',
    pinned: true,
    t: {
      uk: {
        title: '[Шаблон] Новина компанії', tag: 'Новини компанії',
        excerpt: 'Короткий опис у 1–2 реченнях: що сталося і чому це важливо для клієнтів. Показується в списку новин і в пошуку.',
        h: 'Як заповнити цю новину',
        body: ['Замініть заголовок, короткий опис і цей текст. Дата визначає порядок у стрічці; «Закріпити» піднімає новину нагору.', 'Перекладіть новину іншими мовами через перемикач локалі вгорі праворуч і натисніть «Опублікувати» — вона з’явиться на сайті за кілька секунд.'],
      },
      en: {
        title: '[Template] Company news', tag: 'Company news',
        excerpt: 'A 1–2 sentence summary: what happened and why it matters to clients. Shown in the news list and in search results.',
        h: 'How to fill in this news item',
        body: ['Replace the title, the summary and this text. The date sets the order in the feed; “Pinned” keeps the item on top.', 'Translate it with the locale switcher at the top right and click “Publish” — it appears on the site within seconds.'],
      },
    },
  },
  {
    slug: 'shablon-zminy-v-zakonodavstvi',
    pinned: false,
    t: {
      uk: {
        title: '[Шаблон] Зміни в законодавстві: що це означає для бізнесу', tag: 'Законодавство',
        excerpt: 'Формат для регуляторних новин: що змінилося, кого стосується, з якої дати і що зробити клієнтам.',
        h: 'Структура регуляторної новини',
        body: ['1) Що змінилося — з посиланням на офіційний документ. 2) Кого це стосується. 3) З якої дати діє. 4) Що робити зараз — і як ми можемо допомогти.', 'Наприкінці додайте заклик залишити заявку: форма на сайті надсилає її і в адмінку, і на пошту компанії.'],
      },
      en: {
        title: '[Template] Regulatory change: what it means for business', tag: 'Regulation',
        excerpt: 'A format for regulatory news: what changed, who is affected, from what date, and what clients should do.',
        h: 'Structure of a regulatory update',
        body: ['1) What changed — link the official document. 2) Who is affected. 3) Effective date. 4) What to do now — and how we can help.', 'Finish with a call to action: the site form sends requests both to the admin panel and to the company’s e-mail.'],
      },
    },
  },
];

const para = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] });
const heading = (text: string) => ({ type: 'heading', level: 2, children: [{ type: 'text', text }] });

export async function ensureNewsSamples(strapi: Core.Strapi, locales: readonly { code: string }[]) {
  const store = strapi.store({ type: 'core', name: 'seed' });
  if (await store.get({ key: 'newsSamples' })) return;
  if ((await strapi.db.query('api::news-item.news-item').count()) > 0) {
    await store.set({ key: 'newsSamples', value: true });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const s of SAMPLES) {
    let documentId = '';
    for (const { code } of locales) {
      const tr = s.t[code as Lang];
      if (!tr) continue;
      const payload: any = { title: tr.title, slug: s.slug, tag: tr.tag, excerpt: tr.excerpt, date: today, pinned: s.pinned, content: [heading(tr.h), ...tr.body.map(para)] };
      // No status → saved as a draft only.
      const d = documentId
        ? await strapi.documents('api::news-item.news-item').update({ documentId, locale: code, data: payload })
        : await strapi.documents('api::news-item.news-item').create({ locale: code, data: payload });
      if (d) documentId = d.documentId;
    }
  }
  await store.set({ key: 'newsSamples', value: true });
  strapi.log.info('[seed] News templates added as drafts (Content Manager → Новина).');
}
