import type { Core } from '@strapi/strapi';

/**
 * Two news TEMPLATES created as DRAFTS (never published automatically), so editors see how a news item
 * is structured. They contain instructions, not invented company facts. Created once: if editors delete
 * them, they don't come back (a flag is kept in the Strapi core store).
 */

type Sample = { title: string; tag: string; excerpt: string; h: string; body: string[] };
type Lang = 'uk' | 'en' | 'pl' | 'fr' | 'de' | 'es';

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
      pl: {
        title: '[Szablon] Aktualność firmy', tag: 'Aktualności firmy',
        excerpt: 'Krótki opis w 1–2 zdaniach: co się wydarzyło i dlaczego to ważne dla klientów. Widoczny na liście aktualności i w wyszukiwarce.',
        h: 'Jak wypełnić tę aktualność',
        body: ['Zastąp tytuł, krótki opis i ten tekst. Data ustala kolejność; „Przypięte” utrzymuje wpis na górze.', 'Przetłumacz wpis za pomocą przełącznika języka w prawym górnym rogu i kliknij „Opublikuj” — pojawi się na stronie w kilka sekund.'],
      },
      fr: {
        title: '[Modèle] Actualité de l’entreprise', tag: 'Actualités',
        excerpt: 'Un résumé en 1–2 phrases : ce qui s’est passé et pourquoi c’est important pour les clients. Affiché dans la liste et dans les résultats de recherche.',
        h: 'Comment remplir cette actualité',
        body: ['Remplacez le titre, le résumé et ce texte. La date fixe l’ordre dans le fil ; « Épinglé » garde l’actualité en haut.', 'Traduisez-la via le sélecteur de langue en haut à droite puis cliquez sur « Publier » : elle apparaît sur le site en quelques secondes.'],
      },
      de: {
        title: '[Vorlage] Unternehmensnachricht', tag: 'Unternehmensnews',
        excerpt: 'Eine Zusammenfassung in 1–2 Sätzen: was passiert ist und warum es für Kunden wichtig ist. Erscheint in der Liste und in Suchergebnissen.',
        h: 'So füllen Sie diese Nachricht aus',
        body: ['Ersetzen Sie Titel, Zusammenfassung und diesen Text. Das Datum bestimmt die Reihenfolge; „Angeheftet“ hält die Meldung oben.', 'Übersetzen Sie sie über den Sprachumschalter oben rechts und klicken Sie auf „Veröffentlichen“ – sie erscheint in wenigen Sekunden auf der Website.'],
      },
      es: {
        title: '[Plantilla] Noticia de la empresa', tag: 'Noticias',
        excerpt: 'Un resumen de 1–2 frases: qué ha pasado y por qué importa a los clientes. Se muestra en la lista de noticias y en los buscadores.',
        h: 'Cómo completar esta noticia',
        body: ['Sustituya el título, el resumen y este texto. La fecha define el orden; «Fijada» mantiene la noticia arriba.', 'Tradúzcala con el selector de idioma arriba a la derecha y pulse «Publicar»: aparecerá en el sitio en segundos.'],
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
      pl: {
        title: '[Szablon] Zmiany w przepisach: co oznaczają dla firm', tag: 'Przepisy',
        excerpt: 'Format wiadomości regulacyjnych: co się zmieniło, kogo dotyczy, od kiedy obowiązuje i co powinni zrobić klienci.',
        h: 'Struktura wiadomości regulacyjnej',
        body: ['1) Co się zmieniło — z linkiem do oficjalnego dokumentu. 2) Kogo dotyczy. 3) Od kiedy obowiązuje. 4) Co zrobić teraz — i jak możemy pomóc.', 'Na końcu dodaj zachętę do kontaktu: formularz wysyła zgłoszenie do panelu i na e-mail firmy.'],
      },
      fr: {
        title: '[Modèle] Évolution réglementaire : ce que cela change pour l’entreprise', tag: 'Réglementation',
        excerpt: 'Un format pour l’actualité réglementaire : ce qui change, qui est concerné, à partir de quand, et que faire.',
        h: 'Structure d’une actualité réglementaire',
        body: ['1) Ce qui change — avec le lien vers le texte officiel. 2) Qui est concerné. 3) Date d’entrée en vigueur. 4) Que faire maintenant — et comment nous pouvons aider.', 'Terminez par un appel à l’action : le formulaire envoie la demande dans l’administration et par e-mail à l’entreprise.'],
      },
      de: {
        title: '[Vorlage] Gesetzesänderung: Was sie für Unternehmen bedeutet', tag: 'Regulierung',
        excerpt: 'Ein Format für regulatorische News: was sich ändert, wen es betrifft, ab wann es gilt und was Kunden tun sollten.',
        h: 'Aufbau einer regulatorischen Meldung',
        body: ['1) Was sich ändert – mit Link zum offiziellen Dokument. 2) Wen es betrifft. 3) Ab wann es gilt. 4) Was jetzt zu tun ist – und wie wir helfen.', 'Zum Schluss ein Aufruf zur Anfrage: Das Formular sendet sie ins Admin-Panel und per E-Mail an das Unternehmen.'],
      },
      es: {
        title: '[Plantilla] Cambio normativo: qué significa para las empresas', tag: 'Normativa',
        excerpt: 'Un formato para noticias normativas: qué cambia, a quién afecta, desde cuándo y qué deben hacer los clientes.',
        h: 'Estructura de una noticia normativa',
        body: ['1) Qué cambia — con enlace al documento oficial. 2) A quién afecta. 3) Fecha de entrada en vigor. 4) Qué hacer ahora — y cómo podemos ayudar.', 'Termine con una llamada a la acción: el formulario envía la solicitud al panel y al correo de la empresa.'],
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
