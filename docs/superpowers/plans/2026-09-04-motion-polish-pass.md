# SKIP / MO/GO Motion Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing entrance and transition choreography without visual/layout drift, while slowing the two Hero outcome counters to a synchronized 1300ms count-up.

**Architecture:** Keep the established React/CSS motion architecture and project-owned design system. Introduce semantic timing values in the design-system token layer, expose matching JavaScript timing values through `MOTION_TIMING`, and apply section-scoped entrance states so interactive parallax, 3D controls, buttons, and scrolling remain untouched.

**Tech Stack:** React 19, CSS custom properties, requestAnimationFrame, native IntersectionObserver, Node test runner, Vite.

**Spec:** `C:\Users\user\.codex\attachments\157274a8-90ea-4e96-8438-ba5d4e83b8c4\pasted-text.txt` plus the approved counter amendment in the conversation.

## Global Constraints

- Do not change layout, typography, responsive behavior, section dimensions, content, production assets, image crops, CTA/modal/carousel behavior, or connector geometry.
- Do not modify `input/` or `instructions/`.
- Preserve Hero/Footer pointer-parallax sensitivity, Technology annotation depth, true 3D GLB loading/drag/inertia, button hover speed, and scroll response.
- Major entrance/reveal duration is 800ms with the existing premium easing; small stagger is 60–120ms.
- How image state crossfade is 700ms; How active-step duration is 4200ms and remains exactly synchronized with its progress ring.
- Hero `30%` and `2.5x` counters count from zero over 1300ms, start together after their shared block reveal, and finish together with smooth easing.
- Active How ring and number use `--ds-color-action-active`.
- Reduced motion must expose stable final content immediately and retain the current static How Step 01 behavior.
- Validate at 1647px, 1440px, 1024px, 768px, and 390px with no overflow or layout drift.
- Use the shadow Git wrapper `.superpowers/sdd/2026-09-04-motion-interaction-pass/shadow-git.ps1`; the source `.git` is not usable.

---

### Task 1: Motion tokens, coherent headings, Hero counters, and compact header

**Files:**
- Modify: `src/design-system/styles.css`
- Modify: `src/motionModel.js`
- Modify: `src/motion.jsx`
- Modify: `src/motion.css`
- Modify: `src/Site.jsx`
- Modify: `.site-builder/motion.json`
- Test: `tests/motion-interactions.test.mjs`
- Test: `tests/motion-smoke-contract.test.mjs`

**Interfaces:**
- Produces: `MOTION_TIMING.content = 800`, `MOTION_TIMING.imageCrossfade = 700`, `MOTION_TIMING.heroCount = 1300`; matching DS timing tokens; `MotionHeading` coherent mode; shared Hero counter activation.
- Consumes: existing `CountUpMetric`, `MotionHeading`, Hero `data-motion-group`, header mode classes, and DS grid variables.

- [ ] **Step 1: Write failing tests**

```js
assert.equal(MOTION_TIMING.content, 800)
assert.equal(MOTION_TIMING.imageCrossfade, 700)
assert.equal(MOTION_TIMING.heroCount, 1300)
assert.equal(heroCounters[0].transitionDuration, heroCounters[1].transitionDuration)
assert.equal(heroCounters[0].transitionDuration, '1300ms')
assert.equal(compactHeader.top, '0px')
assert.equal(compactHeaderInner.width, heroHeaderInner.width)
assert.equal(heroHeading.clipPath, 'none')
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: FAIL because the current content timing is 600ms, counters are 800ms, Hero heading is line-clipped, and compact header content is full-width.

- [ ] **Step 3: Implement the minimum production change**

```js
export const MOTION_TIMING = Object.freeze({
  fast: 200,
  ui: 300,
  content: 800,
  image: 750,
  imageCrossfade: 700,
  heroCount: 1300,
  stagger: 90,
  technologyStagger: 120,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
})
```

Add a coherent `MotionHeading` mode that animates the whole visual wrapper with opacity, blur, and `translate3d(0,-24px,0)` while neutralizing per-line clip/transform transitions. Apply it to Hero in this task; later tasks consume the same mode for How It Works and Footer. Gate both Hero counters from one shared outcome-block reveal signal and use the 1300ms timing with the existing count formatting. Keep the compact header shell full-width at `top:0`, place its inner `SiteHeader` content on the same max-width/grid rail as Hero, and use 16px block padding above and below unchanged controls.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: PASS with synchronized 1300ms counters, coherent Hero heading, and constrained compact-header geometry.

- [ ] **Step 5: Run the full suite and commit**

Run: `node --test tests/*.test.mjs`

Commit: `feat: polish hero and compact header motion`

---

### Task 2: How It Works entrance and state-transition polish

**Files:**
- Modify: `src/siteContent.js`
- Modify: `src/Site.jsx`
- Modify: `src/motion.css`
- Modify: `.site-builder/motion.json`
- Modify: `work/qa-motion.cjs`
- Test: `tests/motion-interactions.test.mjs`
- Test: `tests/motion-smoke-contract.test.mjs`

**Interfaces:**
- Consumes: coherent `MotionHeading` mode and DS 800ms/700ms timing tokens from Task 1.
- Produces: `HOW_IT_WORKS_STEP_DURATION_MS = 4200`, explicit heading/support/media/row entrance contracts, and a 700ms image crossfade.

- [ ] **Step 1: Write failing tests**

```js
assert.equal(how.style.getPropertyValue('--how-step-duration'), '4200ms')
assert.deepEqual(rowDelays, ['160ms', '250ms', '340ms', '430ms'])
assert.ok(howHeadingUsesCoherentMode)
assert.equal(howImageTransitionDuration, '700ms')
assert.equal(activeRingColor, 'var(--ds-color-action-active)')
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: FAIL because the step cycle is 3800ms, image crossfade is 500ms, and heading/support do not share the dedicated coherent reveal contract.

- [ ] **Step 3: Implement the minimum production change**

Set the step duration to 4200ms. Give heading and support section-scoped 800ms blur/fade/vertical reveals, keep rows fixed in layout and reveal them in order with 90ms stagger, and set incoming/outgoing images to a 700ms crossfade with incoming `scale(1.03)` settling to `scale(1)`. Preserve the existing active-index controller, ring synchronization, image crop, callout state, and row spacing.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: PASS with a 4200ms synchronized cycle and no layout-property animation.

- [ ] **Step 5: Run the design-system audit and commit**

Run: `node work/qa-design-system.cjs`

Run: `node --test tests/*.test.mjs`

Commit: `feat: polish how it works motion`

---

### Task 3: Technology annotation choreography

**Files:**
- Modify: `src/design-system/styles.css`
- Modify: `src/motionModel.js`
- Modify: `src/motion.css`
- Modify: `src/Site.jsx`
- Modify: `.site-builder/motion.json`
- Test: `tests/motion-interactions.test.mjs`
- Test: `tests/motion-smoke-contract.test.mjs`

**Interfaces:**
- Consumes: existing six `TechnologyFeature` items and existing connector geometry.
- Produces: separate connector/icon/number/title/body phase delays, with each annotation unit completing in approximately 800ms.

- [ ] **Step 1: Write failing tests**

```js
assert.deepEqual(getTechnologyFeatureRevealTiming(0), {
  connectorDelayMs: 0,
  iconDelayMs: 80,
  numberDelayMs: 160,
  titleDelayMs: 240,
  bodyDelayMs: 320,
  completeAtMs: 800,
})
assert.ok(getTechnologyFeatureRevealTiming(5).completeAtMs < 1400)
assert.equal(modelMediaTransformRules.length, 0)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: FAIL because number and title currently share a phase and the annotation contract completes with the old timing model.

- [ ] **Step 3: Implement the minimum production change**

Use a 90ms feature stagger and an internal connector → icon → number → title → body hierarchy at 80ms intervals. Add only the missing number/title timing variables and transition rules. Do not modify `.technology__media`, `.technology__canvas`, `.technology__poster`, `TechnologyMedia.js`, model URLs, pointer mapping, or connector paths/circles.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: PASS with ordered annotation phases and unchanged model interaction contracts.

- [ ] **Step 5: Run the full suite and commit**

Run: `node --test tests/*.test.mjs`

Commit: `feat: polish technology annotation reveals`

---

### Task 4: Testimonials and Footer reveal polish

**Files:**
- Modify: `src/motion.css`
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Modify: `.site-builder/motion.json`
- Modify: `work/qa-motion.cjs`
- Test: `tests/motion-interactions.test.mjs`
- Test: `tests/motion-smoke-contract.test.mjs`

**Interfaces:**
- Consumes: coherent `MotionHeading` mode and 800ms content timing from Task 1.
- Produces: 800ms testimonial entrance groups, unchanged 450ms directional carousel with blur-to-sharp text replacement, and coherent Footer heading/support/CTA/navigation reveals.

- [ ] **Step 1: Write failing tests**

```js
assert.equal(testimonialEntranceDuration, '800ms')
assert.equal(testimonialCarouselDuration, '450ms')
assert.equal(testimonialQuoteClipPath, 'none')
assert.equal(footerHeadingClipPath, 'none')
assert.deepEqual(footerDelays, ['0ms', '90ms', '180ms', '270ms'])
assert.equal(footerEntranceDuration, '800ms')
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: FAIL because entrance groups currently resolve to 600ms and the Footer heading still inherits per-line clipping.

- [ ] **Step 3: Implement the minimum production change**

Apply the coherent heading mode to Footer and ensure the outer Footer heading group owns its 800ms opacity/blur/vertical reveal. Keep support, CTA, and navigation at 90ms increments. Preserve the existing 450ms testimonial next/previous transition, portrait zoom, carousel wrapping, arrow behavior, and fixed geometry; ensure testimonial copy remains blur-to-sharp with no line clipping.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/motion-interactions.test.mjs tests/motion-smoke-contract.test.mjs`

Expected: PASS with unchanged carousel interaction and coherent Footer reveal.

- [ ] **Step 5: Run the design-system audit, full suite, build, and commit**

Run: `node work/qa-design-system.cjs`

Run: `node --test tests/*.test.mjs`

Run: `pnpm build`

Commit: `feat: finish motion polish pass`

---

### Task 5: Integrated browser QA and evidence

**Files:**
- Modify only if tests identify a regression: the smallest owning source/test file.
- Update: `.site-builder/motion.json` only when runtime evidence disagrees with the declared motion contract.
- Evidence: `.superpowers/sdd/2026-09-04-motion-polish-pass/`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: final motion-smoke, DS audit, responsive browser evidence, and whole-branch review package.

- [ ] **Step 1: Run automated QA**

Run: `node work/qa-design-system.cjs`

Run: `node work/qa-motion.cjs http://127.0.0.1:5175/`

Run: `node --test tests/*.test.mjs`

Run: `pnpm build`

- [ ] **Step 2: Run browser QA at every required width**

At 1647, 1440, 1024, 768, and 390px verify no horizontal overflow, clipped text, image distortion, layout shift, or broken image. Verify coherent Hero/Footer headings, constrained top-flush compact header, ordered How rows and 700ms crossfade, 4200ms How synchronization, 1300ms synchronized Hero counters, ordered Technology annotations, unchanged Hero/Footer parallax, and unchanged 3D GLB viewer behavior.

- [ ] **Step 3: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce` and verify immediate settled reveals, Step 01 static, static decorative depth, and functional manual carousel/CTA/modal controls.

- [ ] **Step 4: Run the final design-system audit and commit evidence updates if any tracked evidence changed**

Run: `node work/qa-design-system.cjs`

Commit when tracked QA artifacts changed: `test: record motion polish evidence`
