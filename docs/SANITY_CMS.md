# Sanity CMS integration

Sanity is the production editorial source for the SKIP / MO/GO website. The static site does not query Sanity in the browser.

- Studio: <https://skip-website.sanity.studio/>
- Project: `skip-website` (`3g1ua4nm`)
- Dataset: `production`

## Data flow

1. An editor publishes the singleton `siteContent` document in Sanity Studio.
2. A Sanity webhook sends the `sanity-content-updated` repository dispatch event.
3. GitHub Actions runs `pnpm run content:sync -- --strict`.
4. The sync validates published content and writes `src/generated/content.json` atomically.
5. Next.js creates the GitHub Pages static export from that snapshot.

`src/content.json` is retained only as an offline/emergency fallback. Production modules import `src/generated/content.json`.

## Local commands

```powershell
pnpm run content:sync
pnpm run build
```

The approved public project ID and dataset are built-in defaults. `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_READ_TOKEN` remain optional local overrides. Real `.env*` values are ignored by git.

## Editing content

Open the deployed Studio, choose **Website content**, edit a section, and press **Publish**. Images under Technology and Testimonials are normal Sanity image controls: editors can upload or replace media without knowing file paths.

Technical assets remain code-owned, including the Hero/How responsive image pipeline, fonts, icons, and the GLB model.
