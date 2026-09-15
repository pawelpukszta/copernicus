# ADR 0007: User preferences (theme, contrast, text size)

- Status: accepted
- Date: 2026-09-15
- Supersedes: the open question left in `docs/accessibility.md` about keeping custom text-size and
  contrast widgets

## Context

The current site offers three text sizes, a contrast inversion and a language switch in its top
bar. `design/information-architecture.md` records those as "the floor the redesign may not fall
below". The header artboards (`design/canvas/HeaderDesktop.dc.html`, `HeaderMobile.dc.html`) already
draw them: three A buttons, a contrast control, a language link, on narrow screens inside the Menu
panel rather than in the bar.

None of the three is required by WCAG 2.2 AA:

- Text resizing is satisfied by browser zoom on a rem-based layout, already asserted at 200% in
  `e2e/keyboard.spec.ts` (1.4.4, 1.4.10).
- Contrast is satisfied by the token palette, which clears 7:1 in both themes and is enforced by
  `pnpm check:contrast` (1.4.3, and 1.4.6 at AAA).
- Colour scheme is satisfied by `color-scheme: light dark` plus the `prefers-color-scheme` block in
  `src/styles/tokens.css`.

They are kept because a Polish public healthcare provider removing visible accessibility controls
reads as a regression to its users and to the accessibility audit it is compared against, and
because 1.4.8 Visual Presentation (AAA) asks for user-selectable colours.

Two references set the interaction model, chosen by the product owner:

- Declan Chidlow, <https://vale.rocks/micros/20260810-0330>: two buttons carrying three states.
  Light and dark are explicit; pressing the currently active one turns it off and returns to the
  system preference.
- Lea Verou, <https://lea.verou.me/blog/2026/dark-mode-toggles-2/>: most sites should not carry a
  persistent toggle at all, and a two-state control beats a three-button one.

The second argues for restraint, the first for the mechanism. Both are honoured: one control, two
buttons, no visible "System" button, and the system preference reachable by deselecting.

## Decision

### 1. The theme axis is an enum, not a boolean

`data-theme` on the `<html>` element takes `light`, `dark`, or a named high-contrast theme. Absence
of the attribute means "follow the system", which is what the `prefers-color-scheme` block in
`tokens.css` already handles.

This is the decision that cannot be deferred. A boolean light/dark toggle and a separate "increase
contrast" flag would produce a two-dimensional state space (light/dark x normal/high) that the token
file would have to spell out four times, and a persistence layer that has to migrate when a third
contrast theme is added. Contrast on a Polish public-sector site is conventionally a *theme*
(black on yellow, yellow on black), not an intensity applied on top of another theme.

### 2. Text size is a separate axis

`data-font-scale` on `<html>`, values `1`, `2`, `3`, mapping to a `--font-scale` of 1, 1.25, 1.5
applied to the root font size. Absence means 1. It is orthogonal to the theme and persists
separately.

### 3. State lives on `<html>`, is written before first paint, and is stored in `localStorage`

A small blocking inline script in `<head>` reads both keys and sets the attributes before the first
paint. The alternative, a cookie read on the server, is rejected below.

### 4. The controls are React Aria `ToggleButtonGroup`

Theme: `selectionMode="single"` with empty selection allowed, so deselecting the active button
yields no selection, which is exactly the vale.rocks mechanism with no custom key handling.
Text size: `selectionMode="single"` with `disallowEmptySelection`, since "no text size" is not a
state. Both are client components under `src/components`, which the boundary rule in `CLAUDE.md`
permits. The exact deselection behaviour is to be confirmed by rendering, per the evidence rule;
if it does not behave as described, the fallback is three buttons with the system option labelled.

### 5. Placement

Desktop: the utility bar above the main bar, as drawn. Mobile: inside the Menu panel, as annotated.
Not a separate settings page: a visitor who needs larger text needs it on the page they are on.

### 6. Schedule

These controls are built as **one iteration of the phase 2 loop, immediately after
`/wazne-telefony`**, as the "chrome" screen covering the header, footer and preferences together.

Earlier is wrong: there would be no real page to test the extreme settings against. Later is worse:
every route implemented before it would have to be re-verified at maximum text size and in the
high-contrast theme.

What lands *before* step 6 of the current loop is only the contract: the attribute names, their
allowed values and the fact that the default is "attribute absent". No UI.

## Consequences

**Pros**

- One place decides colour for the whole site, and it stays the token file.
- The system preference remains reachable, which a plain two-state toggle loses. On a hospital site
  a visitor who taps the wrong control must be able to get back.
- Pages stay statically renderable, since nothing about the preference reaches the server.
- Adding a high-contrast theme later is a new value and a new token block, not a refactor.

**Cons**

- The inline pre-paint script is inline JavaScript, so a Content-Security-Policy will need a nonce
  for it. That is a real constraint on the hosting decision and must be recorded there.
- With JavaScript disabled the controls do nothing. This is accepted: the default state without
  script is already correct (system preference, base text size), so the controls are an enhancement
  over a correct baseline rather than a dependency. They are not primary content, so the rule in
  `CLAUDE.md` is not breached.
- Text size multiplied by browser zoom compounds. A 1.5 scale at 200% zoom is effectively 300%, and
  the reflow assertion has to cover it. This is added test surface, not a defect.
- The preference does not follow the user between devices. Accepted: the alternative needs accounts,
  which are out of scope.

**Long-term effects**

- The enum shape is what makes 1.4.8 (AAA) reachable without a rebuild: a user-selectable palette is
  more values on the same attribute.
- Every future component inherits the constraint that it may not hard-code a colour, which
  `pnpm check:contrast` already enforces.
- A high-contrast theme must not fight `forced-colors: active`. When one is added, the manual matrix
  row for Windows High Contrast covers the combination.

## Alternatives considered

**Cookie instead of `localStorage`, read on the server.** Removes the inline script and the flash
entirely, and would let the server render the chosen theme. Rejected because reading a cookie in the
App Router opts the route out of static rendering; every page in the route table would become
dynamic to serve a preference that changes a CSS custom property. If the hosting decision later
makes per-request rendering the norm anyway, this ADR should be revisited; the attribute contract
does not change, only where the attribute is written.

**Drop the custom text-size control and rely on browser zoom.** Cheaper and technically sufficient.
Rejected on the "floor" argument above: the feature exists today and its removal is visible.

**A three-button group with an explicit "System" option.** Clearer to a first-time user, at the cost
of a button that most people never press. Rejected in favour of the cited approach, but it is the
documented fallback if the deselection behaviour proves confusing in testing.
