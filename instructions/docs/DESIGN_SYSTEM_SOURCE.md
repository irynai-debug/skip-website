# Production Design System Source

## 1. Главный принцип

Дизайн-система существует в production-коде, а не внутри showcase-страницы. Универсальный read-only bootstrap находится в `instructions/reference/design-system-starter/src/design-system/`; его открываемый preview — `instructions/reference/design-system-starter/index.html`.

До первого блока скопируй starter целиком в project-owned `src/design-system/`. После копирования источником истины становится только project-owned код. Production-страницы импортируют его публичный entrypoint, а `/_design-system` — его `Gallery`; runtime-import из `instructions/` запрещен.

Запрещено создавать две реализации: одну для сайта и отдельную похожую для catalogue. Изменение общего token или component должно одновременно обновлять всех production consumers и его пример на `/_design-system`.

Дизайн-система здесь — guardrail системного ядра, а не генератор внешнего вида всех секций.

- **Hard system scope:** типографические роли; semantic content/state tokens; `Button`, `Field`, `TextLink`/navigation link и `IconButton`; подтвержденные shared components.
- **Reference-driven scope:** section layout, уникальные Card/Panel, CTA-композиции, media frame/crop, collage, декоративные формы, фоновые сцены и локальные поверхности. Эти решения по умолчанию остаются рядом с секцией и воспроизводят референс.

Вложенный системный control внутри уникальной композиции все равно берется из design system. Но сама композиция не должна упрощаться или нормализоваться ради catalogue.

## 2. Copy-once bootstrap

Единственный нормативный bootstrap:

```text
instructions/reference/design-system-starter/
  index.html                    # read-only preview для ревью
  src/design-system/            # копируется целиком один раз
    index.jsx                    # component API и DS_CONTRACT
    styles.css                  # tokens, typography, component styles
    Gallery.jsx                 # живой каталог production exports
    gallery.css                 # только layout каталога
```

Скопируй `src/design-system/` в project-owned `src/design-system/` без выборочного переписывания. Затем откалибруй tokens и roles в project-копии по всем референсам, удали неиспользуемые contract options и добавляй новые только по правилам reuse ниже. Не изменяй starter и не импортируй его напрямую.

Сразу после копирования проверь imports project-копии и установи недостающие declared dependencies через package manager проекта либо замени dependency каноническим source из `input/`. Starter использует `@fortawesome/fontawesome-free` как universal fallback; наличие его имени в contract не означает, что пакет уже установлен в новом проекте. Первый production build обязан пройти до начала секций.

Если в проекте уже есть подтвержденная production design system, не перезаписывай ее: сохрани существующий entrypoint и перенеси в него минимальный contract starter без создания параллельной системы. В любом стеке должны сохраниться:

- один production source root;
- один публичный entrypoint;
- одна реализация каждой роли и component family;
- общий импорт для production и catalogue.

Запиши фактические пути `design_system.source_root`, `design_system.entrypoint`, `design_system.tokens_source`, `design_system.typography_source` и `design_system.layout_source` в `.site-builder/project.yaml`.

Минимальная project-specific запись:

```yaml
design_system:
  source_root: src/design-system
  entrypoint: src/design-system/index.jsx
  gallery_source: src/design-system/Gallery.jsx
  tokens_source: src/design-system/styles.css
  typography_source: src/design-system/styles.css
  layout_source: src/design-system/styles.css
```

Пути адаптируй к стеку; ключи оставляй однозначными. Это навигация к production source, а не второй registry значений.

## 3. Что откалибровать до первого блока

После анализа всех референсов откалибруй только реально нужные foundations в project-копии:

- grid foundation: единственные числовые Desktop/Tablet/Mobile values и max-width живут как CSS custom properties в `layout_source`; `DS_CONTRACT` регистрирует только их token names, а catalogue разрешает значения через computed styles. Production `Container`, `PageGrid` и `GridOverlay` импортируются из project-owned entrypoint и читают активные `--ds-grid-columns`, `--ds-grid-margin`, `--ds-grid-gutter`, `--ds-grid-max-width`. Независимая числовая копия в JS, page CSS или overlay не считается единым source;
- typography roles;
- content colors: text, muted text, action, on-action, border, focus;
- surfaces: canvas, field, inverse и другие доказанные роли; card/panel surfaces и radii добавляй только после их promotion по cross-section reuse;
- отдельные section-background tokens без искусственного лимита количества;
- spacing, control heights и component paddings;
- обязательную шкалу Radiuses `small / medium / large`; semantic aliases вроде control radius ссылаются на один из этих steps, а card/panel silhouette остается локальным до promotion;
- border, elevation и motion tokens.

Primary scales уже заданы кодом: Heading `small / medium / large`, Body `small / medium / large` в Regular и Bold, Button `small / medium / large` и Radiuses `small / medium / large`; в catalogue они подписаны как S / M / L. Для жирного body-текста используй отдельные роли `body-small-bold`, `body-medium-bold`, `body-large-bold`, а не локальный `font-weight` поверх regular-роли. Spacing использует семь обязательных шагов `XS / S / M / L / XL / 2XL / 3XL`, значения по умолчанию `8 / 16 / 24 / 32 / 48 / 96 / 128 px` и tokens `--ds-space-xs` … `--ds-space-3xl`. Medium — основной вариант UI. Калибруй значения по проекту, но не переименовывай и не удаляй primary steps без устойчивого доказательства.

Spacing scale является исполняемым source, а не только specimen в catalogue. Внутренние paddings и gaps shared components, а также структурные section `padding`/`margin`/`gap`, используют `--ds-space-xs` … `--ds-space-3xl` или составное выражение на их основе. Raw ненулевые spacing literals запрещены: если нужен устойчивый component-specific alias, он должен разрешаться обратно в primary spacing tokens. Grid page margins/gutters остаются отдельными `--ds-grid-*` foundations и не подменяются spacing alias только из-за совпавшего числа. Motion distances, `transform`/`translate`, scroll thresholds и parallax speed/amplitude остаются независимыми `--motion-*` либо runtime parameters и не alias-ятся на spacing tokens.

Шрифты и иконки разрешай в порядке `input/` → существующий project source → universal fallback → вопрос, только если fallback не подходит референсам. Starter fallback: Primary Inter, Secondary Instrument Sans и Font Awesome. Фактический project choice записывается в project-owned contract; provided font/icon assets всегда имеют приоритет.

Значение становится token, когда оно повторяется либо выражает устойчивую роль. Не превращай каждое число или цвет одного screenshot в foundation. Section-local размеры, crop, offset, radius или surface могут оставаться локальными, когда они определяют уникальный силуэт конкретного референса.

## 4. Production component families

Начальный API и разрешенные options определяет `DS_CONTRACT` в project-owned `index.jsx`. Primary Heading S/M/L, Body Regular/Bold S/M/L, Button S/M/L и auxiliary `label`/`metadata` обязательны и не удаляются; удалять можно только неиспользуемые дополнительные project variants/states вместе с их specimens. Не создавай второй Markdown-registry variants, sizes или states. Базовые controls из hard scope можно использовать сразу. Любой новый visual component добавляй одновременно в `DS_CONTRACT`, production export и `Gallery` только после доказанного cross-section повторения.

Card/Panel family добавляй только если та же семантика, структура и визуальная конструкция повторились в двух отдельных секциях или экранах.

Несколько одинаковых карточек в одном списке, grid или carousel являются экземплярами одной локальной композиции, но сами по себе не доказывают reusable family для всего проекта. Не выноси их в design system до cross-section подтверждения.

Одинаковая роль использует один component. Generated screenshots могут случайно показывать близкие, но разные размеры; это не повод создавать section-specific button или input.

Секция может управлять placement, width, composition и semantic theme modifier. Она не переопределяет внутренние height, padding, font, radius, border, hover или focus общего component. Это ограничение относится только к подтвержденному shared component; уникальная локальная карточка или media-composition может иметь собственные reference-driven geometry, surface и radius.

Для каждой созданной family зафиксируй production API в самом коде. На `/_design-system` выведи матрицу именно этих exports и только подтвержденные shared components. Уникальные section-local compositions в catalogue не переносятся.

## 5. Colors и section themes

- Контентные цвета имеют небольшой semantic набор и переиспользуются.
- Цветные секции не входят в лимит контентной палитры: создавай столько обоснованных `section-*` roles, сколько требуют референсы.
- Component variants получают цвета через semantic tokens, а не через raw hex внутри секции.
- Theme context использует только комбинации, разрешенные в `DS_CONTRACT.themes`; новая inverse-комбинация одновременно добавляется в contract и `Gallery`.
- Default, hover, active, focus, disabled и error используют общие semantic state tokens; одинаковое состояние не перекрашивается вручную в каждом блоке.
- Hover/focus не должен уменьшать контраст; при необходимости используй системную инверсию.
- Одинаковый смысл состояния не меняет accent произвольно между секциями.

## 6. Catalogue contract

Route `/_design-system`:

- импортирует project-owned `Gallery`, который в свою очередь использует project-owned публичный entrypoint;
- через него показывает настоящие production components со всеми используемыми variants и states;
- показывает ровно все публичные color, typography, spacing и geometry tokens, объявленные в `DS_CONTRACT`; внутренние implementation variables компонентов не обязаны становиться отдельными specimens;
- называет каждый верхнеуровневый раздел одним конкретным названием, совпадающим с navigation label; catalogue section не получает eyebrow, маркетинговый headline или intro-описание; `Basic` содержит Font families и Icon family/source, а Grid, spacing scale, control dimensions и Radiuses S/M/L объединяются как подразделы `Spacing and Sizes`; отдельный `Interaction Foundations` не создается, поскольку interaction/page-motion contract принадлежит `reference/motion-sandbox/` и `MOTION_AND_INTERACTIONS.md`, а технические focus/transition values controls могут оставаться внутренними implementation details;
- оформляет все specimens единым catalogue-only row pattern: group title + короткая axis/scale-подпись, когда она применима, затем divider rows. На широком viewport marker и canonical name стоят слева, живой production specimen — справа; на узком строка складывается в том же порядке. Внутренние серые cards/panels для разных families не создаются, кроме случая, когда сама поверхность является документируемым specimen;
- может иметь собственный responsive layout, spacing, dividers и metadata styles только для расположения и подписи образцов;
- не переопределяет catalogue-only правилами внутренние `font-size`, padding, radius, color, hover, focus или field/button styles живого production specimen.

Route не импортирует starter из `instructions/`, не обслуживает frozen `index.html` starter и не копирует `Gallery` markup. Starter preview показывает только универсальный baseline; актуальный project catalogue всегда строится из project-owned exports.

Пример, подписанный `Primary button`, но сверстанный отдельной ссылкой или локальным CSS, не считается документацией design system.

## 7. Reuse gate

Нормативный automatic gate описан в `instructions/docs/DESIGN_SYSTEM_AUDIT.md`. После каждых двух блоков и перед финалом:

1. Запусти `runDesignSystemAudit()` на production routes и `/_design-system` при одинаковом viewport.
2. Сопоставь reports через `compareDesignSystemAuditReports()`.
3. Найди unmarked controls, отсутствующие catalogue variants, token problems и computed-style drift.
4. Повторяющееся решение перенеси в token/component; случайный override удали.
5. Повтори audit и сохрани итог в `.site-builder/design-system-audit.json`.

Pass невозможен при `passed: false`, даже если catalogue визуально выглядит консистентно. Обоснованные exceptions и catalogue-only variants должны быть явно review-нуты.

Audit запускается после отдельной композиционной сверки по `ART_DIRECTION_QA.md`. Его `passed: true` доказывает только консистентность системного ядра и не заменяет reference-fidelity pass.
