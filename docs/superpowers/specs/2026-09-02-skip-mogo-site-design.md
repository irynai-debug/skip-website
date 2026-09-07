# Skip MO/GO reference-build design

Date: 2026-09-02

## Scope and evidence

Build one React/Vite landing page at `/` plus a live production catalogue at `/_design-system`. The numbered queue is `input/1.png` through `input/5.png`; the base CSS viewport is 1448px because each screenshot is a 2x capture and `hero-background.png` is the canonical 1448x1086 scene. Supporting raster, SVG, and OTF assets remain read-only in `input/` and are imported by Vite or represented by the generated project-owned testimonial portrait.

The screenshot order is: hero, how it works, technology, testimonial, footer. Visible copy, casing, explicit line breaks, em dashes, and the reference's line widths are authoritative. No CMS or external API is needed.

## Visual direction

Performance editorial for alpine mobility: deep navy, bright lime, cool pale blue, high-contrast white, oversized Neue Haas Grotesk display type, restrained surfaces, and technical connector diagrams. Design dials are variance 6/10, motion 5/10, density 4/10. The reference overrides generic glass, luxury-serif, and dashboard patterns.

## Production design system

Before the first section, replace the stale project source with a project-owned copy of the provided code-first starter. Its calibrated three-layer tokens are the only production source. Required typography roles are exactly `display`, `h1`, `h2`, `h3`, `body-large`, `body`, `label`, `number-small`, `number-large`, and `button`; the starter's mandatory audit aliases remain mapped to these values for compatibility. Repeated buttons, links, nav, icon buttons, arrows, dividers, metric rows, and footer links are production exports and appear in the live gallery.

Grid tokens: 12 columns / 48px rails / 24px gutters on desktop; 8 / 32 / 24 on tablet; 4 / 16 / 16 on mobile; 1352px max content. Spacing is restricted to the starter XS–3XL scale and token-based combinations. Project colors are ink `#071421`, lime `#d9ff00`, pale blue `#eaf6fb`, surface `#ffffff`, muted `#afa7a3`, and visible focus lime on dark / ink on light.

## Page structure

1. Hero: sticky near-fullscreen alpine scene with header, display headline, support copy, product metrics, CTA, and two outcome metrics.
2. How it works: split media/instruction layout using `2-block-image.png`, callout labels, four numbered steps, and two system buttons.
3. Technology: dark product stage using `3-block-image.png`, six provided feature icons, and lime connector lines that collapse into a readable stacked mobile layout.
4. Testimonial: pale surface, generated standalone Daniel portrait, exact quote, and shared arrow controls.
5. Footer: photographic closing scene, exact CTA, navigation groups, logo, copyright, and supplied social SVGs.

## Responsive behavior

Desktop preserves the 1448 reference composition. At 1024 the hero/header compress, split sections become balanced grid layouts, and feature callouts move closer to the media. At 768 navigation becomes a compact labelled menu, the how-it-works split stacks, and technology becomes a two-column feature list below the product. At 390 all content is one column, image focal points remain intentional, controls remain at least 44px, line breaks are selectively preserved only when they do not clip, and there is no horizontal overflow.

## Motion and accessibility

Mechanically port the accepted motion runtime from `instructions/reference/motion-sandbox/source`: staged `motion-ready` startup, one observer per section, line-mask headings, grouped copy/block reveals, the `hero/dormant/hidden/compact` header state machine, allowed media parallax, and reduced-motion/mobile fallbacks. Adapt only presentation and boundary target. Use semantic landmarks/headings/lists, meaningful image alternatives, decorative SVGs hidden from assistive tech, visible focus, keyboard-operable controls, stable hit areas, and no content hidden when JavaScript is unavailable.

## Acceptance

Each section gets a fidelity report before implementation closes. Run design-system audits after sections 1–2, sections 3–4, and at final after section 5. Final QA covers 1448, 1440, 1024, 768, and 390; checks exact copy, responsive interpolation, overflow, text clipping, image distortion, layout shift, keyboard/focus, reduced motion, console, live catalogue, and motion smoke test.
