# Production Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Make the approved SKIP / MO/GO site reproducibly buildable and materially lighter at initial load without changing its visual design, responsive behavior, motion, modal behavior, or existing interactions.

**Architecture:** Preserve the current React/Vite application and production design-system as the runtime source of truth. Add a target-independent production build contract, stage only proven production assets, deliver only the active and next How It Works images initially, add project-owned 800px Hero variants, and evaluate a compressed GLB candidate separately before any production model switch.

**Tech Stack:** React 19, Vite 8, Node test runner, Three.js/GLTFLoader, project-owned WebP and GLB assets.

**Spec:** User-approved CRITICAL + IMPORTANT subset of the 2026-09-04 production-readiness audit in this thread.

## Global Constraints

- Do not alter layout, typography, responsive behavior, colors, motion families, timings, parallax, blur/reveal effects, modal behavior, or existing interactions.
- Do not modify `input/` or `instructions/`.
- Preserve the production design-system and live `/_design-system` consumer.
- Reject and revert any optimization that creates a visual or behavioral regression.
- Do not implement the audit's OPTIONAL items 6–8.

### Task 1: Reproducible production build and artifact contract

**Files:**
- Create: `vite.config.js`
- Create: `tests/production-build.test.mjs`
- Modify: `package.json`

1. Write a failing behavior test for a stable production output directory and exact stale-asset exclusions.
2. Run the focused test and confirm the expected failure.
3. Add a Vite build configuration that uses a clean production output independent of the currently previewed legacy `dist/` directory.
4. Prune only exact, proven-unused copied paths from the production artifact; preserve all source/public/input files.
5. Run the focused test, two consecutive builds, and an artifact inventory.

### Task 2: Active-plus-next How It Works image delivery

**Files:**
- Modify: `src/Site.jsx`
- Modify: `tests/image-delivery.test.mjs`

1. Add a failing rendered-output test proving that the initial How It Works DOM exposes network-bearing image sources only for steps 01 and 02.
2. Keep intrinsic dimensions and all four visual states while deferring `src`/`srcSet` on steps 03 and 04.
3. When the active step advances, expose the next state before it is needed while retaining already loaded images for seamless crossfade.
4. Verify the existing progression timing, pause/resume, and reduced-motion tests remain unchanged.

### Task 3: Mobile Hero image variants

**Files:**
- Create: `public/assets/skip/optimized/hero-800.webp`
- Create: `public/assets/skip/optimized/hero-sky-800.webp`
- Create: `public/assets/skip/optimized/hero-foreground-800.webp`
- Modify: `src/siteContent.js`
- Modify: `tests/image-delivery.test.mjs`

1. Add a failing content/render test for the 800px Hero candidates and the mobile-only source-size selection contract.
2. Generate proportional 800px copies from the approved project-owned 1600px variants without changing crop or aspect ratio.
3. Add the candidates to the existing responsive image source set without changing desktop selection.
4. Verify currentSrc selection and visual parity at desktop and mobile viewports.

### Task 4: GLB compression candidate and visual gate

**Files:**
- Create: `public/assets/skip/mogo-device.meshopt.glb`
- Create: `.site-builder/audits/production-performance/glb-comparison.json`
- Modify only after a passed comparison: `src/siteContent.js`, `src/TechnologyModelViewer.js`, relevant tests

1. Inspect available local GLTF optimization tooling before requesting any external dependency.
2. Create a project-owned Meshopt or Draco candidate from the source model without modifying `input/mogo-device.glb`.
3. Compare geometry, materials, textures, normals, roughness, idle framing, lighting, loading, and drag behavior against the current production model.
4. Switch production only if the browser comparison is visually equivalent and all interaction/fallback checks pass; otherwise retain the current model and exclude the candidate from production output.

### Task 5: Deployment requirements and final production QA

**Files:**
- Create: `docs/production-hosting-requirements.md`
- Create: `.site-builder/audits/production-performance/final.json`
- Modify: `.site-builder/sections.json`

1. Document target-independent compression, cache, immutable hashed asset, HTML revalidation, SPA fallback, and real-404 requirements without binding to a hosting vendor.
2. Run all tests, repeated production builds, artifact/reference checks, and the design-system audit.
3. Run browser QA at 1647, 1440, 1024, 768, and 390px, including console/network/overflow/CLS, lazy loading, 3D, all modal CTA triggers, keyboard/focus, and reduced motion.
4. Capture before/after metrics for artifact size, desktop/mobile initial payload, image requests, GLB size, build status, and tests.
5. Update project workflow state only from final evidence and run the project validator.
