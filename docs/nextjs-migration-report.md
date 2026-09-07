# SKIP / MO/GO Next.js migration report

Status: **complete and verified** on 2026-09-06. The migration is technical only; no intentional design or motion retiming was introduced.

## 1. Previous framework/build setup

The approved site used React 19 with Vite 8, a Vite HTML entrypoint, a Vite production plugin, and `dist-production/` as its optimized artifact.

## 2. Resulting Next.js architecture

The site now uses Next.js App Router with build-time prerendering and `output: 'export'`. The deployable result is plain static files in `out/`; there are no API routes, Server Actions, middleware, request-time SSR, or required Node.js server runtime.

## 3. Next.js version

Next.js `16.3.4`, React `19.2.8`, React DOM `19.2.8`, and Three.js `0.185.1`.

## 4. App Router structure

- `app/layout.jsx` owns document metadata and global CSS.
- `app/page.jsx` exports `/`.
- `app/%5Fdesign-system/page.jsx` exports `/_design-system/`; the encoded folder avoids Next.js treating a leading underscore as private.
- `app/not-found.jsx` exports the static 404 route.

All three routes are reported as static by `next build`.

## 5. Files added

Added the App Router files, `next.config.mjs`, `src/assetPath.js`, the server site shell, a server-compatible footer, client runtime/interactive-section modules, client grid overlay, framework-neutral JSX test loader, Next migration tests, static-export finalizer/server/manifest/QA-sync scripts, a strict exported-reference verifier, project-owned exact icon/font copies, migration design/plan/report documents, and migration QA evidence/captures.

## 6. Files modified

Updated `package.json`, `pnpm-lock.yaml`, `site.config.yaml`, the design-system entrypoint/gallery/styles, site content/asset descriptors, cookie/modal/3D/motion/QA modules, and the existing affected tests. Visible copy, typography tokens, layout CSS, responsive breakpoints, raster candidates, and approved motion constants were preserved.

## 7. Files removed

Removed only the obsolete Vite entry/configuration files after the Next export and browser gates passed:

- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `vite.config.js`

No source/reference asset was deleted from `input/`.

## 8. Dependencies added/removed

Added `next@16.3.4`. Removed `vite`. No carousel, animation, UI, CSS, or alternative 3D framework was added. The final dev dependency set is only `esbuild` and `postcss`; the existing runtime dependency set remains React, React DOM, Three.js, plus Next.js.

## 9. Static-export configuration

`next.config.mjs` sets:

- `output: 'export'`
- `trailingSlash: true`
- configurable `basePath` from `NEXT_PUBLIC_BASE_PATH`
- configurable `assetPrefix` from `NEXT_PUBLIC_ASSET_PREFIX`, otherwise the base path
- `images.unoptimized: true`
- deterministic default build ID `skip-mogo-static-v1`, overridable with `NEXT_BUILD_ID`

A real `/skip-preview` build passed with all `_next` and project assets prefixed, no doubled prefix, and no unprefixed production asset URLs. No repository name is hardcoded.

## 10. Image strategy

The existing `<img>`/WebP `srcset`/`sizes` pipeline remains the production source. `next/image` is not imported. Hero keeps eager/high-priority layered delivery and its mobile candidate; How It Works exposes only active + next images initially and preserves crossfade/zoom; other media keep their intrinsic sizes, crops, decoding, and lazy behavior.

## 11. Font strategy

The four exact project-owned Neue Haas Grotesk OTF files are bundled locally through the existing `@font-face` rules. No Google Fonts, system-font replacement, or Next font substitution was introduced. Font copies are byte-identical to `input/`.

## 12. Asset-path strategy

`src/assetPath.js` is the single build-time URL helper for public assets. It prefixes internal URLs for a configured subpath while leaving external URLs, hash links, mail links, and already-prefixed URLs unchanged. Next-bundled fonts follow `assetPrefix` automatically.

## 13. Three.js / GLB strategy

The approved `mogo-device.meshopt.glb` remains unchanged at `9,611,028` bytes. Technology initially renders the optimized static poster, starts proximity loading near the section, dynamically imports Three.js/GLTFLoader/Meshopt, and preserves fallback, disposal, 360° Y rotation, ±20° X clamp, inertia, keyboard/touch support, and reduced-motion behavior. Initial Hero network traces contain neither the GLB nor 3D-specific chunks.

## 14. Client-component boundaries

`app/layout.jsx`, route pages, `src/Site.jsx`, `src/site/Footer.jsx`, the design-system gallery, content models, asset helpers, form validation, and the shared design-system primitives remain server-compatible. Interactive section behavior is restricted to Header, Hero, How It Works, Technology, and Testimonial inside `InteractiveSections`; global browser behavior stays in `SiteRuntime`, cookie/modal, motion, Technology media/viewer, and GridOverlay client modules. Footer pointer depth is attached by the narrow runtime without making the footer a Client Component. Client Components are still prerendered into static HTML; browser APIs initialize only after mount.

## 15. `.nojekyll` generation

`scripts/finalize-static-export.mjs` runs after every build, safely prunes only audited stale copies inside `out/`, and writes an empty `out/.nojekyll`. The final artifact contains it.

## 16. Build result

`pnpm run build` completed with exit code 0 and generated `/`, `/_design-system`, and `/_not-found` as static routes. `out/` contains 93 files and `17,219,374` bytes. Two consecutive final unchanged-source exports were byte-identical (0 changed files). The previous optimized Vite artifact was `16,287,262` bytes, so the complete static artifact increased by `932,112` bytes (`5.72%`). The increase is primarily the fully prerendered design-system catalogue and App Router route payloads; the home-page client boundary was narrowed rather than expanded.

## 17. Test result

The framework-neutral Node test suite passes **107/107**. The top-level `pnpm test` gate also performs a real Next.js production build, finalizes the export, and validates every local HTML/CSS reference. The export verifier inspected 93 files, 6 HTML/CSS sources, and 214 references with zero missing targets, outside-base-path URLs, image-optimizer URLs, or forbidden stale paths. Coverage includes static export/config, `.nojekyll`, portable path containment, base-path URLs, image descriptors, How active+next delivery, the exact four modal triggers, motion contracts, accessibility, and lazy 3D behavior. TDD red/green evidence is preserved under `.site-builder/audits/nextjs-migration/`.

## 18. Responsive QA

The actual exported `out/` was tested at 1647, 1440, 1024, 768, and 390 pixels. Every width has one H1, loaded local fonts, unchanged section top/height geometry, zero horizontal overflow, zero broken loaded-source images, and zero clipped interactive controls. The two inactive How It Works placeholders intentionally have no `src` until their delivery turn and are not failed requests. Header/mobile navigation, modal geometry, Hero, How, Technology, testimonial, and footer remained intact.

## 19. Console/hydration result

The production static page reports no browser console entries, React error overlay, hydration warning, or uncaught runtime error after load and interactions. Initial server markup no longer reads browser storage, and `window`, observers, animation APIs, and WebGL stay behind client effects/guards.

## 20. Network/asset result

The plain static server returned 200 for `/`, `/_design-system/`, `_next` CSS/JS, WebP, local OTF, SVG, and GLB with correct MIME types; an unknown route returned the generated 404. Initial desktop and mobile traces requested How states 01+02 only and no GLB/Three runtime. The final observed desktop request set was 35 requests / `2,345,520` raw bytes with 23 image/SVG requests. The final-boundary mobile equivalent is `932,213` raw bytes with 20 image/SVG requests. In the comparable payload scope (HTML, entry CSS/JS, four local fonts, selected responsive rasters), projected Brotli delivery is `1,722,453` bytes desktop and `412,454` bytes mobile—`10.12%` and `14.63%` lower, respectively, than the optimized Vite baseline. Static hosting still needs compression enabled for those projected results.

## 21. Visual comparison

Vite baseline and Next captures were compared at all five widths. Section geometry, typography wrapping, image crops, responsive transitions, controls, and visual hierarchy match. Pixel MAE is 1.98–2.97; remaining differences are time-dependent motion/WebGL frames, especially a baseline Technology poster compared with a loaded approved GLB, not layout drift. Final DS audits pass: catalogue 0 errors/0 warnings, production 0 errors, comparison 0 missing/drifted keys or tokens. Motion QA passes 36/36 and typography QA 5/5.

## 22. Remaining risks before GitHub deployment

- Git/repository/Actions/Pages were intentionally not created. The future workflow must set the actual repository subpath through environment variables and publish `out/`.
- Set `NEXT_BUILD_ID` to the commit SHA in the future CI workflow to avoid a stable manifest URL across different releases.
- Keep hashed `_next` assets long-lived/immutable, HTML revalidated, Brotli/Gzip enabled, `.glb` served as `model/gltf-binary`, WebP/OTF MIME types correct, and the generated 404 retained. Details are in `docs/production-hosting-requirements.md`.
- The preorder form remains frontend-only by explicit scope; backend submission is a separate task.

## Explicit confirmations

- `input/` is unchanged: 38/38 file hashes match the pre-migration manifest.
- The design was not intentionally changed.
- Animations were not intentionally retimed.
- Current real-3D behavior and the approved Meshopt GLB were preserved.
- The existing image optimization pipeline was preserved; no `next/image` conversion occurred, and `images.unoptimized: true` is configured and tested.
- `pnpm test` and `pnpm run build` succeed; `out/` and `out/.nojekyll` are generated.
- The exported site works from a plain local static HTTP server.
- No server-runtime dependency is required after export.
- Git was not initialized and nothing was deployed.
- The project is ready for the separate Git initialization, GitHub repository, and GitHub Pages deployment step.
