# Shared Pre-Order Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one accessible, reference-faithful MO/GO pre-order modal and connect exactly four existing CTAs to it.

**Architecture:** `Site` owns one modal-open state and passes one open handler only to the approved Header, Hero, How It Works, and Footer CTA instances. `PreOrderModal` portals one dialog to `document.body`; pure form validation/country utilities and a project-owned design-system `Field` keep behavior, content, and presentation isolated.

**Tech Stack:** React 19, React DOM portal, Vite 8, project-owned CSS/token design system, Node test runner, in-app browser QA.

**Spec:** `docs/superpowers/specs/2026-09-03-preorder-modal-design.md`

## Global Constraints

- `input/` and `instructions/` remain read-only.
- Use `input/preorder-modal.png` only as reference and `input/preorder-modal-bg.png` as the production asset.
- Preserve the exact requested modal copy and the existing appearance of all four triggers.
- Connect only Header `PRE-ORDER`, Hero `RESERVE YOUR SPOT`, How It Works `RESERVE YOUR SPOT`, and footer `RESERVE YOUR SPOT`.
- Do not connect `SEE MO/GO IN ACTION` or the header basket control.
- Do not submit data to any backend, API, email service, database, analytics service, or third party.
- Reuse existing typography roles and design-system tokens; no new per-element type styles or hardcoded colors.
- Respect reduced motion and complete focus, keyboard, scroll-lock, responsive, reference-fidelity, and `DS_CONTRACT` gates.
- The repository `.git` directory is ACL-protected in this environment, so implementation checkpoints use tests, saved QA evidence, and `git diff --check`; no commit step may alter the ACL.

---

### Task 1: Reference Inventory and Pure Form Model

**Files:**
- Create: `src/preOrderForm.js`
- Create: `tests/preorder-modal.test.mjs`
- Modify: `.site-builder/sections.json`
- Modify: `.site-builder/audits/preorder-modal/reference-fidelity.md`

**Interfaces:**
- Produces: `COUNTRIES: ReadonlyArray<{ code: string, label: string }>`
- Produces: `validatePreOrderForm(values): Record<'firstName'|'lastName'|'email'|'country', string>` with only invalid keys present.
- Produces: failing integration assertions that later tasks satisfy.

- [ ] **Step 1: Refresh the read-only input inventory**

Run the reference scanner with `input/` as the source and persist only project-owned `.site-builder` state. Record `preorder-modal.png` at 6227×3548 as reference-only and `preorder-modal-bg.png` at 1662×946 as the production image.

- [ ] **Step 2: Write failing pure-model tests**

Create tests that import `COUNTRIES` and `validatePreOrderForm`, assert alphabetical unique region codes, more than 240 built-in options, required errors for empty values, email rejection for `invalid@`, and no errors for `{ firstName: 'Maya', lastName: 'Lopez', email: 'maya@example.com', country: 'US' }`.

```js
assert.ok(COUNTRIES.length > 240)
assert.deepEqual(validatePreOrderForm({ firstName: '', lastName: '', email: '', country: '' }), {
  firstName: 'Enter your first name.',
  lastName: 'Enter your last name.',
  email: 'Enter your email address.',
  country: 'Select a country or region.',
})
assert.deepEqual(validatePreOrderForm({
  firstName: 'Maya', lastName: 'Lopez', email: 'maya@example.com', country: 'US',
}), {})
```

- [ ] **Step 3: Run the new tests and verify RED**

Run the new test file with the bundled Node executable. Expected result: module-not-found for `src/preOrderForm.js`.

- [ ] **Step 4: Implement the deterministic form model**

Generate browser-built-in English region names from all two-letter codes using `Intl.DisplayNames`, remove unrecognised codes, deduplicate by code, and sort with `localeCompare('en')`. Validate trimmed required values and a restrained basic email expression.

```js
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePreOrderForm(values) {
  const errors = {}
  if (!values.firstName?.trim()) errors.firstName = 'Enter your first name.'
  if (!values.lastName?.trim()) errors.lastName = 'Enter your last name.'
  if (!values.email?.trim()) errors.email = 'Enter your email address.'
  else if (!emailPattern.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!values.country) errors.country = 'Select a country or region.'
  return errors
}
```

- [ ] **Step 5: Run the pure-model tests and verify GREEN**

Require all form-model assertions to pass before moving to shared UI.

### Task 2: Project-Owned Field Component

**Files:**
- Modify: `src/design-system/index.jsx`
- Modify: `src/design-system/styles.css`
- Modify: `src/design-system/Gallery.jsx`
- Modify: `tests/preorder-modal.test.mjs`

**Interfaces:**
- Consumes: option objects from `COUNTRIES`.
- Produces: `Field({ id, name, label, type, autoComplete, required, value, onChange, options, error, disabled })`.
- Produces: `DS_CONTRACT.components.field` variants `input|select`, size `medium`, states `default|invalid|disabled`.

- [ ] **Step 1: Add failing Field contract tests**

Assert that `Field` is exported, emits a real `<label for>`, renders input or select by `options`, owns `aria-invalid`/`aria-describedby`, and that `DS_CONTRACT` and `Gallery` include every production-used variant/state.

- [ ] **Step 2: Run the Field tests and verify RED**

Expected result: `Field` export and field contract are absent.

- [ ] **Step 3: Implement `Field` in the production design system**

Render one `.ds-field` root with runtime markers, a label, the native control, an inline current-color chevron for select, and an error element only when supplied.

```jsx
<div data-ds-component="field" data-ds-variant={options ? 'select' : 'input'} data-ds-size="medium" data-ds-state={state}>
  <label htmlFor={id}>{label}</label>
  {options
    ? <select id={id} name={name} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}>{children}</select>
    : <input id={id} name={name} type={type} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} />}
  {invalid && <span id={`${id}-error`}>{error}</span>}
</div>
```

Own underline, focus-visible, invalid, disabled, label, and indicator styling in `src/design-system/styles.css` using existing tokens only. Add live default/invalid/disabled input and select specimens to `Gallery`.

- [ ] **Step 4: Run Field tests and the project-owned DS audit**

Require component tests plus catalogue audit to pass before the modal consumes `Field`.

### Task 3: One Accessible Pre-Order Modal

**Files:**
- Create: `src/PreOrderModal.jsx`
- Modify: `src/app.css`
- Modify: `src/siteContent.js`
- Modify: `tests/preorder-modal.test.mjs`

**Interfaces:**
- Consumes: `Field`, `Button`, `IconButton`, `Type`, `COUNTRIES`, `validatePreOrderForm`, and `ASSETS.preOrderModalBackground`.
- Produces: `PreOrderModal({ open, onRequestClose })` rendered through one portal.

- [ ] **Step 1: Add failing modal markup and lifecycle tests**

Use Vite SSR/source assertions to require one dialog component, exact copy, `role="dialog"`, `aria-modal="true"`, heading labelling, all four semantic field names/types, one production background asset, portal use, `Escape`, focus-trap, overlay-target, scroll-lock, focus-restore, and reduced-motion branches.

- [ ] **Step 2: Run modal tests and verify RED**

Expected result: `PreOrderModal.jsx` and `ASSETS.preOrderModalBackground` are absent.

- [ ] **Step 3: Implement the controlled dialog and form**

Use `createPortal`, preserve one rendered instance during exit motion, and keep the overlay mounted until `preorder-modal-exit` completes. On open, record `document.activeElement`, lock body overflow with scrollbar compensation, and focus `#firstName`. Implement the focus trap by wrapping `Tab`/`Shift+Tab` within enabled focusables and close on `Escape`. Restore styles and focus after the exit lifecycle.

Submit with:

```js
const handleSubmit = (event) => {
  event.preventDefault()
  const nextErrors = validatePreOrderForm(values)
  setErrors(nextErrors)
  const firstInvalidName = Object.keys(nextErrors)[0]
  if (firstInvalidName) dialogRef.current?.elements.namedItem(firstInvalidName)?.focus()
}
```

Do not perform fetch, navigation, storage, or success messaging.

- [ ] **Step 4: Implement reference-faithful modal composition**

Use one full-bleed `<img src={ASSETS.preOrderModalBackground} alt="">` behind a two-column semantic grid. Keep the form in the empty-sky left half and product subject in the right half. Use existing spacing, typography, radius, color, focus, error, control, and interaction tokens. Add restrained entry/exit keyframes and a no-animation reduced-motion branch.

- [ ] **Step 5: Run modal tests and verify GREEN**

Require exact-copy, semantics, form model, asset safety, and motion-contract checks to pass.

### Task 4: Wire Exactly Four Existing CTAs

**Files:**
- Modify: `src/Site.jsx`
- Modify: `src/design-system/index.jsx`
- Modify: `tests/preorder-modal.test.mjs`

**Interfaces:**
- Consumes: `PreOrderModal({ open, onRequestClose })`.
- Produces: one `openPreOrderModal` handler used by exactly four CTA instances.

- [ ] **Step 1: Add failing exact-trigger tests**

Assert these four call sites receive `onClick={openPreOrderModal}` and no `href`:

```txt
Header PRE-ORDER
Hero RESERVE YOUR SPOT
How It Works RESERVE YOUR SPOT
Footer RESERVE YOUR SPOT
```

Assert the How It Works secondary CTA remains `href="#technology"` and the basket remains bound to its existing handler. Assert one `<PreOrderModal>` instance in `Site`.

- [ ] **Step 2: Run trigger tests and verify RED**

Expected result: production CTAs still contain reserve destinations and no shared modal state exists.

- [ ] **Step 3: Implement shared state and exact handlers**

Add one state pair to `Site`, pass `onPreOrder` through only `Header`, `Hero`, `HowItWorks`, and `Footer`, and render one modal.

```jsx
const [preOrderOpen, setPreOrderOpen] = useState(false)
const openPreOrderModal = () => setPreOrderOpen(true)

<Header onPreOrder={openPreOrderModal} />
<Hero onPreOrder={openPreOrderModal} />
<HowItWorks onPreOrder={openPreOrderModal} />
<Footer onPreOrder={openPreOrderModal} />
<PreOrderModal open={preOrderOpen} onRequestClose={() => setPreOrderOpen(false)} />
```

Extend `SiteHeader` with `onPreorderActivate`; render its existing PRE-ORDER `Button` as a button with the handler while preserving all variant/size/classes. Leave basket and secondary CTA handlers unchanged.

- [ ] **Step 4: Run trigger tests and verify GREEN**

Require exactly four shared trigger call sites, one modal instance, and zero reserve hrefs on those four controls.

### Task 5: Responsive, Interaction, and Accessibility Browser QA

**Files:**
- Modify: `src/app.css`
- Modify: `.site-builder/audits/preorder-modal/reference-fidelity.md`
- Create: `.site-builder/audits/final/skip-final-preorder-modal.json`

**Interfaces:**
- Consumes: completed modal and four triggers.
- Produces: browser evidence and final QA report.

- [ ] **Step 1: Verify all four triggers explicitly**

At the live site, test and record:

```txt
Header PRE-ORDER -> opens dialog named TAKE THE NEXT STEP
Hero RESERVE YOUR SPOT -> opens the same dialog
How It Works RESERVE YOUR SPOT -> opens the same dialog
Footer RESERVE YOUR SPOT -> opens the same dialog
```

For each: record URL before/after, scroll position before/after, dialog count exactly one, and body scroll lock. Close between triggers and verify focus returns to the exact trigger.

- [ ] **Step 2: Verify close and keyboard behavior**

Test close button, overlay click, `Escape`, forward focus wrap, reverse focus wrap, initial focus on first name, inside-dialog clicks not closing, and background remaining non-scrollable.

- [ ] **Step 3: Verify validation and no submission**

Submit empty form, malformed email, and valid values. Confirm associated inline messages and focus on the first invalid field. Confirm the valid attempt does not navigate, reload, close, or create a network submission.

- [ ] **Step 4: Complete reference and responsive gates**

Compare the desktop modal with `input/preorder-modal.png`, save evidence, and verify the desktop reference width, 1440, 1024, 768, and 390 px. Check no horizontal overflow, clipped text, distorted image, inaccessible internal scroll, or page-layout jump.

- [ ] **Step 5: Verify motion variants**

Confirm restrained entry/exit in normal motion and a static state under `prefers-reduced-motion: reduce` without changing focus or close behavior.

### Task 6: Final Automated and Design-System Gates

**Files:**
- Modify: `.site-builder/design-system-audit.json`
- Modify: `.site-builder/audits/final/skip-final-preorder-modal.json`

**Interfaces:**
- Consumes: the complete production UI and live catalogue.
- Produces: final acceptance evidence.

- [ ] **Step 1: Run the complete test suite**

Run every `tests/*.test.mjs` file with the bundled Node executable. Require zero failures.

- [ ] **Step 2: Run production build and source guards**

Run Vite build, `git diff --check`, hardcoded-color scan for the new files, reference-image production-use scan, and tracking/network submission scan. Require zero errors.

- [ ] **Step 3: Run production/catalogue/comparison `DS_CONTRACT` audits**

Audit `/_design-system` and `/` at one matching viewport. Require catalogue and production `passed: true`, zero missing catalogue keys, and zero drifted keys.

- [ ] **Step 4: Leave the live page ready for inspection**

Navigate to `/`, close any QA-only state, and confirm the site returns HTTP 200 with no console errors. Record the final live URL in the handoff.
