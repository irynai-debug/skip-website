# Исполняемые универсальные defaults

В этой облегченной версии пакета исполняемыми остаются три небольших, независимых defaults.

## Font rendering

- Скопируй declarations из `foundations/font-rendering.css` в самый ранний production-owned global CSS layer.
- Не импортируй файл прямо из `instructions/`.
- После `await document.fonts.ready` можно запустить `runTypographyAudit()` из `foundations/typography-audit.js`.
- `-webkit-font-smoothing` и `-moz-osx-font-smoothing` действуют только в поддерживающих браузерах и в основном решают типичную разницу на macOS. Неподдерживаемая property не является причиной менять системный `font-weight`.
- `font-synthesis: none` не позволяет браузеру искусственно утолщать отсутствующий face.

## Motion

- Визуальный источник истины: `../reference/motion-sandbox/index.html`.
- Исходники поведения: `../reference/motion-sandbox/source/src/App.tsx` и `styles.css`.
- Production получает механический port в собственный код; тема, цвета, радиусы и layout берутся из текущей дизайн-системы.
- После переноса запусти `runMotionSmokeTest()` из `motion/motion-smoke-test.js`.

## Design-system audit

- Полностью прочитай `../docs/DESIGN_SYSTEM_AUDIT.md`.
- `design-system/design-system-audit.js` не требует зависимостей. Используй его через browser evaluation либо project-owned test/dev copy; не импортируй read-only primitive в production bundle.
- Запусти `runDesignSystemAudit()` отдельно на production routes и `/_design-system` при одинаковой ширине, затем передай reports в `compareDesignSystemAuditReports()`.
- Сохрани итог в `.site-builder/design-system-audit.json`; `passed: false` блокирует приемку.
- Runtime audit проверяет markers и observable computed result, но не заявляет статическую проверку import graph.

Layout, media composition и art-direction проверяются непосредственно по референсам и browser captures. Этот пакет не требует отдельных schema-heavy manifests для каждого элемента.
