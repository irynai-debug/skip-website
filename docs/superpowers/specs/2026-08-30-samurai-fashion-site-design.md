# Samurai Fashion Reference Build — Design Specification

## Goal

Replace the stale neuroscience implementation with one responsive Samurai fashion landing page that follows `input/1.png` through `input/6.png` in numeric order, preserves all readable copy, exposes a live `/_design-system`, and passes independent reference-fidelity and design-system gates.

## Authority and ownership

- `instructions/` and `input/` remain read-only.
- Section composition, crop, distinctive surfaces, and decoration follow the screenshots.
- `src/design-system/` is a fresh project-owned copy of the supplied code-first starter and is the only production source for tokens, typography, `Button`, `Link`, `IconButton`, `Field`, layout primitives, and `DS_CONTRACT`.
- `/_design-system` imports the project-owned `Gallery`; it does not duplicate production styles.
- Screenshot-only fashion imagery is regenerated as separate project assets rather than cropped from screenshots.

## Architecture

The existing Vite + React application remains in place. `src/siteContent.js` owns ordered, exact copy and asset metadata. `src/Site.jsx` composes six semantic sections from that data and imports all shared UI through `src/design-system/index.jsx`. `src/app.css` owns only section-specific layout and art direction. `src/motion.jsx` ports the mechanics from the frozen motion sandbox and is verified by the project-owned smoke primitive.

Routes are `/` for production and `/_design-system` for the live catalogue. A `?grid` query switch renders `GridOverlay` from the same tokenized grid source.

## Sections

1. Hero/shop: black navigation, hero copy, product callouts, generated kimono model, accuracy card.
2. Featured products: asymmetric editorial grid with one large generated model image, two product cutouts, and collection links.
3. Natural fabrics wordmark: oversized code-rendered Latin/Japanese text.
4. About: red/black photographic field, clipped manifesto copy, generated armored samurai, oversized bottom title.
5. Social: centered multiline social statement with Font Awesome brand icons.
6. Contact/footer: dark CTA, navigation, contact facts, canonical Font Awesome payment marks, and copyright.

## Responsive model

Desktop uses the starter 12-column grid with a 1422-reference calibration inside the default 1440 CSS target. Tablet switches to 8 columns at 1024px and mobile to 4 columns at 767px. Mobile preserves reading order, converts wide editorial compositions to deliberate stacks, keeps imagery in bounded crops, and eliminates horizontal overflow at 320px.

## Typography and assets

Neue Machina is the editorial/display family; DM Sans is the functional/body family. All supplied faces are copied to `public/assets/fonts/`. Font Awesome remains the single icon family. Generated raster assets are stored in `public/assets/generated/` with intrinsic dimensions and descriptive `alt` text where meaningful.

## Motion

Only accepted families are used: masked heading reveal, grouped vertical slide reveal, inner-media parallax, stable interaction states, and reduced-motion fallbacks. Mechanics are copied from `instructions/reference/motion-sandbox/source`, while selectors and presentation are adapted to Samurai sections.

## QA and acceptance

Every section receives a 1422px settled capture and evidence in `.site-builder/reference-fidelity.md` before and after design-system synchronization. Integration and `DS_CONTRACT` audits run after sections 2, 4, and 6 and again before final handoff. Final checks cover 1440, 1024, 768, 640, 390, and 320px; fonts/images readiness; keyboard/focus; reduced motion; console/network errors; spacing-source ownership; grid geometry; production build; and live catalogue parity.

No CMS, public external write, or third-party service is introduced.
