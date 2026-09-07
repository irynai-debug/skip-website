# Shared Pre-Order Modal Design

## Goal

Create one reusable MO/GO pre-order dialog and route every conversion CTA to it without changing the appearance or layout of the existing page. The modal is a frontend-only form that preserves the reference copy, uses the project-owned design system, and can be connected to a backend later without rebuilding its presentation.

## Scope

The shared dialog opens from exactly four existing CTA buttons:

1. The main header `PRE-ORDER` button.
2. The Hero section `RESERVE YOUR SPOT` button.
3. The How It Works section `RESERVE YOUR SPOT` button.
4. The footer CTA `RESERVE YOUR SPOT` button.

These four triggers do not navigate, reload, or scroll the page. Their existing visual design, size, typography, spacing, hover states, and position remain unchanged.

`SEE MO/GO IN ACTION`, the header basket control, navigation links, and all other controls are explicitly outside the modal-trigger set and retain their current behavior and appearance.

## Reference and Assets

- `input/preorder-modal.png` is the visual reference only. The prompt also calls it `preorder-modal-reference.png`; because only `preorder-modal.png` exists, that file is authoritative.
- `input/preorder-modal-bg.png` is the production image.
- The reference screenshot is never bundled or rendered in production.
- The production image is rendered as a full-bleed, full-height modal image with `object-fit: cover`, preserving its aspect ratio. Its empty sky supports the form column while the product remains dominant in the visual column, matching the reference composition.

## Architecture

`Site` owns one boolean open state and one trigger reference. It renders one `PreOrderModal` instance through a portal into `document.body`. A shared `openPreOrderModal(event)` handler is passed only to the four approved CTA instances, records the triggering control, and opens the modal; the close path restores focus to that control after the exit transition.

The modal presentation, focus behavior, scroll lock, close lifecycle, and form state live in one focused component. Pure country-data and validation functions remain separate from presentation so they are deterministic and directly testable.

The project-owned design system gains one shared line-based `Field` family supporting text, email, and select controls. Its implementation owns labels, helper/error associations, focus, invalid, disabled, and select-indicator presentation. Consumers supply placement and content but do not duplicate Field internals.

## Modal Composition

The overlay covers the viewport and uses the existing darkest design-system color at reduced opacity. It is visually translucent and does not use blur, gradients, or heavy shadows.

The dialog is a large two-column composition:

- Left column: heading, supporting copy, first/last name row, email field, country field, and primary submit button.
- Right column: the product subject from `preorder-modal-bg.png`.

The background asset spans the modal so the empty sky remains behind the form, as in the reference. The semantic grid still has distinct form and visual columns. A minimal shared icon button sits at the top-right of the dialog and uses an accessible `Close pre-order form` label.

The exact visible static copy is:

- Heading: `TAKE THE` / `NEXT STEP`
- Supporting text: `Reserve your MO/GO and be the first to` / `experience the future of movement.`
- Fields: `FIRST NAME`, `LAST NAME`, `EMAIL ADDRESS`, `COUNTRY / REGION`
- Submit action: `RESERVE YOUR MO/GO`

## Form Structure and Data

The form uses standard semantic controls:

- `firstName`: required `input[type="text"]`, autocomplete `given-name`;
- `lastName`: required `input[type="text"]`, autocomplete `family-name`;
- `email`: required `input[type="email"]`, autocomplete `email`;
- `country`: required styled native `select`, autocomplete `country-name`.

The country control begins with a disabled empty `COUNTRY / REGION` option and contains a complete built-in alphabetical country/region list. It does not fetch options from an API or introduce a third-party dependency.

Submitting always calls `preventDefault()`. Empty fields and malformed email addresses receive subtle inline validation. Invalid controls expose `aria-invalid="true"` and `aria-describedby` references to concise error messages. The line and error copy use the existing design-system error token. There is no global error banner.

When the form is valid, it remains open and no success state is claimed because no backend submission occurs. The structure remains ready for a later submit adapter without changing field names, ids, or layout.

## Dialog Behavior

Opening the modal:

1. Records the originating CTA.
2. Preserves the document's current scroll position.
3. Locks background scrolling without shifting page width.
4. Renders the overlay and dialog above the page.
5. Moves focus to the first-name field after mount.

The dialog closes through the top-right close control, `Escape`, or a pointer click on the overlay itself. Events originating inside the dialog do not close it.

While open, `Tab` and `Shift+Tab` wrap through enabled focusable controls inside the dialog. Neither the page nor the cookie banner participates in the modal tab order. On close, scroll locking is removed and focus returns to the exact trigger that opened the dialog when it is still connected to the document.

## Motion

The overlay fades while the dialog combines opacity with a restrained `scale(0.98)` and small upward offset. Open and close transitions use the existing interaction timing/easing tokens and complete in approximately 300 ms.

The modal has no bounce, large zoom, dramatic slide, blur, or playful motion. With `prefers-reduced-motion: reduce`, it opens and closes without transition while retaining identical focus, scroll, and close behavior.

## Responsive Behavior

- Desktop and roomy tablet widths retain two columns and the reference-led panoramic proportions.
- At narrower tablet/mobile widths, the dialog becomes near full-screen with safe design-system margins and a bounded viewport height.
- Mobile changes to one column with the form first and a shorter, cropped image region below it.
- The dialog owns vertical overflow when its content exceeds the viewport; the underlying page remains fixed.
- Fields, button labels, and the image never create horizontal overflow. First and last name remain side by side while they fit and stack at the mobile breakpoint.

## Design-System Integration

The modal consumes existing color, spacing, radius, typography, button, focus, and interaction tokens. It reuses `Type`, `Button`, and `IconButton`. The new `Field` family is exported from the existing project-owned design-system entrypoint, represented in `DS_CONTRACT`, and rendered in all production-used variants and states on `/_design-system`.

Modal placement, full-bleed image composition, and responsive column geometry remain reference-driven local composition. Field typography, underline, focus, invalid, disabled, and select indicator remain system-owned.

No new font-size or font-weight role is introduced. The modal maps its heading, supporting copy, labels, validation messages, and submit label to the existing permitted typography roles.

## Testing and Acceptance

Automated tests cover:

- the complete country list and deterministic validation rules;
- one shared modal instance in the rendered application;
- exactly the header, Hero, How It Works, and footer CTA instances wired to one shared open handler with navigation removed;
- `SEE MO/GO IN ACTION` and the basket control excluded from the modal-trigger set;
- exact static modal copy and semantic field names/types;
- dialog labelling, modal semantics, form labels, and validation associations;
- production asset use without rendering the reference screenshot;
- reduced-motion and close/focus wiring contracts.

Browser QA covers:

- Header `PRE-ORDER` opens the shared modal;
- Hero `RESERVE YOUR SPOT` opens the same shared modal;
- How It Works `RESERVE YOUR SPOT` opens the same shared modal;
- footer `RESERVE YOUR SPOT` opens the same shared modal;
- `SEE MO/GO IN ACTION` and the basket control do not open the modal;
- no navigation, reload, or scroll-position change;
- initial focus, forward/reverse focus trap, `Escape`, overlay click, close control, and focus restoration;
- scroll lock and restoration without layout shift;
- validation for empty values and malformed email;
- desktop reference width, 1440, 1024, 768, and 390 px;
- no clipped text, distorted image, accidental horizontal scroll, or inaccessible internal scrolling;
- motion and reduced-motion behavior;
- console errors and network submission attempts.

Before completion, save reference-fidelity evidence for the modal and run the production/catalogue/comparison design-system gate against the project-owned `DS_CONTRACT`. Production build and the complete test suite must pass.
