# AGENTS.md

## Назначение и границы

Собери по материалам из `input/` адаптивный, поддерживаемый production-интерфейс с общей сеткой, токенами и переиспользуемыми компонентами.

- Корень проекта — родитель папки `instructions/`.
- `instructions/` и `input/` считаются read-only: не переименовывай, не перемещай, не оптимизируй и не перезаписывай их содержимое.
- Production-код, generated assets и служебное состояние сохраняй вне этих папок.
- Следуй системным инструкциям Codex и применимым skills; этот файл их дополняет.

## Обязательный старт

До изменения кода полностью прочитай в таком порядке:

1. `instructions/site.config.yaml`;
2. `instructions/docs/PROJECT_IO_CONTRACT.md`;
3. `instructions/docs/VISUAL_BUILD_GUIDE.md`.

Затем:

1. Изучи существующий репозиторий, стек, команды, маршруты, компоненты, токены и production-ассеты.
2. Рекурсивно проинвентаризируй весь `input/` по правилам I/O-контракта.
3. Создай project-specific конфигурацию и журнал решений в `.site-builder/`. Не записывай подтвержденные значения обратно в `instructions/site.config.yaml`.
4. Только после этого задай один общий пакет действительно важных вопросов. Не спрашивай то, что можно определить из файлов.

## Прогрессивное чтение

- Перед foundations, сеткой и первым production-блоком полностью прочитай `instructions/docs/LAYOUT_AND_GRID.md`.
- Перед созданием tokens, typography и UI components полностью прочитай `instructions/docs/DESIGN_SYSTEM_SOURCE.md`, открой `instructions/reference/design-system-starter/index.html` и изучи `instructions/reference/design-system-starter/src/design-system/`.
- Перед добавлением component markers и первым integration check полностью прочитай `instructions/docs/DESIGN_SYSTEM_AUDIT.md` и исполняемый `instructions/primitives/design-system/design-system-audit.js`.
- Перед static lead-designer сверкой полностью прочитай `instructions/docs/ART_DIRECTION_QA.md`.
- До типографической калибровки перенеси declarations из `instructions/primitives/foundations/font-rendering.css` в самый ранний production-owned global layer. Не импортируй CSS прямо из `instructions/`.
- Перед реализацией движения полностью прочитай `instructions/docs/MOTION_AND_INTERACTIONS.md`, открой `instructions/reference/motion-sandbox/index.html` и прочитай его `source/src/App.tsx` и `source/src/styles.css`.
- После изменения общего токена, компонента, ассета или motion-паттерна повторно проверь все затронутые блоки.

## Рабочий порядок

- Обрабатывай пронумерованные референсы по порядку. Если нумерации нет, выведи порядок из визуальной непрерывности и зафиксируй допущение.
- Воспроизводи весь читаемый видимый copy дословно, включая регистр и порядок. Не переписывай headings, eyebrow, labels или body ради более удобной композиции; нечитаемый важный текст вынеси в общий пакет вопросов.
- До первого блока откалибруй grid CSS tokens в одном project-owned `layout_source`. Production `Container`, `PageGrid`, grid overlay и будущие routes используют готовые primitives starter и их активные aliases; `DS_CONTRACT` хранит только имена Desktop/Tablet/Mobile tokens, а `Spacing and Sizes` разрешает и показывает эти же values. Числовая копия сетки в JS, page CSS или overlay запрещена.
- Перед каждым блоком составь карту колонок, rails, композиционных якорей, намеренного воздуха и responsive-перестроения.
- После анализа всех референсов и до первого блока один раз скопируй `instructions/reference/design-system-starter/src/design-system/` целиком в project-owned `src/design-system/`. Калибруй и расширяй только project-копию; она становится источником истины для типографики, общих controls, content/state tokens и только доказанного shared UI. Уникальная композиция секции остается reference-driven.
- После копирования установи через package manager проекта недостающие dependencies, которые импортирует project-owned design-system source, либо замени их каноническими assets из `input/`; выполни production build до начала секций. В частности, Font Awesome в starter является fallback dependency, а не гарантированно установленной частью нового проекта.
- Верстай блоки по циклу: static desktop → reference-fidelity QA с сохраненным evidence → grid check → design-system sync → повторная reference-fidelity QA → responsive → motion → technical QA.
- Не подгоняй утвержденный системный heading, button или другой component под случайный размер на одном сгенерированном скриншоте.
- После каждого второго блока проверяй собранную страницу целиком.
- Исправляй общую причину в token/component прежде, чем добавлять локальный override.
- Button, Field, Link/navigation link и IconButton реализуй в production design-system source. Card/Panel выноси туда только после совпадающего использования в двух отдельных секциях или экранах; ряд одинаковых карточек внутри одной секции не доказывает глобальный component family. Уникальные cards, media treatments, CTA-композиции и декор следуют референсу локально и не обязаны появляться в `/_design-system`.
- Не объявляй работу завершенной без browser-проверки целевых и промежуточных ширин, клавиатуры, reduced motion, консоли, ассетов и production build.
- Дождись `document.fonts.ready` до финальной визуальной сверки. Не компенсируй неправильный font face, synthetic bold или отсутствующий smoothing случайным локальным `font-weight`.

## Обязательный reference-fidelity gate

- Для каждой секции сними реализацию на CSS-ширине референса после загрузки fonts/assets и в settled motion-state.
- Сравни side-by-side, а при необходимости overlay: точный copy, силуэт и высоту блока, крупные оси, цветовые массы, положение и размер media, crop/focal point, воздух, overlap, surfaces и decor.
- Сохрани краткое evidence по каждой секции в `.site-builder/reference-fidelity.md`: reference, capture, найденные расхождения, исправление и итоговый статус.
- Статус `pass/approved` запрещен при переписанном видимом тексте, другом крупном layout, неверном media placement/crop или отсутствующем сравнении. Grid correctness и `design-system-audit.passed: true` не перекрывают такой failure.
- Только после этого применяй либо проверяй системное ядро. После design-system sync повтори тот же capture, чтобы общий component не изменил силуэт секции.

## Обязательный design-system gate

Этот gate защищает системное ядро, но не является проверкой сходства с референсом. `passed: true` не разрешает принять блок с неверным силуэтом, расположением media, crop, воздухом или декором; такой блок сначала возвращается в reference-fidelity QA.

- Единственный bootstrap-источник — `instructions/reference/design-system-starter/src/design-system/`. Скопируй его без переосмысления в project-owned `src/design-system/`, затем адаптируй project-копию к референсам. Никогда не импортируй runtime-код из `instructions/`. Запиши `design_system.source_root`, `design_system.entrypoint` и `design_system.tokens_source` в `.site-builder/project.yaml`.
- До верстки секций определи используемые semantic tokens для content colors, section surfaces, borders, focus, control geometry, radii и states. Обязательную семиступенчатую шкалу Spacing `XS / S / M / L / XL / 2XL / 3XL` со значениями по умолчанию `8 / 16 / 24 / 32 / 48 / 96 / 128 px` и Radiuses `S / M / L` сохрани целиком; project-specific значения не записывай обратно в `instructions/`. Запиши `design_system.layout_source` и фактические grid breakpoints в `.site-builder/project.yaml`; `layout_source` может совпадать с `tokens_source`.
- В production CSS все структурные `padding*`, `margin*`, `gap`, `row-gap` и `column-gap` выражай через `--ds-space-xs` … `--ds-space-3xl` либо через `calc()`/`clamp()` на их основе. Ненулевой raw `px` для такого отступа является ошибкой. Исключение 1–4 px допустимо только как подписанная оптическая поправка; уникальный reference-driven overlap/offset фиксируй как локальное решение, а не как новый spacing step.
- Motion distances, reveal transforms, navigation scroll thresholds и parallax speed/amplitude остаются независимыми `--motion-*` либо runtime parameters принятого motion-contract. Они не потребляют и не alias-ят `--ds-space-*`, даже когда числовое значение совпадает со spacing step.
- Реализуй production families для `Button`, `Field`, `TextLink`/navigation link и `IconButton`. Card/Panel становится shared только при повторении той же семантики, структуры и визуальной конструкции в разных секциях или экранах.
- Все production-секции импортируют components и tokens через один design-system entrypoint. Секция может задавать placement, width и semantic theme modifier, но не дублировать внутренние font, height, padding, radius, border, hover, focus или disabled styles общего component.
- `/_design-system` импортирует project-owned `Gallery`, который рендерит exports того же project-owned entrypoint во всех реально используемых variants и states. Route не импортирует starter из `instructions/` и не копирует markup или component styles. Catalogue-only копия кнопки, поля, ссылки, цвета, типографического specimen или уже promoted shared card запрещена; локальную карточку в catalogue не добавляй.
- Каждый верхнеуровневый раздел catalogue начинается с одного конкретного названия, совпадающего с пунктом навигации: `Basic`, `Colors`, `Spacing and Sizes`, `Typography`, `Button`, `Forms` и т. п. Не добавляй над ним eyebrow, маркетинговый headline или поясняющий intro-абзац. `Basic` показывает реальные Font families и единый Icon family/source. Grid, Spacing scale, control dimensions и Radiuses S/M/L показывай подразделами внутри `Spacing and Sizes`. Не создавай в catalogue отдельный `Interaction Foundations`: interaction/page-motion contract переносится из `instructions/reference/motion-sandbox/` по `MOTION_AND_INTERACTIONS.md`; технические focus/transition values общих controls могут оставаться внутренней реализацией компонентов.
- Все catalogue specimens используют один presentation-pattern из project-owned `Gallery`: заголовок группы и, когда применимо, короткая шкала/ось, затем прозрачные строки с divider. На широком viewport слева стоят marker и canonical name, справа — живой token/component; на узком строка складывается в том же порядке. Не заменяй отдельные группы серыми panel/card-плашками, если сама поверхность не является документируемым specimen.
- Component implementation сам выпускает `data-ds-component`, `data-ds-variant`, `data-ds-size` и при необходимости `data-ds-part`; consumers и catalogue не подделывают эти markers вручную. `data-type-role` остается обязательным для editorial typography.
- После каждых двух блоков и перед финалом запусти automatic audit по `instructions/docs/DESIGN_SYSTEM_AUDIT.md`: собери production и catalogue reports на одинаковом viewport, сравни их через `compareDesignSystemAuditReports()` и сохрани итог в `.site-builder/design-system-audit.json`.
- Catalogue audit обязательно получает `DS_CONTRACT` из project-owned entrypoint. Отсутствующий или неполный contract, а также не ровно один live specimen для любого contract token являются hard fail.
- Не объявляй работу завершенной при `passed: false`. Исправляй общий token/component; случайный override системного ядра перенеси в систему либо удали. Не переноси в систему reference-driven геометрию только ради прохождения audit. Обоснованные review items запиши в `.site-builder/decisions.md`.

### Типографические роли

- Настрой типографические tokens и roles в `styles.css` project-owned копии starter либо в одном эквивалентном production-модуле, экспортируемом тем же entrypoint. Запиши фактический путь как `design_system.typography_source` в `.site-builder/project.yaml`.
- До верстки секций сопоставь повторяющийся текст с фиксированными primary scales: `heading-small`, `heading-medium`, `heading-large`; `body-small`, `body-medium`, `body-large` и их обязательные `*-bold` варианты; Button sizes `small`, `medium`, `large`. `label` и `metadata` остаются auxiliary roles. Medium — основной вариант; Small и Large используй только по доказанной иерархии референсов.
- Откалибруй и сохрани в contract/catalogue восемь базовых type roles и три Body Bold variants, даже если конкретная страница использует не каждую: три Heading, три Body Regular, три Body Bold, `label`, `metadata`. Для каждой задай family, size, weight, line-height и letter-spacing, включая responsive-значения. Не удаляй primary S/M/L, Body Bold и auxiliary roles; удалять можно только дополнительные проектные варианты.
- Для жирного body-текста используй соответствующую роль `body-small-bold`, `body-medium-bold` или `body-large-bold`; не создавай section-local `font-weight` поверх regular-роли.
- Каждый editorial heading и текст на production-странице обязан потреблять существующую роль. Не определяй полный набор `font-size / weight / line-height / letter-spacing` через селектор конкретной секции вроде `.mission h2` или `.statistics p`.
- Hero, крупный CTA и другая действительно отдельная иерархия могут использовать `heading-large`, но не новый случайный размер для каждой секции. Основной заголовок секции использует `heading-medium`, основной текст — `body-medium`; разницу длины строки сначала решай через span, `max-width` и осмысленный перенос.
- Страница дизайн-системы обязана рендерить те же production role classes/components и tokens, что используются на сайте. Запрещена отдельная копия стилей вроде `.type-specimens h1`, которая только выглядит как дизайн-система.
- Production-секции и `/_design-system` импортируют один `typography_source`; сам route дизайн-системы не содержит собственных `font-size`, `line-height`, `font-weight` или `letter-spacing` для specimens.
- После каждых двух блоков и перед финалом сравни computed typography на одном viewport: два элемента одной роли должны иметь одинаковые family, size, weight, line-height и letter-spacing. Новый local override либо переносится в общую роль/variant, либо удаляется.
- Типографическая система не считается созданной, если образцы есть только на `/_design-system`, а production-секции продолжают иметь независимые размеры.

## Ассеты и зависимости

- Предоставленный в `input/` канонический asset имеет приоритет над генерацией.
- Фото, существующее только внутри скриншота, по умолчанию создавай отдельным 2× asset; не вырезай его из скриншота.
- Не регенерируй и не перерисовывай приблизительно логотипы, иконки и authored-иллюстрации.
- Для шрифтов и иконок соблюдай порядок: `input/` → существующий project source → universal fallback из `site.config.yaml` → один общий вопрос, только если fallback не подходит референсам.
- Не подключай CMS, сторонние сервисы или крупные зависимости без явной необходимости.

## Границы базового motion

По умолчанию используй только три entrance/scroll-семьи из motion-гайда: reveal заголовка, сгруппированный slide-reveal supporting-контента и внутренний media parallax. Поведение механически переноси из frozen motion sandbox и проверь через `runMotionSmokeTest()`; shape, surface и geometry компонентов наследуются из дизайн-системы текущего проекта.

Если неоднозначность обратима, зафиксируй допущение и продолжай. Останавливайся только при настоящем блокере.
