# Automatic Design System Audit

## 1. Задача

После сборки audit автоматически сопоставляет реальные production instances с живым catalogue `/_design-system`. Он проверяет, что повторяющийся UI имеет production identity, нужный variant показан в catalogue, а одинаковые roles не получили section-local drift в typography, geometry, colors, borders или elevation.

Hard scope этого audit ограничен системным ядром: editorial typography, semantic root tokens, native controls, button-like links, явно маркированные shared text/navigation links, icon buttons и components, уже подтвержденные как shared. Обычная локальная ссылка не становится design-system component только из-за наличия `href`. Уникальные section compositions, cards/panels, media treatments, CTA-layout, crop и декор не обязаны иметь design-system identity или catalogue specimen.

Сначала блок должен пройти reference-fidelity QA по `ART_DIRECTION_QA.md`, и только затем этот audit. `passed: true` означает консистентность системного ядра, а не сходство страницы со скриншотами.

Исполняемый primitive: `instructions/primitives/design-system/design-system-audit.js`. Он не требует Playwright и сторонних библиотек.

Используй его через browser evaluation либо скопируй без функциональных изменений в project-owned test/dev tooling. Не импортируй файл напрямую из read-only `instructions/` в production app и не включай audit в пользовательский bundle.

## 2. Runtime contract

Маркер выпускается внутри implementation общего production-компонента, а не вручную его consumer или catalogue:

```html
<button
  data-ds-component="button"
  data-ds-variant="primary"
  data-ds-size="medium"
  data-ds-theme="default"
  data-ds-state="default"
>
```

Не ставь `data-ds-component` на локальную композицию только ради audit. Если внутри нее есть Button, Link, Field или IconButton, marker выпускает именно вложенный production control. `data-ds-exempt` не требуется для обычного section-local card/media/decor, который не входит в hard scope.

Обязательны `component`, `variant` и `size`, даже если два последних равны `default`. `theme` может наследоваться от ближайшего `[data-ds-theme]`. `state` может быть явным либо выводиться из реального disabled/error/loading state.

Для checkbox/radio root хранит базовый `default/error/disabled`, а audit читает фактический `:checked` у `data-ds-part="control"` и формирует `checked`, `checked-error` или `checked-disabled`. Не дублируй native selection в локальном React-state только ради marker.

Для составного компонента identity стоит на root, а внутренние части получают `data-ds-part`:

```html
<label
  data-ds-component="field"
  data-ds-variant="default"
  data-ds-size="medium"
>
  <span data-ds-part="label">Email</span>
  <input data-ds-part="control">
  <span data-ds-part="helper">Required</span>
</label>
```

Editorial text использует существующий production role contract:

```html
<h2 data-type-role="heading-medium">...</h2>
<p data-type-role="body-medium">...</p>
```

Catalogue помечает свой root и token specimens:

```html
<main data-ds-catalogue>...</main>
<div data-ds-token="--color-text">...</div>
<div data-ds-token="--surface-card">...</div>
```

`data-ds-token` документирует только глобальные root semantic tokens. Scoped theme remapping проверяется через computed fingerprints соответствующих component variants, а не через token specimen внутри цветной секции.

Одноразовое исключение допустимо только с причиной:

```html
<div data-ds-exempt="Third-party embedded checkout">...</div>
```

Пустое исключение — ошибка. Непустое попадает в review и должно быть подтверждено в `.site-builder/decisions.md`.

## 3. Ownership guardrail

- `data-ds-component`, `data-ds-variant`, `data-ds-size` и `data-ds-part` объявляются только внутри `design_system.source_root`.
- Production-секция вызывает component API и не передает эти атрибуты вручную.
- `/_design-system` импортирует project-owned `Gallery`, который использует `design_system.entrypoint`. Импорт starter из `instructions/`, frozen starter HTML или копия Gallery/component markup запрещены.
- Catalogue вызывает production API; его локальные styles отвечают только за расположение specimens и не переопределяют component или typography styles.
- Перед финалом найди определения `data-ds-component` в source tree. Любое определение вне production design-system source считается ошибкой ownership.
- Перед финалом проверь import route `/_design-system`: runtime-import из `instructions/reference/design-system-starter/` или обход project-owned entrypoint считается ошибкой ownership.

Runtime audit доказывает общий observable contract и computed result. Он намеренно не заявляет, что строит статический import graph; поэтому ownership-проверка обязательна.

## 4. Запуск

Для каждого проверяемого viewport:

1. Импортируй `DS_CONTRACT` из фактического project-owned `design_system.entrypoint`, а не из starter внутри `instructions/`. Проверь полный mandatory set из `site.config.yaml`: Font families Primary/Secondary, один Icon family/source, Grid Desktop/Tablet/Mobile, Heading S/M/L, Body Regular/Bold S/M/L, Button S/M/L, Radiuses S/M/L, Spacing XS/S/M/L/XL/2XL/3XL с tokens `--ds-space-xs` … `--ds-space-3xl`, `label`, `metadata`. Grid contract обязан содержать `columnsToken`/`marginToken`/`gutterToken` и `maxWidthToken`, объявленные в `tokens.grid`; независимые числовые `columns/margin/gutter` в JS contract запрещены.
2. Открой `/_design-system`, дождись fonts и settled layout и обязательно передай этот contract в catalogue audit:

    ```js
    import { DS_CONTRACT } from '<project-owned design_system.entrypoint>'

    const catalogueReport = await runDesignSystemAudit({
      catalogue: true,
      contract: DS_CONTRACT,
    })
    ```

    Catalogue-запуск без `contract`, с невалидным contract либо с incomplete mandatory set является hard fail до production-сравнения. Contract — источник ожидаемого набора tokens; DOM catalogue не может молча сузить этот набор.
3. Убедись, что для каждого token, объявленного в `DS_CONTRACT.tokens`, catalogue содержит ровно один живой `[data-ds-token="--token-name"]` specimen. Отсутствующий или продублированный specimen — hard fail.
4. Возьми `tokenNames` из проверенного `catalogueReport.tokens`, открой каждую production route на той же ширине и запусти `runDesignSystemAudit({ tokenNames })` с тем же набором selectors.
5. Передай отчеты в `compareDesignSystemAuditReports({ productionReports, catalogueReport })`.
6. Сохрани итог в `.site-builder/design-system-audit.json`.
7. Исправь общий token/component и повтори обе стороны сравнения. Не исправляй drift локальным CSS секции.

В том же JSON сохрани отдельный `gridGeometry` gate. Для каждой production
route и целевой ширины он должен записать resolved active grid tokens и rect
общего container, page grid и overlay. Проверка проходит, только если:

- числовые mode values объявлены один раз в `design_system.layout_source`;
- `Container`, `PageGrid` и `GridOverlay` используют active `--ds-grid-*` aliases;
- container, page grid и overlay совпадают по левому/правому rail и ширине с
  допуском 1 CSS px;
- computed column count и `column-gap` совпадают с active tokens;
- overlay имеет `pointer-events: none`, не меняет production geometry и на
  широком viewport останавливается на том же `max-width`;
- проверены сами breakpoint-ширины, а также по одной ширине непосредственно до
  и после каждого project-specific breakpoint.

`runDesignSystemAudit().passed` проверяет contract/token/component consistency,
но не заменяет `gridGeometry.passed`. Итоговый gate требует оба значения `true`.

Минимум после секций 2, 4, 6 и далее — desktop primary viewport. Перед финалом проверь все production routes на `1440px` и `390px`, либо на project-specific desktop/mobile targets, всегда сравнивая production и catalogue при одинаковой ширине.

## 5. Что считается ошибкой

Hard fail:

- catalogue audit запущен без project-owned `DS_CONTRACT`, contract имеет невалидную структуру либо не содержит полный обязательный foundation/primary contract: Font families Primary/Secondary, Icon family/source, Grid Desktop/Tablet/Mobile, Heading S/M/L, Body Regular/Bold S/M/L, Button S/M/L, Radiuses S/M/L, Spacing XS/S/M/L/XL/2XL/3XL, `label`, `metadata`;
- token, объявленный в `DS_CONTRACT.tokens`, не имеет catalogue specimen либо имеет больше одного `[data-ds-token]` specimen;
- grid contract хранит raw числа вместо token references, grid token отсутствует в `tokens.grid`, не разрешается в положительный unitless column count/length либо catalogue показывает не тот computed value;
- `gridGeometry` отсутствует/не пройден, container/page grid/overlay расходятся более чем на 1 px либо production consumer повторяет grid numbers вместо active aliases;
- видимая native button, form control или визуально button-like link не покрыта production identity;
- явно маркированная shared text/navigation link имеет неполную identity либо отсутствует в catalogue;
- editorial heading/body не имеет production type role;
- identity заполнен частично;
- одинаковый ключ `component + variant + size + theme + state + part` имеет разные invariant computed styles;
- production key отсутствует в catalogue;
- production и catalogue одного ключа расходятся на одинаковом viewport;
- `/_design-system` не рендерит project-owned `Gallery`, импортирует starter напрямую либо содержит catalogue-only component/type styles;
- активный token specimen пуст, содержит placeholder либо разрешается по-разному;
- authored production source содержит структурный `padding*`, `margin*` или `gap` с ненулевым raw length вместо `--ds-space-*`/составного token expression; оптическое либо reference-driven исключение не имеет короткой причины;
- `data-ds-exempt` не содержит причины;
- сам route, шрифты или audit не дошли до settled состояния.

Обычная inline/local link может оставаться локальной и проверяется interaction/accessibility QA. Отсутствие уникальной карточки, локального panel, media frame, collage, CTA-композиции или декоративной формы в catalogue не является ошибкой. Оно становится ошибкой только после осознанного promotion этого элемента в shared component family.

Catalogue-only variant и обоснованное исключение являются review item, а не автоматическим pass. Финальная сдача разрешена только когда `passed === true`, а каждый review item исправлен либо записан как intentional decision.

## 6. Границы сравнения

Audit сравнивает внутренний component contract: typography, foreground/background, padding, min-height, gap, border, radius, shadow и фактически отрендеренные states. Он не должен сравнивать section composition: width, max-width, margin, position, inset, transform и размещение по grid.

Computed audit не различает `24px` и `var(--ds-space-m)`, поэтому перед сохранением финального JSON обязательно выполни отдельный authored-source spacing gate по всем production style sources из `.site-builder/project.yaml` (catalogue-only `gallery.css` не является production layout source). Gate проверяет только структурные `padding*`, `margin*`, `gap`, `row-gap` и `column-gap` на потребление `--ds-space-xs` … `--ds-space-3xl`; `transform`/`translate`, reveal distance, navigation scroll thresholds и parallax speed/amplitude относятся к независимому motion-contract и исключены. Запиши в тот же `.site-builder/design-system-audit.json` объект `spacingSourceAudit` с `passed`, проверенными файлами и обоснованными исключениями. Общий `passed` возможен только когда runtime comparison и `spacingSourceAudit.passed` равны `true`.

Audit также не решает, должен ли визуальный объект быть shared. Такое решение принимается до маркировки: одинаковая семантика, структура и визуальная конструкция должны повториться в разных секциях или экранах. Повтор нескольких карточек внутри одного списка или grid недостаточен.

Vanilla runtime audit не синтезирует надёжно native `:hover` и `:focus-visible`. Они остаются в interaction QA. Disabled, error, loading и другие реально отрендеренные catalogue states сравниваются автоматически.
