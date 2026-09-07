# Accepted motion reference sandbox

Это frozen reference принятой реализации WorldProject. Визуально оставлены три production-блока: hero, mission и statistics; grid inspector намеренно удален, потому что sandbox оценивает только motion. Вместе они показывают утвержденные:

- hero opening sequence;
- line-mask heading reveal;
- одну grouped copy/block animation на секцию;
- photo-card и large-media parallax;
- sticky hero cover;
- легкий Hero graphics cover-parallax, при котором двигаются только arc/dots/main media;
- `hero → dormant/hidden → compact → hero` navigation;
- label-swap и underline microinteractions;
- reduced-motion и mobile fallbacks.

Открой `index.html` через локальный сервер. Читаемый исходник лежит в `source/src/App.tsx` и `source/src/styles.css`. `motion.manifest.json` описывает selectors этого fixture и может быть передан в `runMotionSmokeTest()`.

## Правило переноса

Это behavioral source of truth, а не визуальная тема нового сайта. При сборке другого проекта:

1. Сначала перенеси без переинтерпретации `useMotionEffects`, `MotionHeading`, state machine `Header` и соответствующие motion CSS rules.
2. Сохрани selectors/classes, timings, easing, delays, ordering, thresholds, обычный inner-layer parallax и отдельный Hero graphics parallax algorithm.
3. Затем адаптируй только React/DOM integration и project presentation: copy, assets, colors, typography, component geometry и responsive layout.
4. Не заменяй этот код новой реализацией «по смыслу». Если стек не React, порт должен повторять те же states и computed behavior и пройти smoke-test.

Намеренные reliability-поправки относительно ранней принятой версии:

- initial state включается классом `motion-ready` без transitions; после page load первый `requestAnimationFrame` добавляет `motion-animate`, а следующий подключает observer. Поэтому normal scroll и reload внутри секции используют один полный heading reveal;
- hero eyebrow, main musician/media, round CTA и `40+` stat гарантированно проходят opening sequence, а не перескакивают сразу в final state;
- во время sticky-cover только `[data-motion-hero-graphic]` получает общий `translateY` по формуле `clamp(0px, (scrollY - anchorY) × 0.04, 24px)`; `anchorY` берется из стабильного `[data-motion-hero-parallax-anchor]`, а background/content/controls остаются статичны;
- main compact navigation сохраняет `backdrop-filter: blur(40px)`, а `backdrop-filter` не анимируется;
- grid inspector не рендерится в motion-only sandbox.

Surface, radius, width и density остаются project tokens.

## Состав source

Внутри `HomePage` намеренно оставлены ровно:

```tsx
<Header />
<Hero />
<Mission />
<Statistics />
```

Остальной source сохранен из принятого проекта, чтобы функции и CSS не превратились в новую сокращенную интерпретацию. Не «упрощай» fixture перед переносом. Обязательно сохрани staged startup `motion-ready → motion-animate → is-inview`: он является частью accepted behavior. Отфильтруй project presentation только после того, как exact behavior работает в production.
