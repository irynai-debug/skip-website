# Technology 3D Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Technology section's static central product with a lazy, manually rotatable true-3D GLB viewer while preserving its approved composition and static fallback.

**Architecture:** `TechnologyMedia` owns proximity, reduced-motion, WebGL, ready, and fallback state. `TechnologyModelViewer` dynamically imports Three.js, renders the model into an absolute canvas, and delegates deterministic rotation math to a pure interaction module. The current optimized WebP remains the server-rendered poster until a successful first frame.

**Tech Stack:** React 19, Vite 8, Three.js 0.185, Node test runner, project-owned Skip design system.

**Spec:** `docs/superpowers/specs/2026-09-04-technology-3d-viewer-design.md`

## Global Constraints

- Do not modify `input/` or `instructions/`.
- Change only the Technology section's central product visual and its supporting implementation/tests/evidence.
- Keep the existing section layout, height, benefit units, connector geometry, typography, colors, spacing, and responsive structure.
- Use true 3D from `input/mogo-device.glb`; do not simulate it with CSS transforms on the poster.
- Keep the static optimized poster as the no-shift fallback.

---

### Task 1: Lock interaction and asset contracts

**Files:**
- Create: `tests/technology-model-viewer.test.mjs`
- Create: `src/technologyModelInteraction.js`
- Modify: `src/siteContent.js`
- Create: `public/assets/skip/mogo-device.glb`

**Interfaces:**
- Consumes: `input/mogo-device.glb`, `ASSETS.technology`.
- Produces: `applyDragRotation(state)`, `advanceRotationInertia(state)`, `shouldStartTechnologyModelLoad(state)`, `detectWebGLSupport(createCanvas)`, and `ASSETS.technologyModel`.

- [x] Write failing tests asserting unrestricted Y rotation, `-20deg..20deg` X clamping, decaying inertia, gated hydration, WebGL detection, SSR poster output, unchanged six-feature integration, and byte-identical GLB production copy.
- [x] Run `pnpm test` and observe the missing interaction/media/model implementation failures.
- [x] Implement the pure interaction helpers and add `/assets/skip/mogo-device.glb` to the production asset model.
- [x] Copy the source GLB byte-for-byte into `public/assets/skip/` after validating both absolute paths are inside the project/source scope.
- [x] Run `pnpm test` and confirm the interaction and asset tests pass.

### Task 2: Implement lazy poster-to-WebGL presentation

**Files:**
- Create: `src/TechnologyMedia.js`
- Create: `src/TechnologyModelViewer.js`
- Modify: `src/Site.jsx`
- Modify: `src/app.css`
- Modify: `tests/site-content.test.mjs`
- Delete: `src/productTilt.js`

**Interfaces:**
- Consumes: `ASSETS.technology`, `ASSETS.technologyModel`, and the pure interaction helpers from Task 1.
- Produces: `TechnologyMedia({ modelSrc, poster })` and `TechnologyModelViewer({ modelSrc, onReady, onError })`.

- [x] Render `TechnologyMedia` in the exact existing center grid slot between the unchanged left and right feature lists.
- [x] Keep the poster server-rendered with explicit dimensions and mount the canvas only after the media slot enters a `480px` proximity margin.
- [x] Dynamically import `three` and `GLTFLoader`, center the GLB, fit a fixed camera, and add neutral studio lights.
- [x] Implement pointer capture, one-finger pointer events, unrestricted Y rotation, X clamping, decaying inertia, arrow-key rotation, resize handling, and context-loss fallback.
- [x] Crossfade only after the first successful rendered frame, keep the canvas absolute, and preserve the original media-box geometry at every breakpoint.
- [x] Remove the superseded pseudo-3D tilt module and tests so no rejected CSS-image interaction remains in production.
- [x] Run `pnpm test` and confirm all tests pass.

### Task 3: Verify performance, accessibility, and production output

**Files:**
- Modify: `.site-builder/reference-fidelity.md`
- Modify: `.site-builder/decisions.md`
- Modify: `.site-builder/motion-audit.json`
- Modify: `.site-builder/design-system-audit.json`
- Create: `.site-builder/audits/technology-3d/final.json`

**Interfaces:**
- Consumes: the production build, the project-owned `DS_CONTRACT`, and Technology reference `references/3-technology.png`.
- Produces: final evidence that distinguishes verified automated gates from any unavailable browser-only gate.

- [x] Run the full Node test suite after all source edits.
- [x] Run `pnpm run build` and confirm Three.js/GLTFLoader remain separate lazy chunks and the GLB is copied byte-identically into `dist`.
- [x] Validate the project-owned `DS_CONTRACT` with the project-owned copy of the mandatory audit primitive and confirm the viewer adds no design-system-managed surface.
- [x] Check authored source for layout ownership, absolute poster/canvas layering, responsive media dimensions, reduced-motion static fallback, and absence of the old pseudo-tilt implementation.
- [x] Attempt the required in-app-browser interaction/visual pass at 1647, 1448, 1440, 1024, 768, and 390; record the environment policy blocker without claiming unobserved results.
- [x] Save reference-fidelity, motion, design-system, asset-hash, build, and browser-gate evidence under `.site-builder/`.
