# Next.js Static Export Migration Design

Status: approved in chat on 2026-09-06.

## Goal

Migrate the current SKIP / MO/GO Vite + React site to Next.js App Router while preserving the approved rendered design, responsive behavior, motion, interactions, accessibility, image delivery, and 3D viewer. The deployable result is a static `out/` directory that requires no Node.js runtime and is compatible with future GitHub Pages hosting under either `/` or a repository subpath.

## Non-negotiable invariants

- The current Vite site is the visual and behavioral baseline.
- Do not modify `input/`.
- Do not initialize Git, create a repository, deploy, or hardcode a future repository name.
- Preserve visible text, DOM semantics where behavior depends on them, layout, typography, responsive breakpoints, animation timings, parallax, reveal/blur effects, modal behavior, carousel behavior, cookie consent, and all existing interactions.
- Preserve the existing WebP `srcset` / `sizes` pipeline. Do not replace it with `next/image` unless a concrete requirement makes that necessary.
- If `next/image` is present anywhere, `images.unoptimized: true` is mandatory and covered by a regression test.
- Preserve Hero eager/high-priority split-image loading, How It Works active-plus-next delivery, lazy Three.js/GLB loading, the current static poster, and the approved Meshopt GLB.
- Remove Vite files only after the Next.js build, export, functional QA, and visual QA have passed.

## Selected architecture

Use Next.js 16.3.4 App Router with static export. `app/layout.jsx` owns document metadata and global CSS imports. `app/page.jsx` renders the main site, and `app/_design-system/page.jsx` renders the live design-system route. Both routes are prerendered at build time; there are no API routes, Server Actions, middleware, request-time rendering, cookies from the server, or other server-runtime features.

The main composition remains a Server Component. Client JavaScript is isolated to the existing interactive boundaries:

- a motion runtime for viewport, scroll, counter, and pointer-driven effects;
- How It Works progression and crossfade;
- Technology lazy loading and the real GLB viewer;
- testimonial carousel;
- shared Pre-Order modal controller and dialog;
- cookie consent;
- development-only QA/grid helpers where required.

Static content, the footer link structure, and non-interactive section markup remain server-rendered. A single delegated modal controller handles the exact four approved CTA triggers by a stable data attribute, so the CTA markup can remain in server-rendered sections while every trigger opens the same dialog instance.

## Assets and subpath behavior

`next.config.mjs` uses `output: 'export'`, `trailingSlash: true`, and `images.unoptimized: true`. A normalized build-time base path comes from `NEXT_PUBLIC_BASE_PATH`; an optional `NEXT_PUBLIC_ASSET_PREFIX` may override the Next static asset prefix. No repository name is embedded in source.

Public asset URLs pass through one `assetPath()` helper. It prefixes internal `/assets/...` and development QA URLs with the configured base path while leaving external URLs, hashes, and already-prefixed paths unchanged. Existing raster descriptors, media conditions, widths, and loading hints remain unchanged. CSS-bundled fonts continue to be emitted as hashed framework assets so font loading follows the Next.js asset prefix automatically.

The approved optimized production copies remain under `public/assets/skip`. `input/` stays source-only and unchanged. Production pruning moves from the Vite plugin into a deterministic post-build script that operates only on `out/` and removes the already-audited stale public copies. The same script writes `out/.nojekyll`.

## Build and package behavior

The project keeps React 19 and Three.js. Next.js current stable is added; Vite is retained only until migration verification passes and then removed. `npm run dev` starts Next development mode. `npm run build` performs `next build` followed by deterministic export finalization. The normal build artifact is `out/`.

The existing `pnpm-lock.yaml` remains the dependency lock source. Package scripts remain callable through `npm run ...`; no second lockfile is intentionally introduced.

## Test strategy

Migration follows test-first checkpoints:

1. Add failing contract tests for Next configuration, routes, export finalization, `.nojekyll`, and configurable subpath asset URLs.
2. Replace the Vite SSR test harness with a framework-neutral JSX loader while preserving the current behavioral assertions.
3. Add failing regression coverage for Hero image descriptors, How It Works active-plus-next loading, the exact four shared modal triggers, and lazy Technology/3D behavior.
4. Implement the minimum migration changes required to make those tests pass.
5. Run the complete automated suite and two unchanged-source production builds.
6. Serve `out/` through a plain static server and verify routes, assets, console, hydration, network behavior, motion, modal, carousel, cookie consent, and 3D fallback/interaction.
7. Compare Next screenshots to the captured Vite baseline at 1647, 1440, 1024, 768, and 390 pixels. Any material visual or behavioral drift blocks cleanup.

## Error and fallback behavior

- A failed or unavailable WebGL viewer keeps the current static Technology poster.
- Client-only browser APIs stay behind effects or guarded runtime checks so build-time prerendering does not access `window`, `document`, `localStorage`, or WebGL.
- The modal continues to restore focus and page scrolling on every close path.
- Reduced-motion behavior remains unchanged.
- Static hosts must serve generated files with correct MIME types and a 404 page. Cache/compression requirements stay deployment documentation rather than Vite- or provider-specific runtime configuration.

## Verification and cleanup gate

Before Vite removal, the migration must prove:

- `npm run dev` works;
- `npm run build` succeeds and creates `out/index.html`, `out/_design-system/index.html`, `out/404.html`, and `out/.nojekyll`;
- a second clean build succeeds without mutating `input/` or `public/`;
- default-root and configured-subpath asset references are valid;
- all automated tests pass;
- the exact four CTA triggers open the same modal;
- Hero, How It Works, Technology/GLB, testimonial, cookie, header, and footer behavior matches baseline;
- no hydration errors, missing assets, unexpected eager requests, horizontal overflow, clipped text, distorted images, or responsive regressions appear at the five required widths;
- the live `/_design-system` route and final design-system audit pass.

Only after this gate may obsolete `index.html`, `src/main.jsx`, `src/App.jsx`, and `vite.config.js` be removed and Vite dropped from dependencies.

## Self-review

- Placeholder scan: no TBD/TODO placeholders.
- Consistency: static export, client boundaries, asset prefixing, and test strategy agree.
- Scope: limited to the requested framework migration and required infrastructure.
- Ambiguity resolved: `next/image` is not introduced; `images.unoptimized: true` is still configured and tested as a static-export safeguard.
- Repository exception: this document is not committed because the project has no Git metadata and the user explicitly prohibited Git initialization.
