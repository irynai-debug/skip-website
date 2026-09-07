# Motion and Interactions: accepted default

## 1. Источник истины

Этот документ не является спецификацией для новой интерпретации motion. Универсальный default уже реализован и визуально принят:

- standalone: `instructions/reference/motion-sandbox/index.html`;
- runtime/markup: `instructions/reference/motion-sandbox/source/src/App.tsx`;
- styles: `instructions/reference/motion-sandbox/source/src/styles.css`;
- transfer notes: `instructions/reference/motion-sandbox/README.md`;
- executable audit: `instructions/primitives/motion/motion-smoke-test.js`.

Песочница содержит настоящие hero, Mission и Statistics из принятой реализации. Не заменяй их абстрактным demo меньшей высоты: section geometry влияет на observer timing, sticky cover, navigation boundary и parallax travel.

Приоритет: прямое решение пользователя/дизайнера или отдельный утвержденный motion-reference → frozen sandbox → правила текущей дизайн-системы для presentation. Если принят другой motion-reference, зафиксируй это в `.site-builder/project.yaml`. Иначе обязателен exact port sandbox.

## 2. Обязательный порядок переноса

До реализации:

1. Скопируй `instructions/templates/motion.example.json` в `.site-builder/motion.json`.
2. Открой standalone sandbox в реальном браузере и просмотри opening, вход обеих content-секций, parallax, уход/возврат navigation и reduced motion.
3. Полностью прочитай `source/src/App.tsx` и `source/src/styles.css`.
4. Перенеси `useMotionEffects`, `MotionHeading`, `Header` state machine и связанные CSS rules механически в production-owned код.
5. Только после exact port адаптируй presentation к текущему проекту.
6. Сравни production и sandbox side-by-side на одинаковом viewport.
7. Запусти `runMotionSmokeTest()` и сохрани полный report в `.site-builder/qa/motion.json`.

Production не импортирует source прямо из `instructions/`. React-код копируется в production-owned слой; для другого framework допустим механический adapter с теми же DOM classes, states и computed behavior.

Наличие похожего класса или атрибута без работающего runtime не считается реализацией. `[data-motion-parallax]` без реально меняющегося transform внутреннего image layer — failure.

## 3. Что можно адаптировать

- copy, accessible labels и destinations;
- изображения, alt, logo и icons;
- font families;
- palette и semantic color roles;
- component surface, radius, width, spacing и density;
- responsive layout вокруг motion wrappers;
- navigation boundary `#festivals` можно заменить одним стабильным `[data-nav-content-start]`;
- integration с router/framework.

Форма compact navigation наследуется из проекта. Pill, белая surface, border, shadow и конкретная ширина sandbox не являются универсальными требованиями. Постоянный `blur(40px)` является универсальным default.

## 4. Что нельзя менять без явного решения

- timings, easing, delays и line stagger;
- line-mask DOM и clip/transform states;
- hero sequence order;
- section-level observer settings;
- `hero | dormant | hidden | compact` navigation states и thresholds;
- sticky hero cover behavior;
- media-parallax и hero-graphics-parallax formulas, clamps, transform order и layer structure;
- mobile/reduced-motion fallbacks;
- групповой trigger `copy`/`block`;
- значение compact navigation blur и запрет его анимирования.

Не добавляй GSAP, spring, lerp, scroll smoothing или вторую motion-систему поверх accepted runtime.

## 5. Accepted tokens

Сохраняй значения из source:

```css
--interaction-fast: 150ms;
--interaction-normal: 300ms;
--interaction-ease: cubic-bezier(.23, 1, .32, 1);
--interaction-ease-soft: cubic-bezier(.165, .84, .44, 1);
--motion-reveal-ease: cubic-bezier(.215, .61, .355, 1);
--motion-slide-ease: cubic-bezier(.215, .61, .355, 1);
```

- Heading and supporting slide duration: `900ms`.
- Line stagger: `150ms`.
- `copy` delay: `100ms`.
- `block` delay: `160ms`.
- Color interactions: `150ms`.
- Label/underline interactions: `300ms`.

Эти числа — behavioral contract, не theme tokens для произвольной замены. Менять их можно только после отдельной калибровки и явного решения дизайнера.

Motion geometry также не является layout-spacing. Reveal distances, `transform`/`translate`, navigation scroll thresholds и parallax speed/amplitude сохраняются как независимые `--motion-*`, data attributes либо runtime parameters из accepted source. Не заменяй их на `--ds-space-*` и не выводи из spacing scale, даже если конкретное значение совпадает с `8 / 16 / 24 / 32 / 48 / 96 / 128 px`.

## 6. Section reveal contract

Один `IntersectionObserver` следит за `[data-motion-section]`:

```js
{ rootMargin: '0px 0px -12% 0px', threshold: 0.04 }
```

Startup состоит из трех отдельных states:

1. `.motion-ready` задает hidden/translated start-state, но еще не включает motion transitions. Это предотвращает обратную анимацию из видимого DOM в hidden state.
2. После page load первый `requestAnimationFrame` добавляет `.motion-animate` и включает transitions без изменения геометрии или opacity.
3. Следующий `requestAnimationFrame` подключает observer; только после этого видимая секция получает `.is-inview`.

Это обязательная часть contract, а не необязательная оптимизация. Без нее reload внутри секции может проиграть только clip-path без accepted vertical movement, а hero eyebrow/media/stat могут сразу оказаться в final state.

При первом входе секция получает `.is-inview` и сразу `unobserve`. Не наблюдай каждый heading, paragraph, button, card или list item отдельно.

### Heading

Используй `MotionHeading` из accepted source без перестройки DOM:

```html
<h2 data-motion-heading aria-label="Complete accessible heading">
  <span class="motion-heading__visual" aria-hidden="true">
    <span class="motion-heading__line">
      <span class="motion-heading__line-inner" style="--line-index: 0">Visual line</span>
    </span>
  </span>
</h2>
```

- строки задаются осмысленно заранее;
- outer line является mask;
- движется только inner line;
- initial transform `translate3d(0,100%,0)` и accepted clip-path;
- settled geometry точно совпадает со static layout;
- accessible heading остается одним заголовком, visual split скрыт от accessibility tree.

Не двигай сам `h1/h2`, не используй auto-splitter без эквивалентного DOM и не добавляй scale, blur или rotate.

### Supporting groups

Внутри одной секции допустимы semantic groups:

```html
<div data-motion-slide="copy">...</div>
<div data-motion-slide="block">...</div>
```

Обе группы запускаются тем же `.is-inview`; различаются только accepted delay `100ms`/`160ms`. Абзацы внутри copy, карточки внутри block и вложенные CTA не получают собственных observers или stagger.

Это предотвращает эффект, когда элементы приезжают по одному при дальнейшем скролле. Для длинного списка default — один `block`, а не последовательность item reveals.

## 7. Hero opening sequence

Hero сохраняет `[data-motion-section][data-motion-hero]` и входит через тот же staged section observer. На первой загрузке он уже пересекает viewport и запускается один раз после зафиксированного initial paint. Не делай отдельный timeout для всей hero-секции; timeout `1450ms` относится только к снятию header intro class.

Accepted timeline после `.motion-ready.is-inview`:

| Element | Delay | Duration |
|---|---:|---:|
| Arc | 80ms | 700ms |
| Main musician/media | 120ms | 700ms |
| Dots | 220ms | 700ms |
| Eyebrow | 300ms | 900ms |
| Heading line 1 | 360ms | 900ms |
| Heading line 2 | 510ms | 900ms |
| Heading line 3 | 660ms | 900ms |
| Round CTA + stat | 650ms | 800ms |
| Header intro | 760ms | 600ms |

Фоновая scene видна сразу. В opening sequence arc, dots и main musician/media используют opacity-only: не добавляй им entrance translate/scale/rotate. Отдельное scroll-движение этих слоев начинается только после initial state и описано ниже. Не трансформируй hero background.

Для fullscreen/near-fullscreen hero сохраняй accepted cover mode: `.site-main > .hero` sticky, следующая непрозрачная content section проходит поверх. Это stacking/layout behavior, а не zoom или transform background. Если структура проекта не допускает cover mode, запиши причину в manifest.

### Hero graphics cover-parallax

При sticky-cover только декоративная графика и primary hero media слегка движутся вместе со скроллом. Это отдельный contract от обычного media parallax:

- root: `[data-motion-hero-parallax]`;
- flow anchor: zero-size `[data-motion-hero-parallax-anchor]` immediately before Hero; unlike a sticky element, its document Y remains stable;
- moving layers: только `[data-motion-hero-graphic]` — в accepted fixture это arc, dots и main musician/media;
- static layers: hero background, heading, eyebrow/copy, CTA, stat, navigation и layout wrappers;
- одна общая CSS variable `--hero-graphics-y` для всех moving layers;
- formula: `clamp(0px, (scrollY - anchorY) × 0.04, 24px)`, where `anchorY = anchor.getBoundingClientRect().top + scrollY`;
- down-scroll увеличивает положительный `translateY`, up-scroll уменьшает его; состояние всегда выводится из абсолютного `scrollY`;
- нет transition на transform, smoothing, lerp, spring или отдельного scroll listener;
- existing rotate/X-offset компонуются с Y: `translate3d(...) rotate(...)`, а не перезаписываются;
- эффект отключен при `max-width: 640px` и `prefers-reduced-motion: reduce`.

Не помечай весь `.hero__scene`, `.hero__content`, CTA или text как moving layer. Если референс не содержит отделимой декоративной/медийной графики, укажи `hero-graphics-parallax` в `notApplicable` с причиной, не двигай весь Hero.

## 8. Navigation state machine

Перенеси `Header` из accepted `App.tsx`, не упрощая states:

```text
hero → dormant/hidden → compact → hidden → hero
```

- `hero` — полноразмерная navigation в opening composition.
- `dormant` — мгновенно невидимая compact geometry при первом пересечении boundary; этот state подавляет вспышку плашки.
- `hidden` — та же compact geometry, скрытая при движении вниз.
- `compact` — видимая compact navigation после устойчивого движения вверх.

Не объединяй `dormant` и `hidden`. Все non-hero states используют один floating layout и compact production component variants; уменьшать полный header через `scale` запрещено.

Accepted thresholds:

- input noise: `< 0.5px`;
- reveal after upward travel: `56px`;
- hide after downward travel: `24px`;
- return-to-hero clearance: `96px`;
- intro timer: `1450ms`.

Direction, accumulated distance, boundary and state update вычисляются атомарно в одном `requestAnimationFrame`. При пересечении boundary вниз state становится `dormant` без кадра `compact`. При возврате в hero показывается normal-size header, не compact surface.

Compact navigation использует:

```css
backdrop-filter: blur(40px) saturate(135%);
```

`backdrop-filter` не входит в `transition-property`: blur сразу равен `40px` и не интерполируется. Surface/foreground выбираются из проекта и проверяются поверх светлого, темного и photo background. Radius, max-width, offsets, shadow and border наследуются из design system.

## 9. Media parallax

Применяй accepted media parallax к подходящим raster media: inline photos, photo cards и non-hero background media с безопасным overscan. Hero graphics используют отдельный cover-parallax contract из раздела 7. Не применяй обычный media parallax к SVG, logo, icons, transparent cutouts или media без crop-запаса.

Contract:

- неподвижный outer `.motion-parallax[data-motion-parallax]` с `overflow:hidden`;
- единственный moving layer `.motion-parallax__image`;
- standard `data-motion-speed="0.05"` и `data-motion-scale="1.08"`;
- один общий rAF loop;
- точная формула и clamp из `useMotionEffects()`;
- transform order: `translate3d(...) scale(...)`;
- нет `transition: transform`;
- нет smoothing/lerp/spring.

Maximum travel вычисляется как половина overscan:

```js
element.clientHeight * Math.max(0, scale - 1) * 0.5
```

При контейнере около `560px` и scale `1.08` accepted maximum travel — около `22.4px`. Не перемещай outer box, positioned wrapper, text overlay или соседний layout.

Parallax отключается в JS и CSS при `max-width: 640px` и при `prefers-reduced-motion: reduce`. Для пропущенного подходящего media добавь `notApplicable` с конкретной причиной.

## 10. Buttons, links and icon controls

### Buttons

- Внешний box, размер, padding, radius и position стабильны.
- Не используй universal scale, lift, diagonal move или усиление shadow.
- Primary CTA использует accepted vertical label swap внутри `overflow:hidden`: current label уходит вверх, `aria-hidden` duplicate приходит снизу.
- Accessible name остается одним и не меняется.
- Hover/focus color pair берется из design system.
- Hover не должен снижать foreground/surface contrast или contrast кнопки к фактическому background. Если белую кнопку нельзя сделать контрастнее, используй системную dark inversion, а не серую полупрозрачную заливку.
- Похожие кнопки используют существующий production size; случайный размер generated screenshot не создает новый variant.

### Text links and navigation items

- Accepted default — underline, раскрывающаяся слева направо через `scaleX(0 → 1)`.
- Двигается линия, не весь label/navigation item.
- Внешняя click area остается не меньше project minimum, default `44×44px`.

### Icon controls/social links

- Иконка не двигается и не масштабируется.
- Local background может проявляться opacity/color внутри стабильного hit area.
- Shape наследуется из project tokens; круг не является обязательным default.

Hover rules включай только при `@media (hover: hover) and (pointer: fine)`. Реализуй также `focus-visible`, `active` и, когда применимо, `disabled`.

## 11. Reduced motion and resilience

- Скрытые initial states активируются только после появления `.motion-ready`; при отказе JS content остается видимым.
- При reduced motion headings/supporting content сразу settled, оба parallax-эффекта disabled, sticky hero removed, hero objects shown in final geometry, label swap disabled.
- Focus/contrast/outline remain functional.
- При disabled JavaScript страница остается читаемой и usable.
- На mobile проверяй accepted parallax disable и responsive header rules из source.

## 12. QA gate

Motion QA выполняется после static geometry и art-direction QA. Перед `passed`:

- production и sandbox просмотрены side-by-side на одинаковом viewport;
- normal scroll entry и reload внутри content section воспроизводят один полный heading reveal, включая vertical movement и clip-path;
- все intended `h1/h2` используют accepted line DOM либо имеют documented `notApplicable`;
- section content запускается одним section event, без очереди отдельных child observers;
- hero sequence совпадает по ordering/timing: eyebrow, main musician/media, round CTA и `40+` stat действительно проходят initial/intermediate/final states;
- при sticky-cover только отмеченные Hero graphics проходят обратимый `0 → 24px` scroll parallax; background, text, CTA, stat и navigation не трансформируются;
- navigation проходит `hero → dormant/hidden → compact → hidden → hero` без boundary flash;
- compact blur равен `40px` и отсутствует в transition list;
- parallax реально меняет inner-layer transform, container остается неподвижным и crop не открывается;
- fast/reverse scroll и resize не создают скачков;
- hover/focus сохраняют geometry и контраст;
- reduced motion, keyboard and console checks пройдены;
- `.site-builder/qa/motion.json` создан executable smoke-test, свежий и не содержит failures.

Текстовая запись «анимации похожи» или вручную выставленный `passed` не закрывают gate. Любое изменение runtime инвалидирует motion evidence и требует повторной browser-проверки.
