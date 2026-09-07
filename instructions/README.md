# Универсальные инструкции для верстки по референсам

Эта папка — переносимый project-agnostic пакет. Она хранится в проекте рядом с `input/` и не должна содержать решения конкретного сайта.

## Ожидаемая структура

```text
project/
  instructions/
    README.md
    AGENTS.md
    site.config.yaml
    docs/
      PROJECT_IO_CONTRACT.md
      VISUAL_BUILD_GUIDE.md
      DESIGN_SYSTEM_SOURCE.md
      DESIGN_SYSTEM_AUDIT.md
      LAYOUT_AND_GRID.md
      ART_DIRECTION_QA.md
      MOTION_AND_INTERACTIONS.md
    primitives/
      README.md
      foundations/
        font-rendering.css
        typography-audit.js
      design-system/
        design-system-audit.js
      motion/
        motion-smoke-test.js
    reference/
      design-system-starter/
        README.md
        index.html
        src/design-system/
      motion-sandbox/
        README.md
        index.html
        motion.manifest.json
        source/
          src/App.tsx
          src/styles.css
  input/
  .site-builder/          # создается агентом
  src/ public/ ...        # существующий или создаваемый production-проект
```

`input/` может быть плоской папкой. Скриншоты, шрифты, иконки, логотипы, иллюстрации, фотографии и другие материалы разрешено складывать вместе; специальное именование не требуется.

## Как запускать в новом чате

Скопируй папку `instructions/` целиком, включая `reference/` и `primitives/`. Затем достаточно дать агенту папку проекта и написать:

```text
Полностью прочитай instructions/README.md и instructions/AGENTS.md.
Затем проинвентаризируй input/ и собери сайт по всем инструкциям.
Не изменяй instructions/ и input/.
Видимый текст не переписывай. Для каждой секции сначала пройди reference-fidelity gate и сохрани evidence; design-system audit применяй только к typography, общим controls/tokens и доказанным shared components.
```

Вложенный `instructions/AGENTS.md` не всегда загружается автоматически. Если нужен автоматический запуск без этой фразы, создай в корне проекта короткий `AGENTS.md`:

```md
# Project agent entrypoint

Перед любой работой полностью прочитай и выполни `instructions/AGENTS.md`.
Папки `instructions/` и `input/` считаются read-only.
```

## Что делает агент

1. Читает универсальные defaults и I/O-контракт.
2. Рекурсивно изучает репозиторий и весь `input/`.
3. Классифицирует референсы, шрифты и канонические ассеты до вопросов и генерации.
4. Создает project-specific состояние в `.site-builder/`, не меняя универсальные инструкции.
5. До секций копирует `reference/design-system-starter/src/design-system/` в project-owned `src/design-system/`, калибрует эту копию по референсам и использует ее как единственный production source. `/_design-system` импортирует project-owned `Gallery`, который рендерит production exports без дублирования. Уникальные section compositions, cards, media и decor остаются reference-driven, пока не доказано повторение в разных секциях.
6. Подключает общий font-rendering baseline, затем собирает production-интерфейс и grid overlay.
7. Переносит motion-поведение из принятой песочницы, адаптируя к проекту только presentation.
8. Для каждой секции сначала выполняет reference-fidelity QA, затем синхронизирует системное ядро с `/_design-system` и повторно проверяет композицию. После каждых двух секций и перед финалом запускает оба независимых gate.

## Исполняемые defaults

- `primitives/foundations/font-rendering.css` — ранний глобальный baseline против типичного утолщения webfonts относительно Figma. После `document.fonts.ready` его можно проверить через `typography-audit.js`.
- `reference/motion-sandbox/` — утвержденный источник motion-поведения. Его код переносят в production, а не интерпретируют заново по описанию; `motion-smoke-test.js` проверяет результат.
- `reference/design-system-starter/` — единственный code-first bootstrap для foundations, typography, tokens, общей page grid и controls. `Basic` фиксирует font/icon fallback, а `Spacing and Sizes` — Grid, семиступенчатый Spacing XS–3XL (`8 / 16 / 24 / 32 / 48 / 96 / 128 px`) и Radiuses S/M/L; также обязательны Heading/Body/Button S/M/L, Body Bold S/M/L и auxiliary Label/Metadata. Grid values живут только в CSS tokens, а `Container`, `PageGrid`, `GridOverlay`, contract и catalogue ссылаются на них без числовой копии. Отдельного `Interaction Foundations` в design-system catalogue нет: interaction/page-motion contract принадлежит `reference/motion-sandbox/`. Motion transforms, reveal distances и parallax parameters не используют spacing tokens. Предоставленные project fonts/icons заменяют fallback. Его `index.html` запускается локально по командам из вложенного README; в проект целиком копируется только `src/design-system/`, после чего сайт и `/_design-system` используют project-owned exports.
- `primitives/design-system/design-system-audit.js` сопоставляет production и catalogue по runtime identity и computed styles системного ядра; `passed: true` не заменяет визуальную сверку с референсами.

Остальные layout, media и art-direction решения остаются у агента и текущей дизайн-системы. Два QA-артефакта обязательны: `.site-builder/reference-fidelity.md` с evidence по каждой секции и итоговый `.site-builder/design-system-audit.json`. Отсутствие любого из них блокирует приемку. Не создавай только дополнительные manifests и отчеты сверх явно требуемых инструкциями, если они не помогают найти или исправить видимое расхождение.

## Не переносится между проектами

Не добавляй в `instructions/` project-specific production-код, generated assets, `.site-builder/`, названия бренда, конкретные цвета, шрифты, радиусы или размеры компонентов отдельного сайта. Универсальные bootstrap-fallbacks и обязательные названия scales внутри code-first starter не считаются решением конкретного проекта и заменяются после анализа `input/`. Code-first design-system starter, frozen motion sandbox, font-rendering baseline и dependency-free audit primitive — намеренные универсальные исключения.
