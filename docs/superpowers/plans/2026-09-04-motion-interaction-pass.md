# SKIP / MO/GO Motion and Interaction Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved premium motion system to the existing SKIP / MO/GO page without changing its settled layout or visual design.

**Architecture:** Keep React component state local to real UI state machines, and centralize reusable timing, pointer, counter, viewport, and header calculations in a small dependency-free motion model. CSS custom properties and the existing project-owned design system own all durations and easing; `IntersectionObserver` and requestAnimationFrame coordinate entrances and pointer depth without layout properties.

**Tech Stack:** React 19, browser-native CSS animations/transitions, `IntersectionObserver`, `requestAnimationFrame`, Node test runner, Vite 8, existing Three.js viewer, Pillow/WebP asset tooling.

**Spec:** `docs/superpowers/specs/2026-09-04-motion-interaction-pass-design.md`

## Global Constraints

- Motion only: preserve all settled layout, typography, colors, spacing, content, component dimensions, section heights, image crops, responsive structure, CTA appearance, modal behavior, and Technology GLB idle appearance.
- Do not modify `input/` or `instructions/`.
- Add no runtime animation dependency.
- Use the project-owned design system as the only production source for motion tokens and shared Button behavior.
- Animate composited/non-layout properties: `transform`, `opacity`, restrained `filter`, SVG stroke offsets, and numeric text content.
- Gate pointer effects with `(hover: hover) and (pointer: fine)` and provide immediate static states under `prefers-reduced-motion: reduce`.
- Preserve the four shared Pre-Order modal triggers: Header Pre-Order, Hero Reserve Your Spot, How It Works Reserve Your Spot, and Footer Reserve Your Spot.
- Run design-system audits after Hero + How It Works, after Technology + Testimonials, and before final completion.
- Required viewport QA: 1647px, 1440px, 1024px, 768px, and 390px.
- Git metadata is currently read-only in the execution sandbox. Attempt each scoped commit; if Windows still rejects `.git/index.lock`, record the error and continue without staging unrelated files.

---

## File structure

- Create `src/motionModel.js`: dependency-free motion constants and pure calculations for pointer mapping, count-up frames, visibility decisions, loop indices, and header state resolution.
- Modify `src/motion.jsx`: React hooks/controllers for one-time section entrances, pointer depth, counters, and scroll-direction header state.
- Modify `src/motion.css`: all transition/keyframe/state styles and reduced-motion overrides.
- Modify `src/design-system/styles.css`: semantic motion tokens and shared Button label pulse; compact Header surface token usage.
- Modify `src/Site.jsx`: stable markup/data hooks for layered Hero, counters, How state synchronization, Technology annotation entrance/parallax, Testimonials, and Footer depth.
- Modify `src/siteContent.js`: responsive Hero layer descriptors and How duration.
- Create `tools/build-motion-assets.py`: reproducible WebP generation from the two read-only Hero sources.
- Create `tests/motion-interactions.test.mjs`: pure motion and source-integration tests.
- Modify `tests/image-delivery.test.mjs`: new Hero layer descriptors, files, dimensions, priority, and fallback checks.
- Modify `tests/site-content.test.mjs`: update the user-directed motion contract and preserve CTA/modal wiring.
- Modify `.site-builder/motion.json`: runtime audit manifest matching the approved user-directed behavior.
- Create `.site-builder/qa/motion-pass-audit.md`: final evidence, viewports, reduced-motion results, and any browser-policy limitation.
- Create `.site-builder/audits/motion-pass-sections-01-02/design-system-audit.json`, `.site-builder/audits/motion-pass-sections-03-04/design-system-audit.json`, and `.site-builder/audits/motion-pass-final/design-system-audit.json`: required DS checkpoints.

### Task 1: Shared motion model and design-system tokens

**Files:**
- Create: `src/motionModel.js`
- Create: `tests/motion-interactions.test.mjs`
- Modify: `src/design-system/styles.css:1-90,323-325,408-409,445`
- Modify: `src/motion.css:1-20`

**Interfaces:**
- Produces: `MOTION_TIMING`, `clamp(value, min, max)`, `normalizePointer(rect, clientX, clientY)`, `mapDepth(point, limits)`, `countMetric(progress, target, precision)`, `nextLoopIndex(index, length)`, `shouldRunLoop({ inView, reducedMotion })`, and `resolveHeaderMode(input)`.
- Consumes: existing DS tokens including `--ds-color-action-active`, `--ds-color-ink`, and `--ds-color-surface`.

- [ ] **Step 1: Write failing pure-function and token tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('pointer mapping is centered and clamped', async () => {
  const { normalizePointer, mapDepth } = await import('../src/motionModel.js')
  const rect = { left: 100, top: 100, width: 200, height: 100 }
  assert.deepEqual(normalizePointer(rect, 200, 150), { x: 0, y: 0 })
  assert.deepEqual(normalizePointer(rect, 500, -100), { x: 1, y: -1 })
  assert.deepEqual(mapDepth({ x: 1, y: -1 }, { x: 16, y: 8 }), { x: 16, y: -8 })
})

test('loop and count helpers are deterministic', async () => {
  const { countMetric, nextLoopIndex, shouldRunLoop } = await import('../src/motionModel.js')
  assert.equal(countMetric(0.5, 30, 0), 15)
  assert.equal(countMetric(0.5, 2.5, 1), 1.3)
  assert.equal(countMetric(2, 25, 0), 25)
  assert.equal(nextLoopIndex(3, 4), 0)
  assert.equal(shouldRunLoop({ inView: true, reducedMotion: false }), true)
  assert.equal(shouldRunLoop({ inView: true, reducedMotion: true }), false)
})

test('the design system owns the approved motion values', async () => {
  const css = await readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8')
  assert.match(css, /--ds-motion-fast:\s*200ms/)
  assert.match(css, /--ds-motion-ui:\s*300ms/)
  assert.match(css, /--ds-motion-content:\s*600ms/)
  assert.match(css, /--ds-motion-image:\s*750ms/)
  assert.match(css, /--ds-motion-ease-premium:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --test-name-pattern="pointer mapping|loop and count|design system owns"`

Expected: FAIL because `src/motionModel.js` and the new semantic motion tokens do not exist.

- [ ] **Step 3: Implement the pure model and semantic tokens**

```js
export const MOTION_TIMING = Object.freeze({
  fast: 200,
  ui: 300,
  content: 600,
  image: 750,
  stagger: 90,
  technologyStagger: 120,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
})

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export function normalizePointer(rect, clientX, clientY) {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
    y: clamp(((clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
  }
}

export const mapDepth = (point, limits) => ({ x: point.x * limits.x, y: point.y * limits.y })
export const countMetric = (progress, target, precision = 0) => Number(
  (clamp(progress, 0, 1) * target).toFixed(precision),
)
export const nextLoopIndex = (index, length) => (index + 1) % length
export const shouldRunLoop = ({ inView, reducedMotion }) => inView && !reducedMotion

export function resolveHeaderMode({ introComplete, withinHero, direction, directionDistance, currentMode = 'dormant' }) {
  if (!introComplete || withinHero) return 'hero'
  if (direction === 'up' && directionDistance >= 56) return 'compact'
  if (direction === 'down' && directionDistance >= 24) return 'hidden'
  return currentMode === 'hero' ? 'dormant' : currentMode
}
```

```css
:root {
  --ds-motion-fast: 200ms;
  --ds-motion-ui: 300ms;
  --ds-motion-content: 600ms;
  --ds-motion-image: 750ms;
  --ds-motion-stagger: 90ms;
  --ds-motion-ease-premium: cubic-bezier(0.22, 1, 0.36, 1);
}
```

- [ ] **Step 4: Replace local motion literals with DS aliases and run GREEN**

```css
:root {
  --motion-duration-fast: var(--ds-motion-fast);
  --motion-duration-ui: var(--ds-motion-ui);
  --motion-duration-content: var(--ds-motion-content);
  --motion-duration-image: var(--ds-motion-image);
  --motion-ease-premium: var(--ds-motion-ease-premium);
}
```

Run: `npm test -- --test-name-pattern="pointer mapping|loop and count|design system owns"`

Expected: PASS.

- [ ] **Step 5: Attempt the scoped commit**

```powershell
git add src/motionModel.js src/design-system/styles.css src/motion.css tests/motion-interactions.test.mjs
git commit -m "feat: add shared motion model and tokens"
```

## Task 2: Header scroll-direction state machine

**Files:**
- Modify: `src/motionModel.js`
- Modify: `src/motion.jsx:175-end`
- Modify: `src/motion.css:89-151`
- Modify: `src/design-system/styles.css:382-432`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: `resolveHeaderMode()` and DS motion tokens from Task 1.
- Produces: unchanged `useHeaderMotionState()` return shape `{ open, setOpen, mode, introComplete }`; visual states `.site-header--hero`, `.site-header--dormant`, `.site-header--hidden`, `.site-header--compact`.

- [ ] **Step 1: Add failing header resolver and source-contract tests**

```js
test('header uses stable direction thresholds outside the hero', async () => {
  const { resolveHeaderMode } = await import('../src/motionModel.js')
  assert.equal(resolveHeaderMode({ introComplete: false, withinHero: true, direction: 'down', directionDistance: 80 }), 'hero')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'down', directionDistance: 23, currentMode: 'hero' }), 'dormant')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'down', directionDistance: 24, currentMode: 'dormant' }), 'hidden')
  assert.equal(resolveHeaderMode({ introComplete: true, withinHero: false, direction: 'up', directionDistance: 56, currentMode: 'hidden' }), 'compact')
})

test('compact header is a full-width dark bar rather than a centered pill', async () => {
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')
  assert.match(css, /\.site-header--compact\s*\{[^}]*width:\s*100%/s)
  assert.match(css, /\.site-header--compact[^}]*background:\s*var\(--ds-color-ink\)/s)
  assert.doesNotMatch(css, /\.site-header--compact[^}]*max-width:\s*900px/s)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="header uses stable|compact header"`

Expected: FAIL because compact mode still uses the previous floating treatment and the resolver does not yet cover exact boundary cases.

- [ ] **Step 3: Route scroll decisions through the pure resolver**

```jsx
const nextMode = resolveHeaderMode({
  introComplete: introDoneRef.current,
  withinHero: window.scrollY <= heroBoundary,
  direction,
  directionDistance: accumulatedDistanceRef.current,
  currentMode: modeRef.current,
})
setMode(nextMode)
```

Keep the existing 0.5px noise floor, 56px upward reveal, 24px downward hide, and 96px hero return clearance. Clear accumulated distance only after an accepted state transition.

- [ ] **Step 4: Apply the approved visual state without geometry changes**

```css
.site-header--hero { animation: header-intro var(--ds-motion-content) var(--ds-motion-ease-premium) both; }
.site-header--hidden { transform: translate3d(0, calc(-100% - var(--ds-space-m)), 0); opacity: 0; pointer-events: none; }
.site-header--compact { width: 100%; inset-inline: 0; transform: translate3d(0, 0, 0); }
.site-header--compact .ds-site-header { border-radius: 0; background: var(--ds-color-ink); }

@keyframes header-intro {
  from { opacity: 0; transform: translate3d(0, -20px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
```

- [ ] **Step 5: Run tests and build**

Run: `npm test -- --test-name-pattern="header uses stable|compact header|responsive header"`

Expected: PASS.

Run: `npm run build`

Expected: Vite build succeeds without warnings about invalid CSS or JSX.

- [ ] **Step 6: Attempt the scoped commit**

```powershell
git add src/motionModel.js src/motion.jsx src/motion.css src/design-system/styles.css tests/motion-interactions.test.mjs tests/site-content.test.mjs
git commit -m "feat: refine header motion states"
```

## Task 3: Layered Hero depth, entrances, and outcome counters

**Files:**
- Create: `tools/build-motion-assets.py`
- Create: `public/assets/skip/optimized/hero-sky-1600.webp`
- Create: `public/assets/skip/optimized/hero-sky-2400.webp`
- Create: `public/assets/skip/optimized/hero-sky-3200.webp`
- Create: `public/assets/skip/optimized/hero-foreground-1600.webp`
- Create: `public/assets/skip/optimized/hero-foreground-2400.webp`
- Create: `public/assets/skip/optimized/hero-foreground-3200.webp`
- Modify: `src/siteContent.js:1-65,118-121`
- Modify: `src/motion.jsx:4-174`
- Modify: `src/Site.jsx:99-150`
- Modify: `src/app.css:17-53,265-282`
- Modify: `src/motion.css:21-88,152-220`
- Modify: `tests/image-delivery.test.mjs`
- Modify: `tests/motion-interactions.test.mjs`

**Interfaces:**
- Consumes: `normalizePointer()`, `mapDepth()`, `countMetric()`, DS motion tokens.
- Produces: `usePointerDepth(ref, layers)`, `CountUpMetric({ value })`, `ASSETS.heroSky`, `ASSETS.heroForeground`, stable Hero data hooks `data-motion-group` and `data-depth-layer`.

- [ ] **Step 1: Add failing asset, markup, counter, and normal-flow tests**

```js
test('Hero declares optimized sky and transparent foreground layers', async () => {
  const { ASSETS } = await import('../src/siteContent.js')
  assert.deepEqual(ASSETS.heroSky.sources.map(({ width }) => width), [1600, 2400, 3200])
  assert.deepEqual(ASSETS.heroForeground.sources.map(({ width }) => width), [1600, 2400, 3200])
  assert.equal(ASSETS.heroForeground.src.endsWith('.webp'), true)
})

test('Hero motion preserves normal document flow and uses fixed layer boxes', async () => {
  const [site, css] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
  ])
  assert.match(site, /data-depth-layer="sky"/)
  assert.match(site, /data-depth-layer="foreground"/)
  assert.match(site, /<CountUpMetric value="30%"/)
  assert.doesNotMatch(css, /\.hero\s*\{[^}]*position:\s*sticky/s)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="Hero declares optimized|Hero motion preserves"`

Expected: FAIL because the layered descriptors, generated files, and stable markup do not exist.

- [ ] **Step 3: Create the reproducible WebP builder**

```python
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "skip" / "optimized"
SOURCES = {
    "hero-sky": ROOT / "input" / "hero-sky-background.png",
    "hero-foreground": ROOT / "input" / "hero-foreground.png",
}
WIDTHS = (1600, 2400, 3200)

OUTPUT.mkdir(parents=True, exist_ok=True)
for stem, source in SOURCES.items():
    with Image.open(source) as image:
        image.load()
        for width in WIDTHS:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = OUTPUT / f"{stem}-{width}.webp"
            resized.save(destination, "WEBP", quality=84, method=6, exact=True)
```

Run with the bundled workspace Python: `python tools/build-motion-assets.py`

Expected: six non-empty RIFF/WEBP files; foreground candidates retain alpha.

- [ ] **Step 4: Add responsive descriptors and layered Hero markup**

```js
heroSky: responsiveAsset({
  stem: 'hero-sky', widths: [1600, 2400, 3200], width: 6668, height: 4993, sizes: '100vw',
}),
heroForeground: responsiveAsset({
  stem: 'hero-foreground', widths: [1600, 2400, 3200], width: 6668, height: 4993, sizes: '100vw',
}),
```

```jsx
<span className="hero__background hero__background--fallback"><img src={ASSETS.heroBackground.src} srcSet={ASSETS.heroBackground.srcSet} sizes={ASSETS.heroBackground.sizes} width={ASSETS.heroBackground.width} height={ASSETS.heroBackground.height} alt="" fetchPriority="high" /></span>
<span className="hero__depth-layer hero__depth-layer--sky" data-depth-layer="sky"><img src={ASSETS.heroSky.src} srcSet={ASSETS.heroSky.srcSet} sizes={ASSETS.heroSky.sizes} width={ASSETS.heroSky.width} height={ASSETS.heroSky.height} alt="" fetchPriority="high" onError={(event) => { event.currentTarget.hidden = true }} /></span>
<span className="hero__depth-layer hero__depth-layer--foreground" data-depth-layer="foreground"><img src={ASSETS.heroForeground.src} srcSet={ASSETS.heroForeground.srcSet} sizes={ASSETS.heroForeground.sizes} width={ASSETS.heroForeground.width} height={ASSETS.heroForeground.height} alt="" fetchPriority="high" onError={(event) => { event.currentTarget.hidden = true }} /></span>
```

The source dimensions are exactly 6668×4993 RGBA for both supplied PNGs. The `onError` handlers hide only the failed layer so the flattened fallback remains visible.

- [ ] **Step 5: Implement requestAnimationFrame pointer depth and one-time entrance groups**

```jsx
usePointerDepth(heroRef, {
  sky: { x: 16, y: 8 },
  foreground: { x: 3, y: 2 },
})
```

```css
.hero__depth-layer--sky { transform: translate3d(var(--hero-sky-x, 0), var(--hero-sky-y, 0), 0) scale(1.03); }
.hero__depth-layer--foreground { transform: translate3d(var(--hero-foreground-x, 0), var(--hero-foreground-y, 0), 0); }
[data-motion-group] { opacity: 0; filter: blur(10px); transform: translate3d(0, -24px, 0); }
.is-motion-visible [data-motion-group] { opacity: 1; filter: blur(0); transform: translate3d(0, 0, 0); transition: opacity var(--ds-motion-content) var(--ds-motion-ease-premium), filter var(--ds-motion-content) var(--ds-motion-ease-premium), transform var(--ds-motion-content) var(--ds-motion-ease-premium); }
```

Assign delays 0ms, 90ms, 180ms, 270ms, and 360ms to the five approved Hero groups; specification rows add 90ms each within their group.

- [ ] **Step 6: Add stable one-time metric counters**

```jsx
export function CountUpMetric({ value, active }) {
  const match = value.match(/([\d.]+)(.*)/)
  const target = Number(match?.[1] ?? 0)
  const suffix = match?.[2] ?? ''
  const count = useCountUp({ target, active, duration: 800 })
  return <span aria-label={value}><span aria-hidden="true">{count}{suffix}</span></span>
}
```

Reserve the final text width with a hidden measurement span or fixed grid overlap so `0% → 30%` and `0x → 2.5x` do not shift adjacent content. Decimal interpolation must preserve the single decimal in `2.5x`.

- [ ] **Step 7: Run Hero tests, image tests, and build**

Run: `npm test -- --test-name-pattern="Hero|WebP|raster|counter|motion"`

Expected: PASS, including valid WebP signatures and preserved modal/image tests.

Run: `npm run build`

Expected: build succeeds and the initial JS bundle does not add an animation library.

- [ ] **Step 8: Attempt the scoped commit**

```powershell
git add tools/build-motion-assets.py public/assets/skip/optimized/hero-sky-*.webp public/assets/skip/optimized/hero-foreground-*.webp src/siteContent.js src/motion.jsx src/Site.jsx src/app.css src/motion.css tests/image-delivery.test.mjs tests/motion-interactions.test.mjs
git commit -m "feat: add layered hero motion"
```

## Task 4: How It Works synchronized progression and first DS checkpoint

**Files:**
- Modify: `src/motionModel.js`
- Modify: `src/motion.jsx`
- Modify: `src/Site.jsx:172-258`
- Modify: `src/siteContent.js:143`
- Modify: `src/app.css:55-88,217-244,286-298,329-337`
- Modify: `src/motion.css`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/site-content.test.mjs`
- Modify: `.site-builder/motion.json`
- Create: `.site-builder/audits/motion-pass-sections-01-02/design-system-audit.json`

**Interfaces:**
- Consumes: `nextLoopIndex()`, `shouldRunLoop()`, the one-time section visibility controller, and `--ds-color-action-active`.
- Produces: one `activeStepIndex` shared by row state, ring, image, and Step 01 callouts; duration `3800ms`; `data-how-cycle="running|paused"`.

- [ ] **Step 1: Add failing How state and source tests**

```js
test('How It Works owns one 3.8 second viewport-aware loop', async () => {
  const [site, content, css] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/siteContent.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
  ])
  assert.match(content, /HOW_IT_WORKS_STEP_DURATION_MS\s*=\s*3800/)
  assert.match(site, /data-how-cycle=\{isCycleRunning \? 'running' : 'paused'\}/)
  assert.match(site, /activeStepIndex === index/)
  assert.match(css, /--ds-color-action-active/)
  assert.match(css, /animation-play-state:\s*paused/)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="How It Works owns"`

Expected: FAIL because the duration is still 2800ms and cycle state is not exposed consistently.

- [ ] **Step 3: Implement viewport pause/resume and shared active index**

```jsx
const isCycleRunning = shouldRunLoop({ inView: sectionInView, reducedMotion })
const advanceStep = useCallback(() => {
  if (isCycleRunning) setActiveStepIndex((index) => nextLoopIndex(index, HOW_IT_WORKS_STEPS.length))
}, [isCycleRunning])
```

Use an observer threshold of `0.2`. Do not reset the active index on ordinary exit/re-entry. Under reduced motion, set Step 01 once and disable automatic advancement.

- [ ] **Step 4: Synchronize ring, copy, image, and callouts**

```jsx
<section data-how-cycle={isCycleRunning ? 'running' : 'paused'}>
  {HOW_IT_WORKS_IMAGES.map((asset, index) => (
    <img data-step-state={activeStepIndex === index ? 'active' : 'inactive'} />
  ))}
</section>
```

```css
.how[data-how-cycle='paused'] .how-step--active .how-step__ring-progress { animation-play-state: paused; }
.how-step--active .how-step__ring-progress { stroke: var(--ds-color-action-active); }
.how-step--active .how-step__number { color: var(--ds-color-action-active); }
.how__image[data-step-state='active'] { opacity: 1; transform: scale(1); transition-duration: 500ms; }
.how__image[data-step-state='inactive'] { opacity: 0; transform: scale(1.03); }
```

Keep the three callouts tied only to `activeStepIndex === 0`.

- [ ] **Step 5: Update `.site-builder/motion.json` for the user-directed contract**

Set section threshold to `0.2`, How duration to `3800`, image transition to `500`, active token to `--ds-color-action-active`, and reduced-motion state to `static-step-01`. Replace the old `exact-port` label with `user-directed-motion-pass` because the user explicitly superseded default motion timings.

- [ ] **Step 6: Run the focused suite and build**

Run: `npm test -- --test-name-pattern="How It Works|motion integration|animated copy"`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Run the first project-owned DS audit**

At `/` and `/_design-system` with identical desktop viewport, invoke `window.SiteDesignSystemAudit.runDesignSystemAudit` with the exported `DS_CONTRACT`, compare reports with `compareDesignSystemAuditReports`, and save the JSON comparison to `.site-builder/audits/motion-pass-sections-01-02/design-system-audit.json`.

Expected: no new unmanaged components, unknown typography roles, or token drift. If in-app browser execution is blocked, write a JSON report with `status: "blocked"`, the exact browser policy error, and completed source/test evidence; do not write `pass`.

- [ ] **Step 8: Attempt the scoped commit**

```powershell
git add src/motionModel.js src/motion.jsx src/Site.jsx src/siteContent.js src/app.css src/motion.css tests/motion-interactions.test.mjs tests/site-content.test.mjs .site-builder/motion.json .site-builder/audits/motion-pass-sections-01-02/design-system-audit.json
git commit -m "feat: synchronize how it works motion"
```

## Task 5: Technology annotation reveal and non-conflicting depth

**Files:**
- Modify: `src/motionModel.js`
- Modify: `src/motion.jsx`
- Modify: `src/Site.jsx:260-297`
- Modify: `src/app.css:90-116,247-255,295-299,338-340`
- Modify: `src/motion.css`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/technology-model-viewer.test.mjs`

**Interfaces:**
- Consumes: section visibility, pointer normalization, requestAnimationFrame depth loop, existing SVG connector geometry, and existing `TechnologyMedia` GLB viewer.
- Produces: `data-technology-feature-index`, `data-technology-depth`, `data-model-interacting`, and connector path reveal styles.

- [ ] **Step 1: Add failing integration tests protecting the GLB and connectors**

```js
test('Technology animates existing paths without replacing the GLB viewer', async () => {
  const [site, css] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/motion.css', import.meta.url), 'utf8'),
  ])
  assert.match(site, /data-technology-feature-index=\{feature\.number\}/)
  assert.match(site, /<TechnologyMedia/)
  assert.match(site, /technology-feature__connector[\s\S]*<path/)
  assert.match(css, /stroke-dashoffset/)
  assert.match(css, /data-model-interacting=['"]true['"]/)
  assert.doesNotMatch(site, /data-product-tilt/)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="Technology animates existing|Technology section integrates"`

Expected: FAIL on the new reveal/depth hooks while existing GLB preservation assertions remain green.

- [ ] **Step 3: Add per-feature entrance phases**

```css
.technology-feature__connector path { stroke-dasharray: 1; stroke-dashoffset: 1; }
.technology.is-motion-visible .technology-feature__connector path { animation: connector-draw 600ms var(--ds-motion-ease-premium) forwards; }
.technology-feature__icon { opacity: 0; transform: scale(.94); }
.technology-feature__content { opacity: 0; filter: blur(8px); transform: translate3d(0, 8px, 0); }

@keyframes connector-draw { to { stroke-dashoffset: 0; } }
```

Add `pathLength="1"` to each existing connector `<path>`. Set feature-unit start delays to `index × 120ms`; within each unit use connector 0ms, icon 120ms, number/title 200ms, and body 300ms. Keep total completion below 1.8 seconds.

- [ ] **Step 4: Add surrounding annotation depth without touching media transforms**

Use CSS variables `--technology-depth-x` and `--technology-depth-y` on the section. Multiply them by 2px for connectors/text and 3px for icon/number wrappers. Listen for the viewer's existing pointer-down/up lifecycle or add a bubbling `data-model-interacting` state to the media container; while true, set depth multipliers to zero. Never apply these variables to `.technology__media`, its canvas, or its poster.

- [ ] **Step 5: Run the Technology and full unit suites**

Run: `npm test -- --test-name-pattern="Technology|viewer|drag rotation|WebGL"`

Expected: PASS, including byte-identical GLB and poster fallback tests.

Run: `npm run build`

Expected: PASS; the viewer remains lazy-loaded.

- [ ] **Step 6: Attempt the scoped commit**

```powershell
git add src/motionModel.js src/motion.jsx src/Site.jsx src/app.css src/motion.css tests/motion-interactions.test.mjs tests/technology-model-viewer.test.mjs
git commit -m "feat: animate technology annotations"
```

## Task 6: Testimonial entrance, directional carousel, and second DS checkpoint

**Files:**
- Modify: `src/Site.jsx:299-381`
- Modify: `src/app.css:118-143,257-258,300-305,341-343,366`
- Modify: `src/motion.css`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/site-content.test.mjs`
- Create: `.site-builder/audits/motion-pass-sections-03-04/design-system-audit.json`

**Interfaces:**
- Consumes: existing three-testimonial data, `activeIndex`, `previousIndex`, and direction state.
- Produces: synchronized state attributes on identity and copy, `450ms` transition window, and portrait-image-only zoom.

- [ ] **Step 1: Add failing carousel motion contract tests**

```js
test('testimonial transition moves one stable state and zooms only its image', async () => {
  const [site, css] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
  ])
  assert.match(site, /data-carousel-direction=\{direction\}/)
  assert.match(css, /translate3d\(32px,\s*0,\s*0\)/)
  assert.match(css, /450ms/)
  assert.match(css, /\.testimonial__identity-state[^}]*>\s*img/s)
  assert.doesNotMatch(css, /\.testimonial__identity-state\s*\{[^}]*scale\(/s)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="testimonial transition|testimonial navigation"`

Expected: FAIL because the current carousel travels only 8px over 300ms and has no image-only zoom.

- [ ] **Step 3: Apply whole-state directional transitions**

```css
.testimonial__state[data-carousel-transition='true'] { animation-duration: 450ms; animation-timing-function: var(--ds-motion-ease-premium); }
@keyframes testimonial-enter-next { from { opacity: 0; filter: blur(6px); transform: translate3d(32px,0,0); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes testimonial-leave-next { to { opacity: 0; filter: blur(6px); transform: translate3d(-32px,0,0); } }
@keyframes testimonial-enter-previous { from { opacity: 0; filter: blur(6px); transform: translate3d(-32px,0,0); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes testimonial-leave-previous { to { opacity: 0; filter: blur(6px); transform: translate3d(32px,0,0); } }
```

Update the state cleanup timer to 450ms. Keep both identity and copy driven by the same `activeIndex`, `previousIndex`, and `direction` values.

- [ ] **Step 4: Add entrance order and portrait-image zoom**

```css
.testimonial.is-motion-visible .testimonial__identity-state[data-carousel-state='active'] > img { animation: portrait-settle 450ms var(--ds-motion-ease-premium); }
@keyframes portrait-settle { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
```

Apply entrance delays of 0ms portrait, 80ms name, 140ms role, 200ms quote, 290ms support, and 380ms navigation. Preserve the existing grid positions and `aria-live="polite"` behavior.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- --test-name-pattern="testimonial"`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Run the second project-owned DS audit**

Repeat the catalogue/production comparison at the same viewport and write `.site-builder/audits/motion-pass-sections-03-04/design-system-audit.json`.

Expected: no unmanaged carousel controls, typography drift, new color values, or changed IconButton dimensions. A browser policy rejection must be recorded as blocked, never pass.

- [ ] **Step 7: Attempt the scoped commit**

```powershell
git add src/Site.jsx src/app.css src/motion.css tests/motion-interactions.test.mjs tests/site-content.test.mjs .site-builder/audits/motion-pass-sections-03-04/design-system-audit.json
git commit -m "feat: refine testimonial transitions"
```

## Task 7: Footer depth and shared button blur pulse

**Files:**
- Modify: `src/design-system/styles.css:323-325,408-409,445`
- Modify: `src/motion.jsx`
- Modify: `src/Site.jsx:383-442`
- Modify: `src/app.css:145-178,259-264,306-328,344-357`
- Modify: `src/motion.css`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/site-content.test.mjs`

**Interfaces:**
- Consumes: shared pointer-depth controller, DS motion tokens, existing Button markup, existing Footer background asset.
- Produces: background-only footer variables `--footer-depth-x/y`, ordered footer entrance groups, and one shared label-only blur pulse.

- [ ] **Step 1: Add failing Footer and shared Button tests**

```js
test('footer depth moves only the background and shared buttons pulse only their label', async () => {
  const [site, appCss, dsCss] = await Promise.all([
    readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/design-system/styles.css', import.meta.url), 'utf8'),
  ])
  assert.match(site, /data-footer-depth/)
  assert.match(appCss, /\.footer__background[^}]*var\(--footer-depth-x/)
  assert.doesNotMatch(appCss, /\.footer__inner[^}]*var\(--footer-depth/)
  assert.match(dsCss, /@keyframes ds-button-label-pulse/)
  assert.match(dsCss, /filter:\s*blur\(4px\)/)
  assert.doesNotMatch(dsCss, /button__label-duplicate[^}]*translateY/)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="footer depth|production page renders the reviewed footer"`

Expected: FAIL because the Footer is static and Button still uses a vertical duplicate-label swap.

- [ ] **Step 3: Add background-only Footer depth and entrance order**

```css
.footer__background { transform: translate3d(var(--footer-depth-x, 0), var(--footer-depth-y, 0), 0) scale(1.03); }
.footer__inner { transform: none; }
```

Map normalized pointer values to 12px horizontally and 6px vertically, interpolate them through the shared requestAnimationFrame controller, and return to zero on leave. Assign one-time entrance delays: heading 0ms, support 90ms, CTA 180ms, navigation group 270ms.

- [ ] **Step 4: Replace vertical label swap with a hover-capable blur pulse**

```css
@media (hover: hover) and (pointer: fine) {
  .ds-button:hover .button__label-current { animation: ds-button-label-pulse 300ms var(--ds-motion-ease-premium); }
}
@keyframes ds-button-label-pulse {
  0%, 100% { filter: blur(0); opacity: 1; }
  50% { filter: blur(4px); opacity: .82; }
}
.button__label-duplicate { display: none; }
```

Keep both label spans in markup for compatibility, but hide the duplicate so accessible text and dimensions remain unchanged.

- [ ] **Step 5: Run tests and build**

Run: `npm test -- --test-name-pattern="footer|button|modal trigger"`

Expected: PASS and all four Pre-Order trigger assertions remain green.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Attempt the scoped commit**

```powershell
git add src/design-system/styles.css src/motion.jsx src/Site.jsx src/app.css src/motion.css tests/motion-interactions.test.mjs tests/site-content.test.mjs
git commit -m "feat: add footer depth and button pulse"
```

## Task 8: Reduced motion, manifest, responsive QA, and final audits

**Files:**
- Modify: `src/motion.css`
- Modify: `src/app.css`
- Modify: `src/design-system/styles.css`
- Modify: `.site-builder/motion.json`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/site-content.test.mjs`
- Create: `.site-builder/audits/motion-pass-final/design-system-audit.json`
- Create: `.site-builder/qa/motion-pass-audit.md`
- Update: `.site-builder/qa/motion-smoke-test.json`

**Interfaces:**
- Consumes: all motion hooks, state attributes, DS tokens, and existing QA runtimes.
- Produces: immediate reduced-motion presentation, final project manifest, required audit evidence, and final verification record.

- [ ] **Step 1: Add failing reduced-motion and no-layout-animation tests**

```js
test('reduced motion disables decorative travel while preserving visible content', async () => {
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(reduced, /filter:\s*none/)
  assert.match(reduced, /transform:\s*none/)
  assert.match(reduced, /animation:\s*none\s*!important/)
  assert.match(reduced, /opacity:\s*1/)
})

test('motion styles do not animate layout dimensions', async () => {
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /transition(?:-property)?:\s*[^;]*(width|height|top|left|right|bottom|margin|padding)/)
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --test-name-pattern="reduced motion|layout dimensions"`

Expected: FAIL until every new selector has an explicit immediate reduced-motion state.

- [ ] **Step 3: Complete reduced-motion and pointer-capability fallbacks**

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion-group], [data-motion-part], .technology-feature__icon, .technology-feature__content,
  .technology-feature__connector path, .hero__depth-layer, .footer__background,
  .testimonial__state, .testimonial__identity-state > img {
    animation: none !important;
    transition: none !important;
    transform: none !important;
    filter: none !important;
    opacity: 1;
  }
}
@media (hover: none), (pointer: coarse) {
  .hero__depth-layer, .footer__background, [data-technology-depth] { transform: none; }
}
```

Verify the How hook leaves Step 01 active with no interval in reduced motion and that Header/menu, testimonial buttons, Technology fallback/viewer access, modal triggers, and cookie controls still function.

- [ ] **Step 4: Run complete automated verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: Vite production build succeeds.

Run the project-owned motion smoke test in the local page context and update `.site-builder/qa/motion-smoke-test.json`.

Expected: the manifest, Header state trace, section entrances, and reduced-motion checks reflect the approved user-directed contract. If browser execution is policy-blocked, retain the last valid report and record the new run as blocked in the final audit rather than overwriting it with fabricated success.

- [ ] **Step 5: Run final DS and accessibility audits**

Run the catalogue/production DS comparison and save `.site-builder/audits/motion-pass-final/design-system-audit.json`. Confirm no new typography roles, colors, component variants, or unmarked interactive elements. Confirm visible focus, button keyboard behavior, and meaningful text remains in the accessibility tree while visually animated wrappers stay `aria-hidden` where duplicated.

- [ ] **Step 6: Perform the final browser matrix**

At 1647px, 1440px, and 1024px desktop widths verify Header intro/hide/reveal; Hero layered depth/return, entrance order, and one-time counters; How continuous 3.8s ring, synchronized images, and viewport pause/resume; Technology connector draw and GLB drag isolation; directional testimonial controls; Footer background depth; Button label pulse; and all four modal triggers.

At 768px and 390px verify pointer depth is absent, touch/page scrolling is normal, no horizontal overflow exists, no text or image is clipped/distorted, section heights remain stable, and modal/cookie UI remains usable.

Repeat at one desktop and 390px with reduced motion enabled. Confirm content is immediately visible, decorative travel/blur/counting/drawing/zoom is absent, Step 01 is static, and manual interactions still work.

- [ ] **Step 7: Write the evidence audit**

In `.site-builder/qa/motion-pass-audit.md`, record:

- implemented behavior by section;
- final timing and easing tokens;
- desktop/touch differences;
- reduced-motion behavior;
- generated Hero asset files and byte sizes;
- automated test/build results;
- DS audit results after sections 01–02, 03–04, and final;
- viewport-by-viewport results;
- exact browser-policy blocker if any required visual check could not run.

- [ ] **Step 8: Attempt the final scoped commit**

```powershell
git add src/motionModel.js src/motion.jsx src/motion.css src/app.css src/design-system/styles.css src/Site.jsx src/siteContent.js tests/motion-interactions.test.mjs tests/image-delivery.test.mjs tests/site-content.test.mjs tests/technology-model-viewer.test.mjs tools/build-motion-assets.py public/assets/skip/optimized/hero-sky-1600.webp public/assets/skip/optimized/hero-sky-2400.webp public/assets/skip/optimized/hero-sky-3200.webp public/assets/skip/optimized/hero-foreground-1600.webp public/assets/skip/optimized/hero-foreground-2400.webp public/assets/skip/optimized/hero-foreground-3200.webp .site-builder/motion.json .site-builder/qa/motion-smoke-test.json .site-builder/qa/motion-pass-audit.md .site-builder/audits/motion-pass-final/design-system-audit.json
git commit -m "feat: complete SKIP motion interaction pass"
```

- [ ] **Step 9: Review the final diff for scope**

Run: `git status --short`

Expected: no changes under `input/` or `instructions/`; no unrelated assets or page sections modified. Because the repository began with many untracked user files, review only paths named by this plan and never stage the repository root indiscriminately.
