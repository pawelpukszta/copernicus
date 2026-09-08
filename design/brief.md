# Design brief: Copernicus public site

Paste this file as the opening instruction for a Claude Design canvas. It exists so the canvas
starts from the project's real constraints rather than from a blank page.

## What is being designed

A redesign of the public website of Copernicus Podmiot Leczniczy sp. z o.o., a healthcare
provider operating five facilities in Gdańsk. The audience is patients, their families, and
visitors, in that order. Staff have their own systems.

Out of scope: the patient portal, the staff portal, BIP, public procurement. Those are linked, not
redesigned.

## Who this is for, in priority order

1. **A person who needs a phone number now.** Registration, a department, the emergency
   department. They are stressed, often on a phone, sometimes with a poor connection. If they
   cannot find a number in two taps, the design failed regardless of how it looks.
2. **A patient preparing for a visit or admission.** What to bring, where to go, when, what a
   referral requires, what it costs.
3. **A person looking for a specific department, clinic or doctor.**
4. **Someone reading news or institutional information.**

Design for the first group first. Every screen answers: does this help someone who is worried and
in a hurry?

## Non-negotiable constraints

**Components.** Every interactive element maps to a component listed in
`component-exports.generated.md`, or is plain HTML. Annotate each block on the artboard with the
component name. See `component-inventory.md` for what each group requires from JavaScript, and
never place primary information inside a component that needs JavaScript to reveal it.

**Colour, spacing, type.** Use token names from `../src/styles/tokens.css`, never raw hex values.
Available: `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`,
`--color-primary` and its hover and active variants, `--color-danger`, `--color-success`,
`--color-warning`, `--color-border`, `--color-border-strong`, `--color-focus`, spacing steps
`--space-1` to `--space-12`, `--target-min` (44px), `--measure` (70 characters).
A colour that is not a token cannot be verified by CI and therefore does not exist.

**Accessibility floor**, from `../docs/accessibility.md`:

- body text contrast at least 7:1, non-text at least 3:1
- interactive targets at least 44 x 44 px, except links inside a sentence
- visible focus indicator on everything focusable, at least a 2px perimeter
- no information carried by colour alone
- readable at 200% text size and at 320 px width
- no automatic context changes, no auto-advancing carousels without a pause control
- respects reduced motion

**Rendering.** Every page is server-rendered HTML. Interactive enhancements arrive after
hydration. Design must therefore show two states for anything interactive: the server-rendered
state and the enhanced state. A search box that only works with JavaScript needs a form that
posts to a results page.

## Artboards to produce, in this order

Named after routes, so a spec can be generated per route later.

1. `/wazne-telefony` and `/` header: the emergency and contact path. Start here, not with the
   homepage as a whole. If this works, the rest follows.
2. `/` homepage.
3. `/oddzialy` and `/oddzialy/[slug]`.
4. `/poradnie` and `/poradnie/[slug]`.
5. `/szpitale/[slug]` facility page, including accessibility information about the building.
6. `/aktualnosci` list with filters and pagination, plus `/aktualnosci/[slug]`.
7. `/dla-pacjenta/przyjecie-do-szpitala` as the model for guide pages.
8. `/kontakt`, `/deklaracja-dostepnosci`, `/zglos-problem-dostepnosci`.
9. Component states sheet: every component from the inventory that the screens use, in default,
   hover, focus-visible, pressed, disabled, invalid and loading states, in light, dark and
   high-contrast themes.

For each artboard show, at minimum: 360 px, 768 px and 1280 px widths. For at least the homepage
and one guide page, also show the 200% text size case.

## What the current site does that must be preserved

- three skip links (main menu, content, footer)
- a way to enlarge text and to invert contrast, or a documented replacement that is at least as
  usable
- language switch
- the sign language interpreter connection, which is prominent and stays prominent
- the accessibility rating survey and the feedback route

## What the current site does that should not be repeated

- content that exists only after JavaScript runs
- a homepage carousel as the primary way to reach anything important
- news reachable only through 101 pages of numbered pagination, with no search and no categories
- five facilities presented as a flat footer list rather than as places with pages of their own
- important phone numbers spread between tiles, a subpage and the footer, in different orders

## Deliverable per artboard

- block-level annotation naming the React Aria component or `plain HTML`
- token names for colour, spacing and type
- the server-rendered state and the enhanced state where they differ
- empty, loading and error states for anything that fetches
- the focus order as a numbered overlay
