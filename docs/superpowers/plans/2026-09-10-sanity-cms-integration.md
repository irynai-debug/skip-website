# Sanity CMS Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sanity the single production editorial source for the SKIP / MO/GO static website, deploy its standalone Studio, and rebuild GitHub Pages automatically after published changes.

**Architecture:** A standalone Sanity Studio owns one `siteContent` singleton. A Node-only `@sanity/client` command queries and normalizes the published document into a checked-in runtime snapshot before CI builds; existing components consume that snapshot without browser-side CMS requests. `src/content.json` remains fallback-only and GitHub `repository_dispatch` connects Sanity publishing to the static-export workflow.

**Tech Stack:** Next.js 16 static export, React 19, Sanity Studio, `@sanity/client`, GROQ, GitHub Actions, pnpm, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-10-sanity-cms-integration-design.md`

## Global Constraints

- Preserve visual design, responsive behavior, motion, image delivery, GLB, modal behavior, and GitHub Pages export.
- Use organization `ohpo8citj`, existing project `skip-website`, dataset `production`.
- Create Studio at `C:\Users\user\Desktop\Skip\skip-website-studio`.
- Keep `src/content.json` as emergency fallback and disable Pages CMS.
- Keep technical asset paths and GLB code-owned; use native Sanity image fields for editable images.
- Never expose private credentials in source, logs, generated HTML, or client bundles.
- Do not commit or push.

---

### Task 1: Scaffold and bind Studio

**Files:** Create the standard clean TypeScript Studio under `C:\Users\user\Desktop\Skip\skip-website-studio`.

**Produces:** Studio configuration bound to the discovered public project ID and `production` dataset.

- [ ] Verify Node >=22.12 and run `pnpm dlx sanity@latest projects list`; select the existing `skip-website` project in organization `ohpo8citj`.
- [ ] Run `pnpm create sanity@latest --dataset production --template clean --typescript --output-path C:\Users\user\Desktop\Skip\skip-website-studio` (the supported pnpm equivalent because npm/npx are absent in this runtime).
- [ ] Do not create a second Sanity project or dataset.
- [ ] Run `pnpm exec sanity debug` in Studio and verify project/dataset binding.
- [ ] Confirm no token or real `.env*` value is tracked. Do not commit.

### Task 2: Define schema, singleton structure, and seed

**Files:**
- Create: `schemaTypes/siteContent.ts`, `structure.ts`, `scripts/seed-content.mjs`, `tests/schema-contract.test.mjs`
- Modify: `schemaTypes/index.ts`, `sanity.config.ts`

**Produces:** Native Sanity schema matching all eleven top-level `content.json` sections and one published document ID `siteContent`.

- [ ] Write a failing test asserting the exact top-level field names, singleton ID, and native `image` types for Technology/testimonials.
- [ ] Run `node --test tests/schema-contract.test.mjs`; verify RED because the schema is missing.
- [ ] Implement required nested fields, `text` for multiline copy, ordered object arrays, and `defineField({name:'image',type:'image',options:{hotspot:true}})`.
- [ ] Prevent duplicate singleton creation through the Studio structure/template actions.
- [ ] Run the test and `pnpm run build`; verify GREEN.
- [ ] Implement an idempotent seed script that refuses an existing document without `--replace`, uploads the four current images, assigns stable `_key` values, and calls `createOrReplace`.
- [ ] Run the seed with `sanity exec --with-user-token`; query `_id == "siteContent"` and verify three testimonials and four image references.

### Task 3: Add the build-time Sanity adapter

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/sanity/config.js`, `src/sanity/query.js`, `src/sanity/normalizeContent.js`, `scripts/sync-sanity-content.mjs`, `src/generated/content.json`, `.env.example`
- Test: `tests/sanity-content.test.mjs`

**Produces:** `normalizeSanityContent(remote, fallback, options)` plus atomic snapshot synchronization.

- [ ] Install `@sanity/client`; do not add `next-sanity` because there is no embedded Studio, preview mode, or runtime query.
- [ ] Write failing tests for valid normalization, CDN image URLs, missing-image fallback, invalid strict content, and GROQ image dereferencing.
- [ ] Run `node --test tests/sanity-content.test.mjs`; verify RED.
- [ ] Implement a Node-only client with `useCdn:false`, pinned API date, published singleton query, and exact editorial-key normalization.
- [ ] Validate required strings/objects and array counts used by fixed compositions.
- [ ] Write through `src/generated/content.json.tmp`, parse it, then atomically rename; strict mode fails and ordinary mode preserves the last valid snapshot.
- [ ] Add safe public placeholders for `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_API_VERSION`; add no token.
- [ ] Run adapter tests and `pnpm run content:sync -- --strict`; verify the snapshot matches Sanity.

### Task 4: Switch production imports to the snapshot

**Files:** Modify all eleven current `content.json` consumers in `app/` and `src/`, plus relevant tests.

**Produces:** Existing UI sourced from the Sanity-backed snapshot with unchanged component behavior.

- [ ] Extend the boundary test to require zero production imports of fallback `content.json` and to verify Sanity CDN replacements do not inherit stale local `srcSet`.
- [ ] Run targeted content tests; verify RED.
- [ ] Replace only the import paths with `src/generated/content.json`; do not change JSX, CSS, state, motion, responsive behavior, modal controls, asset descriptors, or GLB loading.
- [ ] Run Sanity, content-source, site-content, image-delivery, and technology-viewer tests; verify GREEN.

### Task 5: Rebuild GitHub Pages and retire Pages CMS

**Files:** Modify `.github/workflows/deploy.yml`; delete `.pages.yml`; update ignored `.site-builder/project.yaml`; extend `tests/sanity-content.test.mjs`.

- [ ] Write failing assertions for `repository_dispatch`, event `sanity-content-updated`, strict sync before build, and absence of `.pages.yml`.
- [ ] Run the test; verify RED.
- [ ] Add the dispatch trigger and `pnpm run content:sync -- --strict` after install while preserving existing Pages permissions, base path, artifact, and jobs.
- [ ] Remove `.pages.yml`, keep `public/uploads/`, and record Sanity provider/dataset/snapshot/event in project state.
- [ ] Run workflow/config tests; verify GREEN.

### Task 6: Deploy Studio and configure webhook

**Files:** Create `C:\Users\user\Desktop\Skip\skip-website-studio\WEBHOOK_SETUP.md`; allow CLI to update `sanity.cli.ts`.

- [ ] Run Studio tests/build and `pnpm exec sanity deploy`; prefer `skip-website.sanity.studio`, falling back to `skip-mogo-website.sanity.studio` only if unavailable.
- [ ] Configure POST webhook to `https://api.github.com/repos/irynai-debug/skip-website/dispatches`, dataset `production`, filter `_type == "siteContent" && _id == "siteContent"`, drafts/versions disabled.
- [ ] Use projection `{"event_type":"sanity-content-updated","client_payload":{"documentId":_id,"updatedAt":_updatedAt}}` and headers `Accept: application/vnd.github+json` plus `Authorization: Bearer <fine-grained token>`.
- [ ] At the credential boundary, have the user enter the repository-scoped token directly in Sanity Manage; never paste or print it.
- [ ] Publish a harmless reversible change, verify webhook HTTP 204 and a GitHub Actions run, then restore content.
- [ ] Document Studio URL, editing flow, recovery dispatch, and token rotation without the token.

### Task 7: Production and browser QA

- [ ] Run strict content sync, `pnpm test`, export verification, `git diff --check`, Studio schema tests, and Studio build.
- [ ] Browser QA at 1440 and 390: published copy, three testimonial images/carousel, Technology poster/3D, Hero/How responsive images, four modal triggers, cookie consent, navigation/footer, overflow, and console errors.
- [ ] Run project-state validation and the existing design-system audit; record that no visual contract changed.
- [ ] Confirm branch `main`, inspect both file trees, scan for secrets, and do not commit/push.
- [ ] Hand off Studio URL, editing instructions, project/dataset IDs, webhook status, verification results, and changed files.
