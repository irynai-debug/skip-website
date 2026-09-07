# Next.js Static Export Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This project has no Git repository; checkpoint files replace commit steps because Git initialization is explicitly prohibited.

**Goal:** Migrate the approved SKIP / MO/GO site from Vite to a reproducible Next.js App Router static export without visual, responsive, behavioral, motion, accessibility, image-loading, or 3D drift.

**Architecture:** Build-time-rendered App Router shells own `/` and `/_design-system/`. Existing interactive sections remain narrowly scoped Client Components, while the site composition and static footer remain Server Components. Public asset URLs use one build-time base-path helper; a deterministic post-build finalizer writes `out/.nojekyll` and prunes only the existing audited stale output copies.

**Tech Stack:** Next.js 16, React 19, Three.js 0.185, App Router, static export, Node test runner, project-owned esbuild JSX loader, existing project-owned design system and QA primitives.

**Spec:** `docs/superpowers/specs/2026-09-06-nextjs-static-export-migration-design.md`

## Global Constraints

- Do not modify any file under `input/`.
- Do not initialize Git, create a remote repository, or deploy.
- Preserve all visible design, copy, layout, responsive behavior, animations, timings, interactions, and accessibility behavior.
- Preserve the current WebP `srcset` / `sizes` pipeline.
- Do not introduce `next/image`; nevertheless keep `images.unoptimized: true` in Next configuration and enforce it with a test.
- Keep the approved Meshopt GLB and current poster/fallback behavior.
- Use `output: 'export'`; the deployable artifact is `out/`.
- No request-time server features, API routes, Server Actions, middleware, or Node deployment runtime.
- Keep future GitHub Pages subpath configurable; never hardcode a repository name.
- Use red-green-refactor for every production behavior change.
- Run reference-fidelity before design-system audit, and run final design-system plus motion/accessibility gates before completion.

---

### Task 1: Freeze migration invariants and create failing export-contract tests

**Files:**
- Create: `tests/next-migration.test.mjs`
- Create: `.site-builder/captures/nextjs-migration/baseline/*.png`
- Create: `.site-builder/audits/nextjs-migration/input-before.sha256`
- Modify: `.site-builder/inputs.md`

**Interfaces:**
- Consumes: current Vite screenshots, `input/`, `src/siteContent.js`, `vite.config.js`
- Produces: assertions for `nextConfig`, `createAssetPath()`, `finalizeStaticExport()`, route files, client-boundary markers, exact modal triggers, image descriptors, and GLB lazy loading

- [ ] **Step 1: Persist the Vite baseline and input hash manifest**

Copy the already captured 1647/1440/1024/768/390 screenshots into the project migration baseline directory. Generate a sorted SHA-256 manifest with:

```powershell
Get-ChildItem input -Recurse -File |
  Sort-Object FullName |
  Get-FileHash -Algorithm SHA256 |
  ForEach-Object { "$($_.Hash.ToLower())  $($_.Path.Substring((Resolve-Path input).Path.Length + 1).Replace('\','/'))" }
```

Update `.site-builder/inputs.md` so every current input asset is inventoried without changing `input/`.

- [ ] **Step 2: Write one failing migration contract suite**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Next config is a GitHub-Pages-safe static export', async () => {
  const { default: nextConfig } = await import('../next.config.mjs')
  const resolved = typeof nextConfig === 'function' ? nextConfig('phase-production-build') : nextConfig
  assert.equal(resolved.output, 'export')
  assert.equal(resolved.trailingSlash, true)
  assert.equal(resolved.images.unoptimized, true)
})

test('App Router exposes the production and design-system routes', async () => {
  const page = await readFile(new URL('../app/page.jsx', import.meta.url), 'utf8')
  const catalogue = await readFile(new URL('../app/_design-system/page.jsx', import.meta.url), 'utf8')
  assert.match(page, /<Site/)
  assert.match(catalogue, /<Gallery/)
})

test('server composition is not promoted to a client component', async () => {
  const source = await readFile(new URL('../src/Site.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /^['"]use client['"]/)
})
```

Add separate tests that assert:

- `createAssetPath({ basePath: '/repo' })('/assets/x.webp') === '/repo/assets/x.webp'`;
- external URLs and `#hash` URLs remain unchanged;
- exactly four `data-preorder-trigger` values exist: header, hero, how-it-works, footer;
- Hero retains `fetchPriority="high"`, `loading="eager"`, `srcSet`, and `sizes`;
- How It Works retains active-plus-next source exposure;
- Technology still uses proximity loading and dynamic Three/GLTF/Meshopt imports;
- finalization creates `.nojekyll` and never edits its source fixture.

- [ ] **Step 3: Run the new suite and verify RED**

```powershell
node --test tests/next-migration.test.mjs
```

Expected: failures for missing `next.config.mjs`, `app/` routes, `createAssetPath`, and export finalizer.

- [ ] **Step 4: Record the red checkpoint**

Save the command, exit code, and expected failure reasons to `.site-builder/audits/nextjs-migration/tdd-red.md`.

---

### Task 2: Add the Next.js static-export toolchain and deterministic finalizer

**Files:**
- Create: `next.config.mjs`
- Create: `src/assetPath.js`
- Create: `scripts/finalize-static-export.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `tests/next-migration.test.mjs`

**Interfaces:**
- Produces: `normalizeBasePath(value): string`, `createAssetPath({ basePath }): (url) => string`, `assetPath(url): string`, `finalizeStaticExport(outputDirectory): Promise<void>`
- Consumes: `NEXT_PUBLIC_BASE_PATH`, optional `NEXT_PUBLIC_ASSET_PREFIX`

- [ ] **Step 1: Implement the base-path helper minimally**

```js
export function normalizeBasePath(value = '') {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '/') return ''
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

export function createAssetPath({ basePath = '' } = {}) {
  const prefix = normalizeBasePath(basePath)
  return (url) => {
    if (!url || /^(?:[a-z]+:|#|\/\/)/i.test(url)) return url
    const path = url.startsWith('/') ? url : `/${url}`
    return prefix && !path.startsWith(`${prefix}/`) ? `${prefix}${path}` : path
  }
}

export const assetPath = createAssetPath({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
})
```

- [ ] **Step 2: Implement the static-export config**

```js
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? '')
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim() || basePath || undefined

export default {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix,
  images: { unoptimized: true },
}
```

No `next/image` import is added.

- [ ] **Step 3: Implement deterministic export finalization**

Move the existing audited stale-path list and inside-root safety check into `scripts/finalize-static-export.mjs`. Export:

```js
export const STATIC_EXPORT_DIR = 'out'
export const STALE_PRODUCTION_PATHS = Object.freeze([
  '.site-builder',
  'assets/birdpulse',
  'assets/generated',
  'assets/skip/daniel-testimonial.png',
  'assets/skip/maya-testimonial.png',
  'assets/skip/michael-testimonial.png',
  'assets/skip/mogo-device.glb',
])
export async function finalizeStaticExport(outputDirectory = STATIC_EXPORT_DIR) {
  await pruneAuditedOutputCopies(outputDirectory)
  await writeFile(resolveInside(outputDirectory, '.nojekyll'), '', { flag: 'w' })
}
```

The script may mutate only the supplied output directory.

- [ ] **Step 4: Update the package toolchain**

Use:

```json
{
  "scripts": {
    "dev": "next dev --hostname 127.0.0.1",
    "build": "next build && node scripts/finalize-static-export.mjs",
    "test": "node --import tsx --test tests/*.test.mjs"
  },
  "dependencies": {
    "next": "16.3.4",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "three": "0.185.1"
  },
  "devDependencies": {
    "esbuild": "0.25.12",
    "vite": "8.2.1"
  }
}
```

Keep Vite temporarily for the old tests and baseline build until Task 6 passes.

- [ ] **Step 5: Install with pnpm and run the focused test GREEN**

```powershell
pnpm install
node --import ./tests/jsx-loader.mjs --test tests/next-migration.test.mjs
```

Expected: configuration, helper, and finalizer assertions pass; route assertions remain red until Task 3.

---

### Task 3: Create App Router routes and preserve narrow client boundaries

**Files:**
- Create: `app/layout.jsx`
- Create: `app/page.jsx`
- Create: `app/_design-system/page.jsx`
- Create: `app/not-found.jsx`
- Create: `src/site/InteractiveSections.jsx`
- Create: `src/site/SiteRuntime.jsx`
- Create: `src/site/Footer.jsx`
- Create: `src/design-system/GridOverlay.jsx`
- Modify: `src/Site.jsx`
- Modify: `src/design-system/index.jsx`
- Modify: `src/design-system/Gallery.jsx`
- Modify: `src/motion.jsx`
- Modify: `src/PreOrderModal.jsx`
- Modify: `src/CookieConsent.jsx`
- Modify: `src/TechnologyMedia.js`
- Modify: `src/TechnologyModelViewer.js`
- Test: `tests/next-migration.test.mjs`

**Interfaces:**
- `Site(): JSX.Element` is a Server Component.
- `InteractiveSections` exports Header, Hero, HowItWorks, Technology, Testimonial as Client Components with unchanged DOM/class contracts.
- `SiteRuntime(): JSX.Element` owns `useMotionEffects`, grid-query state, cookie consent, and one shared modal controller.
- Every modal opener emits only `data-preorder-trigger="header|hero|how-it-works|footer"`.

- [ ] **Step 1: Add the App Router shells**

```jsx
// app/layout.jsx
import '../src/design-system/styles.css'
import '../src/app.css'
import '../src/motion.css'
import '../src/design-system/gallery.css'

export const metadata = { title: 'Skip — MO/GO' }
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
```

```jsx
// app/page.jsx
import { Site } from '../src/Site.jsx'
export default function Page() { return <Site /> }
```

```jsx
// app/_design-system/page.jsx
import { Gallery } from '../../src/design-system/Gallery.jsx'
export default function DesignSystemPage() { return <Gallery /> }
```

- [ ] **Step 2: Extract interactive code without changing its markup**

Move the existing Header, Hero, HeroOutcomeMetrics, HowItWorks, Technology, and Testimonial implementations verbatim into a module beginning with `'use client'`. Remove only the `onPreOrder` prop plumbing; keep the same DS Button and add no new wrapper geometry.

- [ ] **Step 3: Create the single modal runtime**

```jsx
'use client'
export function SiteRuntime() {
  useMotionEffects()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  useEffect(() => {
    const onClick = (event) => {
      const trigger = event.target.closest('[data-preorder-trigger]')
      if (!trigger) return
      event.preventDefault()
      triggerRef.current = trigger
      setOpen(true)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return <>
    <GridOverlay visible={new URLSearchParams(window.location.search).has('grid')} />
    <CookieConsent />
    <PreOrderModal open={open} onRequestClose={() => setOpen(false)} returnFocusRef={triggerRef} backgroundImage={ASSETS.preorderModalBackground} />
  </>
}
```

Keep the existing modal close animation, focus trap, scroll lock, Escape handling, outside-click handling, and focus restoration untouched.

- [ ] **Step 4: Make the design-system entrypoint server-safe**

Move only `GridOverlay` and its resize hook to `src/design-system/GridOverlay.jsx` with `'use client'`. Keep Type, Container, PageGrid, Field, Button, Link, IconButton, IconLink, Divider, MetricRow, SiteHeader, and `DS_CONTRACT` in the shared server-safe entrypoint.

- [ ] **Step 5: Add explicit client directives only to browser-dependent modules**

Add `'use client'` to motion, cookie, modal, interactive sections, Technology media/viewer, and GridOverlay modules. Do not add it to `app/layout.jsx`, either route page, `src/Site.jsx`, site content, pure motion models, form validation, image-delivery logic, or the DS entrypoint.

- [ ] **Step 6: Run route and boundary tests GREEN**

```powershell
pnpm exec node --import tsx --test tests/next-migration.test.mjs
```

Expected: App routes, server composition, exact trigger count, and client-boundary assertions pass.

---

### Task 4: Make every production asset subpath-safe without changing delivery

**Files:**
- Create: `public/assets/skip/icons/*.svg`
- Create: `src/design-system/fonts/*.otf`
- Modify: `src/siteContent.js`
- Modify: `src/design-system/styles.css`
- Modify: `src/qaRuntime.js`
- Test: `tests/next-migration.test.mjs`
- Test: `tests/image-delivery.test.mjs`
- Test: `tests/site-content.test.mjs`

**Interfaces:**
- All public media descriptors are produced by `assetPath()`.
- Canonical SVGs and fonts are byte-identical project-owned copies of `input/`.

- [ ] **Step 1: Extend failing tests for descriptor preservation**

Assert exact width candidates and unchanged `sizes` strings for Hero, all four How states, Technology, modal, footer, and testimonials. Assert that applying `/repo` prefixes every URL in `src`, `srcSet`, and CSS `image-set`, but never duplicates the prefix.

- [ ] **Step 2: Copy canonical visual assets without transforming them**

Copy the existing SVGs byte-for-byte to `public/assets/skip/icons/` and the four OTF files byte-for-byte to `src/design-system/fonts/`. Add tests comparing SHA-256 hashes against `input/`.

- [ ] **Step 3: Route all public URLs through the helper**

Change `OPTIMIZED_ASSET_ROOT` to `assetPath('/assets/skip/optimized')`, replace `new URL('../input/...', import.meta.url)` with `assetPath('/assets/skip/icons/...')`, and prefix the Meshopt GLB. Do not alter candidates, width/height metadata, loading, decoding, or fetch priority.

- [ ] **Step 4: Keep fonts framework-bundled**

Point the four existing `@font-face src` values at `./fonts/<exact-name>.otf`. Keep family, weight, style, display, and all typography tokens unchanged.

- [ ] **Step 5: Make development QA imports base-path aware**

Use the same helper for runtime QA tool URLs with an explicit bundler-ignore comment. QA tools remain development-only and are pruned from `out/`.

- [ ] **Step 6: Run image/content tests GREEN**

```powershell
pnpm exec node --import tsx --test tests/next-migration.test.mjs tests/image-delivery.test.mjs tests/site-content.test.mjs
```

Expected: descriptors, active-plus-next delivery, exact asset bytes, and subpath transformations pass.

---

### Task 5: Remove Vite from the test harness while preserving behavioral coverage

**Files:**
- Modify: `tests/cookie-consent.test.mjs`
- Modify: `tests/image-delivery.test.mjs`
- Modify: `tests/motion-interactions.test.mjs`
- Modify: `tests/preorder-modal.test.mjs`
- Modify: `tests/technology-model-viewer.test.mjs`
- Modify: `tests/production-build.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Tests import JSX modules directly through the project-owned `esbuild` loader.
- Existing behavioral assertions and fake DOM harnesses stay unchanged.
- Production-build coverage invokes Next CLI/finalizer, never Vite APIs.

- [ ] **Step 1: Read the test quality reference before editing tests**

Read `superpowers/test-driven-development/writing-good-tests.md`; for every changed assertion identify the production regression that would make it fail.

- [ ] **Step 2: Replace one Vite SSR import and prove the harness**

Replace:

```js
const vite = await createServer(...)
const { CookieConsent } = await vite.ssrLoadModule('/src/CookieConsent.jsx')
```

with:

```js
const { CookieConsent } = await import('../src/CookieConsent.jsx')
```

Run only `cookie-consent.test.mjs`; verify the old command fails without Vite loading and the project-owned loader command passes.

- [ ] **Step 3: Migrate the remaining component tests**

Apply the same direct-import mechanism to modal, image, motion, Header, How, testimonial, and Technology tests. Preserve fake timers, requestAnimationFrame control, IntersectionObserver control, WebGL fallback assertions, and cleanup.

- [ ] **Step 4: Replace the Vite production-build test**

Test the pure finalizer on temporary output and statically verify Next config/scripts. Keep the expensive two-real-build reproducibility check in a dedicated `scripts/verify-next-export.mjs` command run during the final gate rather than spawning concurrent framework builds inside the unit suite.

- [ ] **Step 5: Remove Vite from dependencies**

Only after every test imports through the project-owned JSX loader, remove `vite` from `devDependencies` and update `pnpm-lock.yaml`.

- [ ] **Step 6: Run the full automated suite**

```powershell
pnpm test
```

Expected: every migrated legacy test plus migration tests passes with no unhandled rejection or warning.

---

### Task 6: Prove the static export and remove obsolete Vite entry files

**Files:**
- Create: `scripts/verify-next-export.mjs`
- Modify: `tests/production-build.test.mjs`
- Delete after the gate: `index.html`
- Delete after the gate: `src/main.jsx`
- Delete after the gate: `src/App.jsx`
- Delete after the gate: `vite.config.js`
- Create: `.site-builder/audits/nextjs-migration/build-verification.json`

**Interfaces:**
- `verify-next-export.mjs` runs two clean builds sequentially, records sorted manifests, compares reproducible files, verifies required routes/assets, and verifies source hashes.

- [ ] **Step 1: Run the first production build**

```powershell
npm run build
```

Verify:

```text
out/index.html
out/_design-system/index.html
out/404.html
out/.nojekyll
out/_next/
out/assets/skip/mogo-device.meshopt.glb
```

Also verify the audited stale paths are absent.

- [ ] **Step 2: Validate static HTML and asset references**

Parse every exported HTML/CSS file, collect local `src`, `srcset`, `href`, CSS `url()`, and framework chunk references, and assert that each maps to a file in `out/`. Assert no `/_next/image` runtime URL exists.

- [ ] **Step 3: Run a configured-subpath build**

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/skip-preview'
$env:NEXT_PUBLIC_ASSET_PREFIX='/skip-preview'
npm run build
Remove-Item Env:NEXT_PUBLIC_BASE_PATH
Remove-Item Env:NEXT_PUBLIC_ASSET_PREFIX
```

Assert exported route and public asset references use `/skip-preview/`; assert no source contains a repository name.

- [ ] **Step 4: Run two clean default builds and compare**

The verifier hashes `input/` and `public/` before/after, runs two sequential default builds, and compares sorted output manifests. Any known framework metadata that is content-equivalent but timestamped must be explicitly excluded by exact path with a recorded reason; application HTML, CSS, JS, fonts, images, and GLB may not be excluded.

- [ ] **Step 5: Remove obsolete Vite files only after Steps 1–4 pass**

Delete the four obsolete entry/config files with patch-based deletion. Confirm no source/test/package reference to Vite remains:

```powershell
rg -n "vite|import\.meta\.env|createRoot\(" app src tests package.json pnpm-lock.yaml
```

- [ ] **Step 6: Re-run build and tests after cleanup**

```powershell
pnpm test
npm run build
```

Expected: both pass and `out/` remains complete.

---

### Task 7: Browser QA, visual regression, system audits, and handoff report

**Files:**
- Create: `.site-builder/captures/nextjs-migration/final/page-1647.png`
- Create: `.site-builder/captures/nextjs-migration/final/page-1440.png`
- Create: `.site-builder/captures/nextjs-migration/final/page-1024.png`
- Create: `.site-builder/captures/nextjs-migration/final/page-768.png`
- Create: `.site-builder/captures/nextjs-migration/final/page-390.png`
- Create: `.site-builder/audits/nextjs-migration/browser-qa.json`
- Create: `.site-builder/audits/nextjs-migration/visual-regression.md`
- Create: `.site-builder/audits/nextjs-migration/design-system-audit.json`
- Create: `.site-builder/audits/nextjs-migration/motion-audit.json`
- Create: `docs/nextjs-migration-report.md`

**Interfaces:**
- Consumes: Vite baseline screenshots and metrics, Next `out/`, project-owned DS contract, motion manifest and QA primitives
- Produces: final evidence and before/after report

- [ ] **Step 1: Serve only the static export**

Start a plain local static server rooted at `out/`. Do not use `next start` or any server runtime.

- [ ] **Step 2: Verify routes and network behavior**

Open `/` and `/_design-system/`. Confirm 200 responses, no console errors/warnings, no hydration mismatch, no missing assets, no `/_next/image`, Hero priority images present, How Step 01 + Step 02 only initially, and Three/GLB absent until Technology approaches the viewport.

- [ ] **Step 3: Verify all interactive behavior**

Explicitly verify:

- Header PRE-ORDER, Hero RESERVE YOUR SPOT, How It Works RESERVE YOUR SPOT, Footer RESERVE YOUR SPOT all open the same dialog;
- modal Escape, overlay click, close button, focus trap, focus return, validation, and scroll lock;
- How It Works continuous active-step progression and pause/resume;
- Hero counters and all approved motion timings;
- sticky/compact header state machine;
- Technology poster-to-GLB lazy transition, drag limits, touch behavior, and failure fallback;
- testimonial forward/reverse infinite loop;
- cookie persistence;
- social links, hover/focus, and external-tab attributes;
- reduced-motion behavior.

- [ ] **Step 4: Capture and compare all required widths**

At 1647×920, 1440×920, 1024×920, 768×920, and 390×920, wait for fonts/assets and settled QA state, then capture the full page. Compare against the matching Vite baseline by section for geometry, crop, typography, line breaks, and visual hierarchy. Record no horizontal overflow, clipped text, distorted image, scrollbar, layout shift, or breakpoint drift.

- [ ] **Step 5: Run reference-fidelity and final design-system audits**

Run the project-owned catalogue and production audit at 1440 and 390 using the same `DS_CONTRACT`, then compare reports. Record grid geometry and authored spacing audits. Run motion smoke and interaction/accessibility audits. Save evidence and update `.site-builder/reference-fidelity.md` only with observed results.

- [ ] **Step 6: Verify production metrics and input immutability**

Report before/after artifact bytes, initial desktop/mobile payload, image requests, GLB bytes, build status, test count, and route files. Compare the final `input/` manifest byte-for-byte with Task 1.

- [ ] **Step 7: Write the migration handoff**

`docs/nextjs-migration-report.md` must explicitly cover the 22 requested areas from the user brief, including framework version, route architecture, client boundaries, static-export constraints, asset/basePath strategy, `images.unoptimized`, preserved image pipeline, lazy 3D behavior, test migration, build reproducibility, five-width visual QA, functional QA, artifact metrics, removed Vite files, input immutability, Git/deployment non-actions, remaining risks, and future GitHub Pages cache/compression/404 requirements.

- [ ] **Step 8: Final verification-before-completion gate**

Invoke `superpowers:verification-before-completion`, run fresh `pnpm test`, fresh `npm run build`, inspect `out/`, and re-open the exported main and design-system routes before claiming completion.
