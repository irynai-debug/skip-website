# Samurai Fashion Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete six-section Samurai fashion site, responsive motion system, live design-system route, and both QA gates.

**Architecture:** Keep Vite + React, centralize exact content in `src/siteContent.js`, render the page in `src/Site.jsx`, keep section art direction in `src/app.css`, and use the fresh project-owned starter under `src/design-system/` as the sole shared-system source. Browser evaluation consumes project-owned copies of the supplied audit primitives.

**Tech Stack:** React 19, Vite 8, CSS custom properties, Font Awesome 7, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-30-samurai-fashion-site-design.md`

## Global Constraints

- `instructions/` and `input/` are read-only.
- Visible copy is preserved verbatim.
- Section layout/media/decor remain reference-driven; only hard-scope shared UI enters the design system.
- All structural spacing consumes `--ds-space-xs` through `--ds-space-3xl` or token-derived expressions.
- Motion mechanics come from `instructions/reference/motion-sandbox/source`.
- Reference-fidelity precedes design-system audit for each section.

---

### Task 1: Contract, queue, and failing content test

**Files:**
- Create: `tests/site-content.test.mjs`
- Modify: `.site-builder/project.yaml`
- Modify: `.site-builder/inputs.md`
- Modify: `.site-builder/decisions.md`
- Modify: `.site-builder/sections.json`

**Interfaces:**
- Consumes: six PNG references and nine local font files under read-only `input/`.
- Produces: ordered queue ids `homepage:01-hero` through `homepage:06-contact-footer`; future module exports `SITE_SECTIONS`, `FEATURED_PRODUCTS`, and `FOOTER_LINKS`.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { FEATURED_PRODUCTS, SITE_SECTIONS } from '../src/siteContent.js'

test('the production content model exposes all six references in order', () => {
  assert.deepEqual(SITE_SECTIONS.map(({ id }) => id), [
    'hero', 'featured', 'fabrics', 'about', 'social', 'contact-footer',
  ])
})

test('featured product copy retains names and prices from the reference', () => {
  assert.deepEqual(FEATURED_PRODUCTS.map(({ name, price }) => [name, price]), [
    ['ECHO OF DAWN', '$2,499.00'],
    ['SILENT BLOOM', '$1,499.00'],
    ['MOONLIT REVERIE', '$1,499.00'],
  ])
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/site-content.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/siteContent.js`.

- [ ] **Step 3: Normalize project state**

Record the six references, exact 1422px widths, supplied fonts, inferred no-CMS mode, responsive targets, and current phase without modifying `input/`.

- [ ] **Step 4: Run scanner and validator diagnostics**

Run the bundled scanner with `--references input`; record that bare numeric filenames require the project-owned manual queue because renaming inputs is forbidden.

### Task 2: Fresh project-owned design system and content model

**Files:**
- Replace from starter: `src/design-system/index.jsx`
- Replace from starter: `src/design-system/styles.css`
- Replace from starter: `src/design-system/Gallery.jsx`
- Replace from starter: `src/design-system/gallery.css`
- Create: `src/siteContent.js`
- Modify: `package.json`
- Copy: `public/assets/fonts/*.ttf`

**Interfaces:**
- Consumes: starter `DS_CONTRACT`, Neue Machina, DM Sans, Font Awesome.
- Produces: `Type`, `Container`, `PageGrid`, `GridOverlay`, `Button`, `Link`, `IconButton`, `Field`, and calibrated `DS_CONTRACT`.

- [ ] **Step 1: Copy the complete starter source**

Use the four files from `instructions/reference/design-system-starter/src/design-system/` as the fresh baseline before any section code.

- [ ] **Step 2: Implement the content module**

```js
export const SITE_SECTIONS = Object.freeze([
  { id: 'hero', reference: 'input/1.png' },
  { id: 'featured', reference: 'input/2.png' },
  { id: 'fabrics', reference: 'input/3.png' },
  { id: 'about', reference: 'input/4.png' },
  { id: 'social', reference: 'input/5.png' },
  { id: 'contact-footer', reference: 'input/6.png' },
])
```

- [ ] **Step 3: Verify GREEN**

Run: `node --test tests/site-content.test.mjs`

Expected: both tests PASS.

- [ ] **Step 4: Calibrate the shared source**

Set Neue Machina/DM Sans foundations, black/white/red semantic tokens, 12/8/4 grid aliases, the mandatory spacing/radius/type scales, clipped-outline buttons, links, icon buttons, and catalogue specimens.

- [ ] **Step 5: Build before sections**

Run: `pnpm run build`

Expected: Vite exits 0 and `dist/index.html` is emitted.

### Task 3: Regenerated fashion assets

**Files:**
- Create: `public/assets/generated/hero-kimono.webp`
- Create: `public/assets/generated/featured-echo.webp`
- Create: `public/assets/generated/product-silent.webp`
- Create: `public/assets/generated/product-moonlit.webp`
- Create: `public/assets/generated/about-samurai.webp`

**Interfaces:**
- Consumes: composition and crop evidence from references 1, 2, and 4.
- Produces: separate 2x raster assets with safe crop margins; no screenshot pixels or visible UI text.

- [ ] **Step 1: Generate independent source visuals**

Create dark Japanese fashion editorial imagery with no text, logos, UI, or watermarks; preserve full garment/helmet silhouettes and safe mobile crops.

- [ ] **Step 2: Verify dimensions and decode**

Inspect every generated file, record intrinsic dimensions, and reject any asset with accidental text, clipped head/garment, or unusable focal point.

### Task 4: Sections 1–2 and first integration gate

**Files:**
- Replace: `src/Site.jsx`
- Replace: `src/app.css`
- Modify: `.site-builder/reference-fidelity.md`
- Modify: `.site-builder/design-system-audit.json`

**Interfaces:**
- Consumes: `siteContent.js`, project-owned design-system exports, generated hero/product assets.
- Produces: `Hero` and `FeaturedProducts` section components with exact copy and responsive composition.

- [ ] **Step 1: Implement static desktop and responsive layouts**

Use the calibrated page grid for content rails and local CSS only for reference-specific hero/product geometry.

- [ ] **Step 2: Capture and compare each section**

Capture settled 1422px, 768px, 390px, and 320px views; fix silhouette, typography, crop, and overflow before marking evidence `pass`.

- [ ] **Step 3: Run the section-2 audit**

Evaluate project-owned `DS_CONTRACT` on `/` and `/_design-system` at the same viewport, compare reports, and require runtime comparison plus grid and spacing-source gates to pass.

### Task 5: Sections 3–4 and second integration gate

**Files:**
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Modify: `.site-builder/reference-fidelity.md`
- Modify: `.site-builder/design-system-audit.json`

**Interfaces:**
- Produces: `NaturalFabrics` and `AboutSamurai` with code-rendered typography, clipped manifesto, generated samurai media, and responsive reading order.

- [ ] **Step 1: Implement references 3 and 4**

Keep the wordmark and oversized ABOUT US code-rendered; use the generated samurai asset as media, not as a screenshot background.

- [ ] **Step 2: Run per-section fidelity and the section-4 integration audit**

Require settled captures, clean overflow, matching shared roles, and a passing `DS_CONTRACT` comparison.

### Task 6: Sections 5–6 and third integration gate

**Files:**
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Modify: `.site-builder/reference-fidelity.md`
- Modify: `.site-builder/design-system-audit.json`

**Interfaces:**
- Produces: `SocialFollow` and `ContactFooter`; payment/social marks use the declared Font Awesome family.

- [ ] **Step 1: Implement social and footer references**

Preserve line breaks and punctuation at desktop while allowing deliberate mobile reflow; implement mail/nav actions with real accessible links.

- [ ] **Step 2: Run fidelity, page integration, and section-6 audit**

Require all six references to have evidence and the full page to pass rails, section adjacency, and responsive continuity checks.

### Task 7: Exact motion port and final verification

**Files:**
- Replace: `src/motion.jsx`
- Copy: `.site-builder/qa-tools/design-system-audit.js`
- Copy: `.site-builder/qa-tools/motion-smoke-test.js`
- Copy: `.site-builder/qa-tools/typography-audit.js`
- Modify: `.site-builder/motion.json`
- Modify: `.site-builder/sections.json`

**Interfaces:**
- Consumes: frozen sandbox mechanics and production data attributes.
- Produces: masked reveals, slide groups, inner-media parallax, reduced-motion behavior, audit reports, and final verified workflow state.

- [ ] **Step 1: Port accepted motion mechanics**

Copy lifecycle, easing, reveal, parallax clamp, and reduced-motion behavior from the sandbox source; adapt only selectors and presentation.

- [ ] **Step 2: Run motion and interaction checks**

Verify settled state, scroll behavior, hover/focus/active, keyboard navigation, focus visibility, and `prefers-reduced-motion`.

- [ ] **Step 3: Run final gates**

Run Node tests, Vite build, browser console/network checks, production↔catalogue audit at 1440 and 390, grid geometry at breakpoint edges, spacing-source audit, typography audit, and all reference captures.

- [ ] **Step 4: Complete durable state**

Set every section to `approved`/`complete`, set `workflow.final_verification` to `passed`, and retain only evidence-backed intentional deviations.
