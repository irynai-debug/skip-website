# Technology 3D Viewer Design

## Scope

Replace only the central static product visual in `section#technology` with the real `input/mogo-device.glb` model. The section's background, dimensions, three-column composition, six benefit units, connector paths, typography, colors, and responsive reflow remain unchanged.

## Approved interaction

- The viewer is a section-local visual, not a new shared design-system component.
- Horizontal pointer or one-finger drag rotates the model without a Y-axis limit, allowing full 360-degree inspection.
- Vertical drag rotates the model around X and clamps it to `-20deg..20deg`.
- Release continues with restrained decaying inertia. There is no automatic rotation, pan, or zoom.
- Arrow keys provide the equivalent accessible manual rotation while the canvas is focused.
- The canvas alone owns `touch-action: none`; page scrolling outside the model stays native.
- `prefers-reduced-motion: reduce` keeps the supplied static product poster and never hydrates Three.js.

## Loading and fallback

The current optimized Technology WebP remains the server-rendered poster at the exact existing dimensions. An `IntersectionObserver` with a `480px` vertical root margin starts the viewer only as the section approaches the viewport. Three.js and `GLTFLoader` are dynamic imports, so neither blocks the Hero bundle. The canvas is absolutely layered in the existing media box and becomes visible only after the first successful model render.

WebGL detection, GLB load errors, and WebGL context loss all resolve to the existing poster without changing layout. The source GLB remains untouched; production uses a byte-identical project-owned copy at `public/assets/skip/mogo-device.glb`.

## Camera and lighting

A fixed perspective camera fits the centered model to the existing media container on each resize. Neutral hemisphere, key, fill, and rim lights keep the black hardware legible without colored environments, glow, blur, or section parallax. The camera cannot drift because users rotate a model pivot rather than the camera.

## Performance decision

The 13,429,772-byte GLB contains one mesh/material and three embedded JPEG textures, with no Draco or Meshopt extension. A meaningful size reduction would require repacking or lossy texture conversion, which cannot be accepted without visual comparison. The production copy therefore preserves source quality exactly; performance is controlled through proximity loading, code splitting, capped device pixel ratio, and render-on-demand behavior.

## Acceptance

- The unchanged Technology markup still contains six benefits and their connector SVGs around the same media slot.
- The initial render contains the optimized poster and no canvas.
- Once near the viewport, supported motion/WebGL environments load the actual GLB and expose continuous drag, X clamping, unrestricted Y rotation, inertia, and keyboard rotation.
- Reduced-motion, missing WebGL, load failure, or context loss preserve the poster.
- The production GLB hash equals the input GLB hash.
- Tests, production build, project-owned design-system contract validation, and the final evidence pass complete without modifying `input/` or `instructions/`.
