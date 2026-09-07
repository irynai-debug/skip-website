# BirdPulse Reference Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete six-section BirdPulse landing page, responsive behaviour, motion, live design system and both required QA gates.

**Architecture:** Retain Vite + React and replace the stale page composition. A project-owned copy of the mandatory starter remains the single source for tokens, grid, typography and controls; section-specific visuals remain in `Site.jsx` and `app.css`.

**Tech Stack:** React 19, Vite 8, CSS custom properties, Node test runner, project QA primitives, in-app browser.

**Spec:** `docs/superpowers/specs/2026-09-01-birdpulse-site-design.md`

## Global Constraints

- Do not modify `instructions/` or `input/`.
- Preserve visible reference copy and section order.
- Use only `src/design-system/` as the production design-system source.
- Run reference-fidelity before design-system sync for every section.
- Run the project-owned `DS_CONTRACT` audit after every two sections and before final acceptance.
- Port motion mechanics from `instructions/reference/motion-sandbox/source/`.

---

### Task 1: Reset Project State and Production Foundations

**Files:**
- Modify: `.site-builder/project.yaml`
- Modify: `.site-builder/inputs.md`
- Modify: `.site-builder/sections.json`
- Modify: `.site-builder/decisions.md`
- Replace: `src/design-system/index.jsx`
- Replace: `src/design-system/styles.css`
- Replace: `src/design-system/Gallery.jsx`
- Replace: `src/design-system/gallery.css`
- Create: `public/assets/birdpulse/*`

**Interfaces:**
- Consumes: starter exports `Container`, `PageGrid`, `GridOverlay`, `Type`, `Button`, `Link`, `IconButton`, `Field`, `DS_CONTRACT`.
- Produces: calibrated BirdPulse exports from `src/design-system/index.jsx` and canonical asset URLs rooted at `/assets/birdpulse/`.

- [ ] **Step 1: Write failing production-content tests**

```js
assert.deepEqual(SITE_SECTIONS.map(({ id }) => id), [
  'hero', 'community', 'how-it-works', 'testimonials', 'download', 'footer',
])
assert.equal(HERO_COPY.heading, 'HEAR IT.\nKNOW IT.')
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `pnpm test`

Expected: the stale Samurai section ids and copy fail the new assertions.

- [ ] **Step 3: Calibrate the copied starter and project state**

Copy the four starter design-system files into `src/design-system/`, then change only the project-owned copies. Set DM Sans/Cormorant foundations, BirdPulse semantic colors, unchanged grid source tokens, canonical icon metadata and the `store` button variant in `DS_CONTRACT` and `Gallery`.

- [ ] **Step 4: Repair dependencies and run the pre-section build**

Run: `pnpm install --offline --store-dir ..\.pnpm-store`

Run: `pnpm build`

Expected: Vite completes without imports from `instructions/` or `input/`.

### Task 2: Implement Hero and Community Sections

**Files:**
- Modify: `src/siteContent.js`
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Modify: `tests/site-content.test.mjs`
- Update: `.site-builder/reference-fidelity.md`
- Update: `.site-builder/sections.json`

**Interfaces:**
- Consumes: `Type`, `PageGrid`, `Container`, `Button`, `Link`, `IconButton` and BirdPulse assets.
- Produces: `Hero`, `Community`, `StoreBadge`, and shared decorative `Waveform` page helpers.

- [ ] **Step 1: Add exact copy assertions for sections 1–2**

```js
assert.equal(COMMUNITY_COPY.headingLead, 'Trusted by a growing community of')
assert.equal(COMMUNITY_COPY.headingAccent, 'nature lovers.')
assert.deepEqual(COMMUNITY_METRICS.map(({ value }) => value), ['150K+', '95K+', '200+'])
```

- [ ] **Step 2: Run tests and confirm missing exports fail**

Run: `pnpm test`

Expected: `COMMUNITY_COPY` or `COMMUNITY_METRICS` is not exported.

- [ ] **Step 3: Implement minimal semantic sections and responsive CSS**

Use the supplied background and phone assets; navigation and store actions use production controls. Use grid tokens for rails and spacing tokens for all authored structural spacing.

- [ ] **Step 4: Capture and pass the first fidelity gate**

Capture section 1 and 2 at 1440 CSS px in settled motion state, record mismatch/fix/status, then repeat after design-system sync.

- [ ] **Step 5: Run checkpoint 01–02**

Run production/catalogue audits at 1440 px, compare them with project-owned `DS_CONTRACT`, persist the report and repair drift before continuing.

### Task 3: Implement How It Works and Testimonial Sections

**Files:**
- Modify: `src/siteContent.js`
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Create: `public/assets/birdpulse/chickadee.webp`
- Create: `public/assets/birdpulse/maya-hernandez.webp`
- Update: `.site-builder/reference-fidelity.md`
- Update: `.site-builder/sections.json`

**Interfaces:**
- Consumes: canonical SVG icons, generated 2× photos, production typography and IconButton.
- Produces: `HowItWorks`, `ProcessStep`, `Testimonial` and local audio/result compositions.

- [ ] **Step 1: Add exact process and testimonial copy assertions**

```js
assert.deepEqual(PROCESS_STEPS.map(({ title }) => title), [
  'Capture the sound', 'AI analyzes the song', 'Get your identification',
])
assert.equal(TESTIMONIAL_COPY.name, 'Maya Hernandez')
```

- [ ] **Step 2: Run tests and confirm missing exports fail**

Run: `pnpm test`

- [ ] **Step 3: Generate only the two screenshot-only photos**

Generate a square Black-capped Chickadee nature photo and a square portrait matching the supplied testimonial avatar; save 2× WebP assets without rasterizing any UI.

- [ ] **Step 4: Implement the two sections and pass their fidelity gates**

Build the phone/analyser/result UI in code, preserve the portrait and card crop, capture each section before and after DS sync, and record evidence.

- [ ] **Step 5: Run checkpoint 03–04**

Run full-page responsive checks plus production/catalogue design-system and typography comparisons at 1440 px.

### Task 4: Implement Download and Footer Sections

**Files:**
- Modify: `src/siteContent.js`
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Update: `.site-builder/reference-fidelity.md`
- Update: `.site-builder/sections.json`

**Interfaces:**
- Consumes: shared `StoreBadge`, `Waveform`, canonical footer background and design-system navigation links.
- Produces: `DownloadCTA` and `Footer` completing the page queue.

- [ ] **Step 1: Add closing CTA and footer copy assertions**

```js
assert.equal(DOWNLOAD_COPY.heading, 'Ready to discover the birds around you?')
assert.deepEqual(FOOTER_GROUPS.map(({ title }) => title), ['App', 'Explore', 'Company', 'Help'])
assert.equal(FOOTER_COPY.copyright, '© 2026 BirdPulse. All rights reserved.')
```

- [ ] **Step 2: Run tests and confirm missing exports fail**

Run: `pnpm test`

- [ ] **Step 3: Implement sections and exact responsive recomposition**

Reuse the same production store-button variant, keep the waveform local/shared at page level, and use the supplied full-bleed footer scene with readable overlay.

- [ ] **Step 4: Pass section fidelity and checkpoint 05–06**

Capture both sections before/after design-system sync, then run full-page and DS audits at 1440 and 390 px.

### Task 5: Port Motion and Complete Responsive Behaviour

**Files:**
- Replace: `src/motion.jsx`
- Modify: `src/app.css`
- Modify: `src/Site.jsx`
- Update: `.site-builder/motion.json`
- Update: `.site-builder/responsive-evidence.md`

**Interfaces:**
- Consumes: frozen sandbox readiness, heading reveal, grouped slide reveal and media parallax mechanisms.
- Produces: `MotionHeading`, `useMotionEffects` and reduced-motion-safe settled states.

- [ ] **Step 1: Port sandbox behavior without new motion families**

Retain the sandbox state model and selectors, adapting only BirdPulse presentation classes and data attributes.

- [ ] **Step 2: Run motion smoke tests**

Run the copied `runMotionSmokeTest()` harness at desktop and reduced-motion/mobile conditions.

- [ ] **Step 3: Verify responsive continuity**

Check 1440, 1024, 768, 640, 390 and 320 px plus both sides of content-driven breakpoints; repair overflow, clipping, crop and navigation collisions.

### Task 6: Strict Final QA and Handoff

**Files:**
- Update: `.site-builder/design-system-audit.json`
- Update: `.site-builder/reference-fidelity.md`
- Update: `.site-builder/sections.json`
- Update: `.site-builder/final-report.md`

**Interfaces:**
- Consumes: completed production site, live catalogue, QA primitives and browser evidence.
- Produces: final accepted workflow state and reproducible QA report.

- [ ] **Step 1: Run unit and production builds**

Run: `pnpm test && pnpm build`

- [ ] **Step 2: Run final browser QA**

Verify fonts after `document.fonts.ready`, exact copy, all target widths, keyboard flow, focus visibility, reduced motion, console/network cleanliness, asset loading and no page overflow.

- [ ] **Step 3: Run strict project validation**

Run the bundled validator with `--final`; repair every failure before completion.

- [ ] **Step 4: Record final evidence**

Set every queue item to complete/approved, persist final audit reports and list only evidence-backed intentional deviations.

