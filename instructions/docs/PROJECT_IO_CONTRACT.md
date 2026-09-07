# Project I/O Contract

## 1. Папки и владение

Ожидаемая модель — `instructions/` и `input/` рядом в корне проекта.

- `instructions/` содержит универсальные правила и defaults.
- `input/` содержит пользовательские исходники.
- Обе папки read-only во время сборки сайта.
- `.site-builder/` содержит project-specific конфигурацию, inventory, очередь, допущения и QA-состояние.
- Production-код и ассеты хранятся в принятых стеком `src/`, `public/` или эквивалентных папках.

Не создавай второй вложенный проект, если текущий корень уже содержит рабочее приложение.

## 2. Инвентаризация до вопросов

Рекурсивно просмотри весь `input/` и классифицируй файлы по фактическому содержимому, а не только по имени:

| Класс | Примеры | Действие |
|---|---|---|
| Reference screenshot | страница, секция, mobile/desktop variant | добавить в очередь и определить canvas/порядок |
| Font | `ttf`, `otf`, `woff`, variable font | определить family/weight/style и использовать локально |
| Canonical UI/brand | logo, icon set, SVG sprite | переиспользовать; не регенерировать |
| Authored visual | illustration, texture, background scene | переиспользовать; не перерисовывать приблизительно |
| Canonical photo | отдельный исходный raster | переиспользовать с осмысленным crop |
| Screenshot-only photo | фото видно только внутри reference | создать отдельный визуально близкий 2× asset |
| Content/supporting file | copy, notes, data | использовать как контент или контекст |
| Unknown | роль неясна | включить один вопрос в onboarding-пакет |

Плоская структура допустима. Подпапки помогают, но не являются обязательными. Числовой префикс определяет порядок, если он есть; иначе порядок выводится из содержания и фиксируется как допущение.

Сохрани inventory в `.site-builder/`, не в `input/` и не в этом документе.

## 3. Приоритет ассетов

1. Явное решение пользователя.
2. Предоставленный канонический файл из `input/`.
3. Существующий production-asset проекта.
4. Отдельно созданный asset для изображения, присутствующего только в скриншоте.
5. Обратимое provisional-решение агента.

Не вырезай UI, текст или фотографии из скриншота для финального интерфейса. Не заменяй предоставленный logo, icon set или authored-иллюстрацию приблизительной CSS/Canvas/SVG-перерисовкой.

## 4. Выходные файлы

- Generated media сохраняй в production asset folder проекта, например `public/assets/generated/`, а не в `input/`.
- Временные captures, diff и генерационные черновики держи вне production assets и удаляй после QA.
- Не изменяй существующий стек и пользовательский код без необходимости.
- Не добавляй крупную зависимость, CMS или внешний сервис только ради удобства реализации.
- Не записывай brand, fonts, colors, радиусы, тексты или маршруты конкретного проекта в `instructions/`.

## 5. Project-specific состояние

Создай минимум:

```text
.site-builder/
  project.yaml       # настройки, включая design_system source_root/entrypoint/tokens/typography/layout sources
  inputs.md          # краткий inventory и классификация
  sections.json      # порядок и статус референсов
  decisions.md       # только неочевидные допущения и intentional deviations
  reference-fidelity.md # per-section reference/capture, расхождения и итоговый status
  design-system-audit.json # последний production ↔ catalogue audit report
```

Если проект уже использует эквивалентное состояние, продолжай его вместо создания параллельной системы.

В `project.yaml` обязательно запиши один production `design_system.layout_source`
и project-specific breakpoints сетки. `tokens_source` и `layout_source` могут
указывать на один `styles.css`; отдельный файл создавать не требуется. Там же
зафиксируй consumers общей геометрии: container, page grid и grid overlay.

## 6. Gate перед реализацией

До первого production-блока должны быть определены или явно помечены provisional:

- порядок страниц и секций;
- intended CSS viewport и DPR референсов;
- доступные шрифты, icon source и canonical assets;
- grid и responsive targets;
- политика фото и authored graphics;
- точный copy policy;
- motion scope и acceptance checks.

После этого задай один общий пакет только по неизвестным решениям, которые действительно меняют результат.
