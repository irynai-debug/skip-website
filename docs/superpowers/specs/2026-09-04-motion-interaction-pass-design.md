# SKIP / MO/GO Motion and Interaction Pass — Design Specification

**Date:** 2026-09-04  
**Status:** Approved architecture; implementation pending  
**Scope:** Motion and interaction only. Existing static layout, typography, colors, spacing, content, component dimensions, section heights, image crops, responsive structure, CTA appearance, modal behavior, and Technology GLB presentation remain unchanged unless this document explicitly says otherwise.

## 1. Goals and constraints

The pass should make the existing site feel controlled, physical, and premium without turning motion into a competing visual layer. It must not redesign the page or cause layout reflow. Production animation will use the existing React stack plus browser-native CSS, `IntersectionObserver`, and `requestAnimationFrame`; no animation dependency will be added.

All motion will be expressed through composited or non-layout properties where possible: `transform`, `opacity`, restrained `filter`, SVG stroke offsets, and numeric text updates. Containers retain their current dimensions. `input/` and `instructions/` remain read-only. New responsive derivatives of supplied source assets will be project-owned production files outside `input/`.

## 2. Shared motion system

The project-owned design system remains the single production source. Motion values will be added to it as semantic tokens rather than scattered literals:

- fast feedback: 160–220ms;
- standard UI state: 240–320ms;
- content entrance: 450–650ms;
- image/media entrance: 600–800ms;
- stagger: 60–110ms, with Technology benefit units allowed 100–140ms;
- primary easing: `cubic-bezier(0.22, 1, 0.36, 1)`.

One shared motion controller will manage section visibility, one-time entrance states, pointer capability, reduced-motion state, and requestAnimationFrame lifecycle. Component-owned state remains local where it already models real UI behavior, such as How It Works steps, the Technology viewer, and the testimonial carousel.

Section entrances trigger when roughly 18–20% of a section becomes visible, satisfying the requested 15–25% range. One-time entrances are not replayed after minor scrolling. Repeating behavior such as the How It Works cycle pauses while its section is outside the viewport and resumes without resetting on small threshold crossings.

## 3. Header behavior

The existing header content and click behavior remain intact. Its state machine becomes:

1. On initial load, the hero header enters from slightly above while fading in over approximately 600ms.
2. Meaningful downward scrolling hides it upward.
3. Meaningful upward scrolling reveals a compact, full-width, dark sticky bar at the top.
4. Direction thresholds and hysteresis prevent flicker or rapid state changes caused by tiny scroll deltas.

The compact state reuses the same logo, navigation, basket, and Pre-Order control. It changes vertical density and surface treatment only; it does not become a short centered pill. Because the header is overlay/fixed UI, state changes will not shift document layout.

## 4. Hero motion

The Hero visual becomes two composited production layers built from the supplied sources:

- `hero-sky-background.png` as the slow, slightly oversized background layer;
- `hero-foreground.png` as the transparent person-and-ground foreground layer;
- the current flattened image retained as loading/error fallback.

Responsive WebP copies will be generated outside `input/` using the existing image-delivery conventions. Intrinsic dimensions, `srcset`, and `sizes` will be declared to prevent layout shift. The sky layer will be rendered around 102–104% scale so its maximum pointer displacement never exposes edges.

On hover-capable desktop devices, pointer position is normalized within the Hero and eased through a requestAnimationFrame loop. The sky moves at most about 12–18px horizontally and 6–10px vertically. The foreground reacts at only 0–3px. Both return smoothly to rest on pointer leave. Touch and reduced-motion modes keep both layers static.

Hero content enters once in this order: heading, supporting text, right-side specifications, lower-left copy and CTA, then lower-right outcomes. Each group starts 18–28px high, transparent, and lightly blurred, then resolves over 500–650ms with a 70–100ms stagger. Specification rows use the same language with an 80–100ms row stagger.

The `30%` and `2.5x` outcome numbers count from zero once, over approximately 700–900ms. Suffixes remain present and the metric boxes retain their measured width to avoid text movement.

The Hero and How It Works remain in normal document flow. No sticky section overlap or pinning is introduced. A very small late-scroll upward transform, capped at 20–40px, may be applied to Hero content only if it does not alter the approved section boundary.

## 5. Shared button feedback

Existing button color, border, size, spacing, and label content remain unchanged. On hover-capable devices, only the visible label receives a short blur pulse: sharp to approximately 3–5px blur and back to sharp within 250–350ms. It does not run on touch input and does not leave a long reverse animation on pointer exit. The behavior is shared by the existing design-system Button component so Pre-Order, Reserve Your Spot, See MO/GO in Action, modal CTA, and other appropriate existing buttons remain consistent.

## 6. How It Works

The section retains its current geometry. Its left image reveals downward with optional clipping and opacity over 650–800ms. The heading and support text resolve through the shared blur entrance, followed by the four step rows at an 80–110ms stagger.

One shared active index continues to control step copy, progress ring, and step image. Each active interval lasts about 3.8 seconds, within the requested 3.5–4.0 second pace. The active ring fills continuously clockwise; active ring and number use `--ds-color-action-active`. Inactive colors and row dimensions remain unchanged.

At a step transition, the outgoing image fades with a restrained scale change while the incoming image starts around 1.03 scale and settles to 1 over 450–550ms. Step 01 retains its existing callouts; later steps do not inherit those callouts. The cycle pauses outside the viewport and resumes from the current state. No row, divider, or control moves during state changes.

## 7. Technology section

The real GLB viewer, its camera, dimensions, drag controls, fallback, and idle appearance remain unchanged. The six benefit annotations enter as compact units. For each unit:

1. the existing segmented connector reveals along its actual SVG path;
2. its lime endpoint remains anchored to the product area;
3. the icon appears from approximately 0.94 scale;
4. number and title resolve from light blur;
5. body copy follows last.

Each unit takes roughly 500–700ms and benefit starts are staggered 100–140ms, keeping the total reveal under approximately 1.8 seconds.

After entrance, hover-capable desktop pointers may produce very small depth transforms on surrounding annotations only: connectors up to about 2px, icon/number groups up to about 3px, and text up to about 2px. The central interaction hit area and GLB drag remain authoritative. While the model is being dragged, annotation parallax is paused or strongly reduced. Connector endpoints, layout boxes, and text alignment do not reflow.

## 8. Testimonials

The section enters once in a stable sequence: portrait, name, role, quote, supporting copy, navigation. The quote remains the dominant element and all positions remain fixed.

The existing manual, infinite, three-item carousel remains non-autoplaying. Next transitions move the outgoing testimonial 20–40px left while fading, with the incoming testimonial arriving from the right; Previous mirrors the direction. The portrait, identity, quote, and supporting copy transition as one state over 350–450ms. The image inside the portrait circle receives a subtle 1 → 1.05 → 1 zoom, while the circle itself stays fixed. Section height and content columns do not jump.

## 9. Footer

The footer heading, supporting text, CTA, and navigation group receive the same one-time blur/opacity entrance with restrained stagger. Footer layout, dividers, links, social states, and background crop remain unchanged.

The background image moves as its own oversized layer on hover-capable desktop devices, capped near 10–14px horizontally and 5–8px vertically, with eased inertia and a smooth return on pointer leave. Footer content is never transformed. Overscan prevents exposed edges. Touch and reduced-motion modes remain static.

## 10. Accessibility and failure modes

`prefers-reduced-motion: reduce` disables parallax, blur-heavy entrances, connector drawing, count-up animation, testimonial travel, portrait zoom, and decorative image scaling. Content is immediately visible. Interactive functions remain usable: header access, manual testimonial navigation, CTA/modal actions, Technology fallback/viewer controls, and explicit step state controls. Automatic How It Works cycling is disabled in reduced-motion mode, leaving Step 01 active by default.

Hover effects are gated with `(hover: hover) and (pointer: fine)`. Focus styles and keyboard behavior remain those of the existing design system. Pointer handlers do not intercept page scrolling outside their intended interaction area. If a layered Hero source fails, the existing flattened Hero remains visible. If WebGL fails, the existing Technology poster remains visible.

## 11. Verification strategy

Implementation will proceed test-first where behavior can be isolated. Automated checks will cover:

- semantic motion tokens and reduced-motion overrides;
- the Header state transitions and jitter thresholds;
- Hero source/fallback wiring and fixed geometry;
- one-time metric counters;
- the shared How It Works active index, timing, visibility pause, and image synchronization;
- Technology connector reveal hooks without changing the GLB viewer;
- carousel direction and stable state data;
- shared button label treatment;
- preservation of all four shared Pre-Order modal triggers.

The required project motion smoke test and design-system audit will be run. Final visual QA targets 1647px, 1440px, 1024px, 768px, and 390px, checking static fidelity before animation, entrances, scroll direction behavior, viewport pausing, touch fallbacks, reduced motion, overflow, clipping, distorted images, horizontal scroll, and layout shift. If the in-app browser continues to reject inspection of the local URL, that environmental restriction will be reported explicitly rather than treating unobserved visual QA as passed.

## 12. Expected production changes

Expected code changes are limited to the existing motion controller/styles, affected section markup/state wiring, shared design-system motion tokens/Button label behavior, project-owned optimized Hero assets, and focused automated QA evidence. No unrelated page copy or section design will change.
