# Production hosting requirements

These requirements are deployment-target independent. Apply them when the project is migrated to Next.js and the final GitHub Pages delivery shape is known; do not encode them as Vite-only behavior now.

## Compression and transport

- Serve HTML, CSS, JavaScript, JSON, and SVG with Brotli when supported and gzip as a fallback.
- Keep `Content-Encoding`, `Content-Type`, and `Vary: Accept-Encoding` correct.
- Serve `.glb` files as `model/gltf-binary` and WebP files as `image/webp`.
- Support byte-range requests for the GLB and use HTTP/2 or HTTP/3 where the host permits it.
- Do not recompress JPEG/WebP payloads at the edge. The Meshopt GLB already contains compressed geometry and JPEG textures; measure before enabling additional transfer compression for it.

## Cache policy

- Hashed JavaScript and CSS bundles: `Cache-Control: public, max-age=31536000, immutable`.
- Fonts and media may use the same immutable policy only after their URLs are content-fingerprinted. With the current stable filenames, use a shorter revalidation policy or purge the CDN atomically on deploy.
- HTML and route documents: `Cache-Control: no-cache` (or an equivalent must-revalidate policy) so a release cannot strand clients on an obsolete asset graph.
- Deploy HTML last, after every referenced immutable asset is available.

## Routing and 404 behavior

- Missing assets must return a real HTTP 404; never rewrite a missing `.js`, `.css`, image, font, or `.glb` request to `index.html`.
- A single-page-app fallback may be used only for navigational document requests.
- Verify both `/` and `/_design-system` after deployment.
- Provide a real 404 document for unknown routes and verify its HTTP status remains 404.

## Verification at the final host

- Confirm compression from response headers, not file extensions.
- Confirm repeat navigation uses the intended cache policy.
- Confirm range requests, MIME types, CORS policy, and the GLB fallback on a device without WebGL.
- Re-run the project responsive, motion, modal/CTA, lazy-loading, and design-system gates against the deployed URL.

## Third-party attribution

The optimized production model was generated with `gltfpack` from the meshoptimizer project. Preserve its MIT license attribution in deployment or repository notices: Copyright (c) 2016–2026 Arseny Kapoulkine.
