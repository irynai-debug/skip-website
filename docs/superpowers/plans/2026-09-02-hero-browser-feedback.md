# Hero Browser Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the fourteen approved browser comments to the BirdPulse hero while preserving its copy, canonical phone asset, responsive behavior, motion contract, and production design-system ownership.

**Architecture:** Shared typography, navigation, and store-button geometry remain in `src/design-system/styles.css`. Hero-only placement stays in `src/app.css`; `src/Site.jsx` adds one decorative avatar layer over the unchanged canonical phone image. A generated square portrait is stored in `public/assets/generated/` and remains independent from the phone asset.

**Tech Stack:** React 19, Vite 8, CSS custom properties, Node test runner, in-app browser QA.

**Spec:** `.site-builder/browser-feedback-2026-09-02.md`

## Global Constraints

- Do not modify `instructions/` or `input/`.
- Do not rewrite visible text.
- Keep `public/assets/birdpulse/hero-phone.png` byte-for-byte unchanged.
- Use the project-owned design system as the only production source for shared typography, navigation links, and store buttons.
- Preserve the code-reference motion mechanics and values.
- Save hero fidelity evidence and refresh the required design-system audit before completion.
- Work directly in the user-selected project directory; the directory is not a Git repository, so worktree and commit steps are not applicable.

---

### Task 1: Browser-level regression contract

**Files:**
- Create: `.site-builder/qa-tools/hero-browser-feedback-check.js`
- Create: `.site-builder/qa/browser-feedback-red.json`
- Create: `.site-builder/qa/browser-feedback-green.json`

**Interfaces:**
- Consumes: the live DOM at `/` and browser viewport `1647x920`.
- Produces: `window.runHeroBrowserFeedbackCheck()` returning named checks, measured values, and an aggregate `passed` boolean.

- [x] **Step 1: Write the failing browser check**

  Assert real computed behavior: display font `<= 151px`, centered text, equal store-button rectangles, radius at least half the button height minus one pixel, hero phone width at most `340px`, centered phone, top edge at or above the approved visual target, header top spacing, nav weight `400`, and visible generated avatar coverage over the baked profile location.

- [x] **Step 2: Run the check before implementation**

  Execute it against `http://127.0.0.1:4173/` at `1647x920` and save the expected failing report to `.site-builder/qa/browser-feedback-red.json`.

- [x] **Step 3: Keep the check unchanged for GREEN verification**

  The implementation must satisfy the same measurement contract; do not weaken thresholds after seeing results.

### Task 2: High-resolution profile portrait

**Files:**
- Create: `public/assets/generated/hero-profile-man-green.png`
- Modify: `.site-builder/image-prompts.md`

**Interfaces:**
- Consumes: the approved avatar description and the phone UI's circular crop.
- Produces: a square, high-resolution portrait with centered face, natural photographic detail, and a clean green background.

- [x] **Step 1: Generate one square portrait asset**

  Use ImageGen for a polished head-and-shoulders portrait of a friendly adult man facing camera, centered for a circular crop, with a flat leafy-green background and no text, logos, border, or UI.

- [x] **Step 2: Inspect the full-resolution asset**

  Reject unintended text, malformed facial details, edge cropping, or a background that does not read as green at small size.

- [x] **Step 3: Record prompt and asset metadata**

  Append the final prompt, path, dimensions, and intended circular overlay usage to `.site-builder/image-prompts.md`.

### Task 3: Shared design-system adjustments

**Files:**
- Modify: `src/design-system/styles.css`
- Test: `.site-builder/qa-tools/hero-browser-feedback-check.js`

**Interfaces:**
- Consumes: existing `display`, `store`, and `nav` production roles.
- Produces: a `150px` desktop display maximum, pill store buttons, and DM Sans `400` navigation without new section-local control styles.

- [x] **Step 1: Implement minimal shared changes**

  Change only the desktop display maximum and interpolation, the store-button radius, and nav weight. Preserve line-height, colors, font families, control sizes, padding, and states.

- [x] **Step 2: Check catalogue inheritance**

  Open `/_design-system` and confirm its live display, navigation, and store specimens inherit the same production styles without catalogue overrides.

### Task 4: Hero composition and avatar overlay

**Files:**
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Test: `.site-builder/qa-tools/hero-browser-feedback-check.js`

**Interfaces:**
- Consumes: canonical `hero-phone.png`, generated portrait, existing hero grid, and existing `[data-motion-hero-graphic]` wrapper.
- Produces: centered headline, smaller/higher centered phone, generated profile overlay, and lower hero-state header.

- [x] **Step 1: Add the decorative avatar layer**

  Render a second image inside `.hero-phone-wrap` with empty alt text; absolutely position and circularly clip it over the baked avatar while leaving `hero-phone.png` untouched.

- [x] **Step 2: Adjust desktop hero geometry**

  Center the display lines, reduce the phone box to the approved target, anchor it higher below the store buttons, and move only the hero-state header row down slightly.

- [x] **Step 3: Recompose tablet and mobile**

  Keep the device fully proportional, centered, un-cropped, free of horizontal overflow, and visually balanced at `1024`, `768`, `767`, `640`, `390`, and `320` widths.

- [x] **Step 4: Run GREEN browser contract**

  Re-run the unchanged browser-level checks at `1647x920` and save `.site-builder/qa/browser-feedback-green.json` with all checks passing.

### Task 5: Evidence, audits, and final verification

**Files:**
- Modify: `.site-builder/reference-fidelity.md`
- Modify: `.site-builder/decisions.md`
- Modify: `.site-builder/design-system-audit.json`
- Modify: `.site-builder/qa/motion.json`
- Create: `.site-builder/captures/browser-feedback-2026-09-02/*.png`

**Interfaces:**
- Consumes: updated production and catalogue routes.
- Produces: fresh visual evidence and final QA reports.

- [x] **Step 1: Run hero fidelity gate**

  Capture settled hero at `1647x920`, `1440`, and `390`; record copy, silhouette, headline alignment, phone scale/position/aspect ratio, avatar quality, buttons, and header geometry.

- [x] **Step 2: Run responsive and interaction checks**

  Verify `1024`, `768`, `767`, `640`, `390`, and `320`, no horizontal overflow, navigation keyboard behavior, image loading, and clean console.

- [x] **Step 3: Run motion checks**

  Confirm the unchanged reveal DOM/timing, hero graphics parallax, header state transitions, mobile fallback, and reduced-motion behavior; refresh the motion report.

- [x] **Step 4: Run final design-system audit**

  Audit `/` and `/_design-system` at matching desktop and mobile viewports with the project-owned `DS_CONTRACT`; refresh `.site-builder/design-system-audit.json` only when runtime comparison, spacing source, and grid geometry pass.

- [x] **Step 5: Run fresh project verification**

  Run `npm test` and `npm run build`, review all output, and report any remaining blocker with evidence.
