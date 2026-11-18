# Виправлення: помилка "Encountered a script tag" на англійській + палітра скидалась після зміни мови

Встановлення: розпакувати в корінь проєкту (папка, де лежить `web/`), дозволити заміну, перезапустити `npm run dev`.

## Що було
Скрипт палітри (`<Script strategy="beforeInteractive">`) стояв у `[locale]/layout.tsx`. При перемиканні мови
цей layout React малює заново вже в браузері, а скрипти, створені в браузері, React не виконує — звідси помилка.
Заодно `<html data-palette>` повертався до стандартної палітри, і вибір B/C скидався.

## Що змінено
- `PaletteSwitcher.tsx`: новий компонент `PaletteBoot`. Скрипт рендериться тільки на сервері (перше завантаження,
  без «мигання» кольорів), у браузері більше не створюється. Після кожного оновлення layout (зміна мови)
  компонент повертає збережену палітру до того, як браузер намалює сторінку.
- `[locale]/layout.tsx` — тільки дві правки. Якщо ви правили layout самі, не замінюйте файл, а зробіть їх вручну:
    1. видалити `import Script from 'next/script';`
       і замінити `import PaletteSwitcher, { paletteBootScript } from ...` на
       `import PaletteSwitcher, { PaletteBoot } from '@/components/concept/PaletteSwitcher';`
    2. рядок
       `{SHOW_SWITCHER && <Script id="palette-boot" strategy="beforeInteractive">{paletteBootScript}</Script>}`
       замінити на
       `{SHOW_SWITCHER && <PaletteBoot />}`
- `e2e/pages.spec.ts`: тест «палітра C лишається після переходу на EN, назад і після перезавантаження,
  без помилки про script». Там же тест стрічки логотипів з минулого разу.

Перевірено на Next.js 16.4.6: typecheck, lint, 195 unit, production build, 95 e2e (комп'ютер + телефон);
у dev-режимі консоль чиста.
