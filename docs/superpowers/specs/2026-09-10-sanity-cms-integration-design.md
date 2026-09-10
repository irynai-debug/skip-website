# Sanity CMS Integration Design

## Goal

Make Sanity the single editorial source for the existing SKIP / MO/GO static website while preserving its current visual design, responsive behavior, motion, image delivery, 3D model, modal behavior, and GitHub Pages static export.

The existing `src/content.json` remains a read-only emergency fallback. Pages CMS is disabled so editors cannot unknowingly update a second source that production ignores.

## Constraints

- Reuse the existing Sanity organization `ohpo8citj`, project named `skip-website`, and dataset `production`.
- Create a standalone Studio next to the website at `C:\Users\user\Desktop\Skip\skip-website-studio`.
- Deploy the Studio with Sanity hosting, preferring `https://skip-website.sanity.studio` when that hostname is available.
- Keep the website as a Next.js static export compatible with GitHub Pages.
- Keep current image optimization descriptors, static technology fallback behavior, and the GLB model unchanged.
- Do not expose write tokens or GitHub credentials to client bundles, tracked files, logs, or generated HTML.
- Do not commit or push changes; the repository owner will review and publish them.

## Content Model

The Studio exposes one singleton document named `siteContent`. It contains semantic nested objects matching the current editorial shape:

- `site`
- `navigation`
- `cta`
- `hero`
- `howItWorks`
- `technology`
- `testimonials`
- `footer`
- `cookieConsent`
- `preOrderModal`
- `notFound`

Arrays keep their existing order. Required fields receive schema validation. Multiline copy remains plain text so authored casing and line breaks are preserved.

`technology.image` and every `testimonials.items[].image` use the native Sanity `image` type with hotspot support. Existing `imageAlt` or product-description fields remain the accessible text source. The initial content migration uploads the four current production images as Sanity image assets and creates one published `siteContent` document.

Technical values do not enter Sanity: responsive asset generation, `srcset`, dimensions, local asset roots, the GLB URL, motion timing, destinations, component geometry, and build settings remain code-owned.

## Website Data Boundary

The website uses `@sanity/client` only in a Node build-time synchronization script. The client requests the published singleton with one GROQ query and expands image references to CDN URLs.

```text
Sanity Content Lake
        ↓ published GROQ query
build-time sync + validation/normalization
        ↓
src/generated/content.json
        ↓
existing components and siteContent.js
```

All modules that currently import `src/content.json` instead import the generated normalized snapshot. This keeps the existing component interfaces and derived content constants stable, including `InteractiveSections.jsx` and its testimonial carousel.

The sync script validates the fetched object against the current fallback structure before replacing the generated snapshot. It writes atomically so an interrupted request cannot leave partial JSON.

The checked-in generated snapshot initially matches `src/content.json`, allowing offline local builds. The CI workflow runs synchronization in strict mode before `next build`; a missing or invalid published Sanity document fails the deployment instead of silently shipping stale content. Local development can explicitly synchronize and otherwise retains the last valid snapshot.

## Image Handling

Sanity image references are projected to normal CDN URLs at the adapter boundary. Existing UI components continue to receive an image source string.

- Existing local optimized image paths retain their current responsive `srcset` descriptors.
- Sanity CDN image URLs are treated as editorial replacements and do not inherit stale local `srcset` candidates.
- Width and height contracts remain the current layout dimensions to prevent layout shift.
- Hero and How It Works responsive pipelines are unchanged.
- The technology GLB model and its loading behavior are unchanged.

## Studio Project

The sibling Studio uses the current supported Sanity Studio toolchain, TypeScript, the Structure Tool, and a project-local schema. Its CLI and runtime configuration contain the public Sanity project ID discovered from the existing `skip-website` project and dataset `production`.

The desk structure exposes only the `Site content` singleton as the primary editing surface and prevents accidental creation of duplicate singleton documents. The Studio is built and deployed through `npx sanity@latest deploy` after schema and content migration verification.

## GitHub Pages Publishing

The existing `.github/workflows/deploy.yml` adds two triggers:

- `repository_dispatch` with event type `sanity-content-updated` for automatic publishing;
- the existing `workflow_dispatch` remains available as a manual recovery path.

The Sanity webhook runs only for published changes to the `siteContent` document. Draft keystrokes and versions do not trigger builds. Its GROQ projection produces GitHub's required payload:

```json
{
  "event_type": "sanity-content-updated",
  "client_payload": {
    "documentId": "siteContent",
    "updatedAt": "<published timestamp>"
  }
}
```

The webhook calls `https://api.github.com/repos/irynai-debug/skip-website/dispatches` with a fine-grained GitHub token limited to that repository and `Contents: write`. The token is configured only in Sanity's protected webhook header settings. Creating or entering that token is a one-time user-authorized credential step and is never performed through source files.

## Failure Behavior

- Missing local network access: ordinary local builds use the last valid generated snapshot.
- Missing Sanity configuration in local development: the sync command explains which public configuration value is absent without printing secrets.
- Missing or invalid production content in CI: strict sync fails before static export.
- Missing Sanity image: normalization keeps the corresponding checked-in fallback image.
- Sanity API or webhook outage: the existing site stays online; `workflow_dispatch` provides a recovery publish path.
- Studio deployment authentication or hostname conflict: pause at the exact CLI prompt and request only the required user action.

## Security

- Sanity project ID and dataset name are public configuration.
- Public dataset reads require no browser token.
- Any private-dataset read token is server/build-only and stored as a GitHub Actions secret.
- GitHub dispatch credentials never enter the website or Studio repository.
- `.env.example` contains names and safe placeholders only; real `.env*` files remain ignored.

## Verification

1. Schema validates and Studio builds locally.
2. Initial `siteContent` document contains all current visible content and four native Sanity image references.
3. Sanity GROQ output normalizes to the same shape as the current website contract.
4. A testimonial image from Sanity renders without a crash or stale local `srcset`.
5. Website unit tests cover local fallback, successful remote normalization, invalid remote data, and image projection.
6. `pnpm run build` and static-export verification pass with the synchronized snapshot.
7. Browser QA checks desktop and mobile layout, testimonials, Technology fallback/3D replacement, modal, motion, and console errors.
8. Studio deploy returns a working `*.sanity.studio` URL.
9. A published Sanity change successfully triggers the GitHub workflow after the webhook credential is configured.

## Non-goals

- No visual redesign or component API redesign.
- No live preview or draft mode in this pass.
- No runtime content fetching in the visitor's browser.
- No changes to the GLB model, responsive image generation, motion contracts, form submission, or analytics.
- No localization, scheduling, or additional page types.
