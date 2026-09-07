# Skip MO/GO implementation plan

> Execute in the requested project directory. Use test-first cycles for production behavior and preserve `input/` plus `instructions/` unchanged.

**Goal:** Rebuild the five-reference Skip MO/GO landing page with one project-owned design system, exact copy, responsive layouts, accepted motion, and evidence-backed QA.

**Architecture:** Vite + React remains unchanged. `siteContent.js` owns exact content and asset URLs; `src/design-system/` owns tokens and shared components; `Site.jsx` owns semantic section composition; `motion.jsx` and `motion.css` are the mechanical accepted runtime port; `App.jsx` routes `/` and `/_design-system`. QA state and reports live in `.site-builder/`.

### Task 1: Reset factual project state

- Replace stale `.site-builder/project.yaml`, `sections.json`, and `decisions.md` with Skip-specific facts.
- Preserve old unrelated artifacts but do not reference them as current evidence.
- Mark foundations provisional and section 1 in progress only when implementation begins.

### Task 2: Establish the production design system (RED → GREEN)

- Replace `tests/site-content.test.mjs` with exact Skip content and DS contract assertions.
- Run `pnpm test` and confirm failures are caused by absent Skip exports/roles.
- Copy the starter into `src/design-system/`, calibrate tokens/typography/assets, add shared primitives, and update the live gallery.
- Run tests and the static DS contract validation.

### Task 3: Sections 1–2 and first integration gate

- Implement hero and how-it-works from foundations outward.
- Use shared header/nav/buttons/metric rows/arrows/dividers.
- Capture 1448 evidence and record per-section fidelity reports.
- Run build/tests, design-system catalogue/production audit, overflow checks, and record checkpoint 1–2.

### Task 4: Sections 3–4 and second integration gate

- Implement the technology diagram with supplied product/icon assets.
- Implement testimonial with project-owned Daniel portrait and shared arrows.
- Capture evidence, run build/tests and the next design-system audit, and record checkpoint 3–4.

### Task 5: Section 5 and accepted motion

- Implement the photographic footer and shared footer links/social controls.
- Copy the motion manifest template and mechanically port accepted runtime/styles.
- Verify normal, reverse, fast scroll, compact header transitions, parallax, and reduced motion; save motion smoke-test report.

### Task 6: Responsive and consolidated QA

- Check 1448, 1440, 1024, 768, and 390 in the in-app browser.
- Verify no horizontal overflow, clipped text, distorted media, accidental scrollbars, console errors, or layout jumps.
- Run accessibility, color, layout, typography, UI, writing/humanizer, and interface reviews without changing authoritative visible copy.
- Run final build/tests, live `/_design-system` audit, and both final QA gates; update `.site-builder` to passed only from fresh evidence.
