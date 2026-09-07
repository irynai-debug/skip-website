# Code-first design-system starter

Это компактный исполняемый starter системного ядра. Он заменяет создание
типографики и controls «по смыслу» из MD-инструкции.

## Что смотреть при ревью

- `src/design-system/index.jsx` — component API и машинный `DS_CONTRACT`;
- `src/design-system/styles.css` — tokens, typography и component styles;
- `src/design-system/Gallery.jsx` — живой каталог реальных exports;
- `src/design-system/gallery.css` — только layout страницы каталога. Все specimens
  используют один row pattern: marker + name сначала, live style затем, divider между
  строками; на широком экране это две колонки, на узком — тот же порядок в один столбец.
  Каждый верхнеуровневый раздел имеет один конкретный title без eyebrow и intro-текста.
  `Basic` показывает Font families и Icon family. Grid, Spacing scale, control dimensions
  и Radiuses S/M/L собраны внутри `Spacing and Sizes`.

`src/main.jsx`, `index.html` и `package.json` — небольшая Vite-обвязка для
визуального просмотра.

## Как использовать в проекте

1. Скопируй папку `src/design-system/` целиком в project-owned
   `src/design-system/`. Не импортируй runtime-код из `instructions/`.
   Установи импортируемые dependencies через package manager целевого проекта
   либо замени их предоставленным source из `input/`. Для starter fallback нужен
   `@fortawesome/fontawesome-free`.
2. После анализа всех референсов откалибруй project-копию через tokens и
   typography roles в `styles.css`. Primary scales уже зафиксированы: Heading,
   Body и Button имеют `small / medium / large` (S / M / L); каждый Body size
   имеет Regular и Bold; `label` и `metadata` остаются auxiliary roles; Spacing имеет `XS / S / M / L / XL / 2XL / 3XL`
   со значениями по умолчанию `8 / 16 / 24 / 32 / 48 / 96 / 128 px`,
   Radiuses — `S / M / L`. Starter fallback: Primary Inter, Secondary Instrument Sans,
   Icon family Font Awesome. Предоставленные project fonts/icons всегда имеют приоритет.
   Grid values калибруй только в `--ds-grid-desktop-*`, `--ds-grid-tablet-*`,
   `--ds-grid-mobile-*` и `--ds-grid-max-width` внутри `styles.css`.
   `DS_CONTRACT` хранит их token names, не числовую копию.
   Отдельного `Interaction Foundations` в catalogue нет: interaction/page-motion contract
   переносится из `reference/motion-sandbox/`, а focus/transition values остаются внутренней
   реализацией production controls до появления отдельной interaction-system.
   Все production `padding`, `margin` и `gap` выражай через `--ds-space-xs` … `--ds-space-3xl` либо
   составное token-based выражение; не дублируй те же значения raw `px`.
   Motion transforms, reveal distances и parallax parameters остаются независимыми
   `--motion-*`/runtime parameters и не используют spacing tokens.
3. Не удаляй обязательные Heading/Body/Button S/M/L, Body Bold S/M/L, Spacing XS–3XL, Radiuses S/M/L и `label`/`metadata`.
   Удалять из `DS_CONTRACT` и `Gallery` можно только неиспользуемые дополнительные
   project variants/states. Не добавляй новый вариант, если существующий выражает ту же роль.
4. Production-страницы импортируют controls, `Container`, `PageGrid` и
   `GridOverlay` из `src/design-system/index.jsx`. Все routes используют эти
   primitives или их классы; не создавай отдельные page/overlay grid numbers.
   Для development toggle достаточно, например:

   ```jsx
   <GridOverlay visible={new URLSearchParams(location.search).has('grid')} />
   ```
5. Route `/_design-system` рендерит `Gallery` из той же project-копии. Gallery
   не имеет права заново определять стили компонентов.
6. Новый shared component добавляется одновременно в `DS_CONTRACT`, production
   export и Gallery — только после доказанного повторения в разных секциях или
   экранах. Уникальные Card, CTA, media и section layout остаются локальными.
7. Иконки бери из project assets или выбранной проектом библиотеки. У `Button`
   иконка опциональна, а `IconButton` требует явно переданный icon.
8. Inverse-комбинации ограничены `DS_CONTRACT.themes.inverse.specimens`. Если
   проекту нужна новая комбинация, добавь ее туда и одновременно в Gallery.
9. Checkbox/radio selection остается нативным DOM-state; audit различает
   checked/unchecked по самому control, включая error и disabled.

## Локальный просмотр starter

```bash
pnpm install
pnpm run dev
```

Открой URL, который напечатает Vite. Production-проверка: `pnpm run build`.
