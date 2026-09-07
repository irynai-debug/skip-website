# BirdPulse Reference Build Design

## Outcome

Replace the stale Samurai production page with a responsive BirdPulse landing page that reproduces the six ordered references in `input/1.png` through `input/6.png`. Preserve visible copy, use the supplied fonts, icons, logo, phone and background imagery, expose a live `/_design-system`, and keep the site usable from 320 CSS px upward.

## Architecture

Keep the existing Vite + React application and its two-route entry model. `/` renders six semantic section components in reference order; `/_design-system` renders the project-owned `Gallery`. Shared foundations and controls come only from `src/design-system/index.jsx` and `src/design-system/styles.css`. Reference-specific cards, waveform compositions, phone mockups and footer layout stay in the page layer until cross-section repetition proves promotion.

## Reference Queue

1. `hero` — full-bleed sunrise scene, navigation, display heading, store badges and supplied phone composite.
2. `community` — editorial intro and three metric columns.
3. `how-it-works` — three-step vertical process with supplied icon family and code-built audio/result UI.
4. `testimonials` — testimonial introduction, controls and one review card.
5. `download` — centered closing CTA, two store buttons and waveform composition.
6. `footer` — supplied footer background with four navigation groups and legal row.

The reference raster widths are not treated as authoritative CSS widths. Desktop calibration uses 1440 CSS px; 1024, 768, 390 and 320 are required responsive targets. The portrait third reference describes a tall desktop section, not a mobile-only page.

## Foundations

- Fonts: DM Sans for functional/editorial sans roles; Cormorant Garamond Italic only for the italic phrase in the community heading.
- Icon source: canonical SVG files copied from `input/` into production assets. No runtime imports from `input/`.
- Grid: 12/8/4 columns with 48/32/16 px margins, 24/24/16 px gutters and a 1344 px maximum content width.
- Content colors: dark navy ink, muted slate, periwinkle action, white/on-image ink, focus blue and error red.
- Section surfaces: white mist, periwinkle glow, sunrise hero and sunrise footer imagery.
- Spacing: the complete `XS/S/M/L/XL/2XL/3XL` scale remains authoritative for authored structural spacing.
- Controls: production `Button`, `TextLink`/navigation `Link`, `IconButton` and `Field`; store badges use a bounded `store` button variant because the same structure appears in the hero, closing CTA and footer.

## Content and Assets

Copy is transcribed verbatim from references. The visibly malformed line in reference 5 is interpreted as the intended sentence “Open BirdPulse, listen to the song, and know it in seconds.” and recorded as a provisional transcription rather than silently rewritten later.

Canonical input assets are copied unchanged to `public/assets/birdpulse/`. The testimonial portrait and the small Black-capped Chickadee image are screenshot-only photography, so they are generated as separate 2× production assets. No UI, logo, icon or entire section is rasterized from a reference.

## Motion

Mechanics are ported from the frozen motion sandbox: readiness staging, masked heading reveals, grouped vertical supporting-content reveals, bounded internal media parallax and reduced-motion settlement. Presentation values are calibrated to BirdPulse, but the behavior contract is not reinterpreted from prose. Additional decorative animation is excluded.

## Responsive Behaviour

Navigation collapses to the supplied menu icon below the content-driven threshold. Metric columns stack, the process alternates into a single reading column, testimonial card follows its intro, store actions stack on narrow phones, and footer groups become a two-column then single-column grid. Media stays inside the viewport; decorative waveforms may crop but never cause page overflow.

## Testing and QA

Unit tests lock the six-section order, exact high-value copy, asset paths and footer link order. Each section gets a 1440 px settled capture before and after design-system sync, recorded in `.site-builder/reference-fidelity.md`. Integration checks run after sections 2, 4 and 6. Each checkpoint runs the project-owned `DS_CONTRACT` audit and computed typography comparison. Final QA covers 1440/1024/768/390/320 plus breakpoint edges, keyboard focus, reduced motion, overflow, console/network errors and production build.

## Assumptions

- No CMS or external service is required.
- Store and navigation destinations are safe placeholder anchors because the references do not define live product URLs.
- Approval cadence is final, as explicitly requested; reversible visual ambiguity is recorded and implemented without additional pauses.

