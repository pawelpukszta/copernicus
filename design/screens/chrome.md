# Handoff spec: site chrome (header, preferences, footer)

Source artboards: `../canvas/HeaderDesktop.dc.html` (1280 px) and `../canvas/HeaderMobile.dc.html`
(360 px). Unlike a route spec this one covers the frame every route renders inside, so it is
implemented once, in `src/app/layout.tsx` and `src/components/**`, and never per route.

Conformance target WCAG 2.2 AA (`../../docs/adr/0004-conformance-target-aa.md`). The preference
mechanics are already decided in `../../docs/adr/0007-user-preferences-theme-contrast-text-size.md`;
the language switcher in `../../docs/adr/0008-internationalisation.md`. This spec does not reopen
either. It settles what the artboards leave open, and it records the rendered evidence that decides
three component choices.

## Overview

The chrome carries four things a visitor in trouble needs before they read anything: a way past it
(skip link), a way to the emergency numbers (strip and action), a way to navigate (main navigation),
and a way to make the page usable at all (theme, contrast, text size, language).

Two rules survive from the audit into every line below:

- **The main navigation exists as a plain list of links in the server HTML.** Collapsing it is an
  enhancement layered on top, never the thing that produces it. The audited site put its content
  behind JavaScript; putting the navigation there instead would be the same defect wearing a hat.
- **The preference controls are an enhancement over a correct default.** With no JavaScript the page
  already follows the system colour scheme at the base text size, so nothing is lost, only
  unadjustable. This is why ADR 0007 is allowed to depend on a client component at all.

## What the chrome owns

| Block           | Contents                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| Skip link       | One link to `#main`. Already built: `src/components/SkipLink`.           |
| Utility bar     | Organisation name, text size, theme, sign language interpreter, language |
| Main bar        | Logo and wordmark, site search, Portal Pacjenta (external)               |
| Navigation bar  | Main navigation, `Ważne telefony` action                                 |
| Emergency strip | `112` and the emergency department number, permanent                     |
| Footer          | Statutory links, accessibility statement, feedback route, review date    |

The emergency strip currently lives in `src/app/wazne-telefony/page.tsx`. It moves here, and the
route stops rendering its own.

## Preferences: the contract

Restated from ADR 0007 because it is the part implementation gets wrong. It is not re-decided here.

| Attribute on `<html>` | Values                                   | Absent means      |
| --------------------- | ---------------------------------------- | ----------------- |
| `data-theme`          | `light`, `dark`, `hc-black`, `hc-yellow` | follow the system |
| `data-font-scale`     | `1`, `2`, `3`                            | `1`               |

`data-font-scale` maps to `--font-scale` of 1, 1.25 and 1.5, applied to the root font size. Nothing
outside the preferences component may read or write these keys, and nothing may store a preference
anywhere but `localStorage` under them.

**The two high-contrast themes are new token blocks**, so per rule 1 in `CLAUDE.md` they arrive with
their entries in the manifest in `scripts/check-contrast.mjs`, in the same commit. `hc-black` is
white on black, `hc-yellow` is yellow on black: both are the conventional Polish public-sector
pairings, and both must clear 7:1 on every pair the manifest already lists for the light theme.

### The artboard's separate "Kontrast" button does not ship

The desktop artboard draws text size, then a `Kontrast` button, then language. A separate contrast
control implies a second axis applied on top of the theme, which is exactly the two-dimensional
state space ADR 0007 decision 1 rejected. Contrast is a theme, so it is a value of the same control.
One control labelled `Motyw`, four options; no `Kontrast` button.

## Component choice: measured, not assumed

React Aria is the default. Everything below was rendered with `react-aria-components@1.21.1` before
it was decided, per the evidence rule in `../component-inventory.md`.

| Component            | Rendered result                                                                                                                         | Verdict                                                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MenuTrigger`+`Menu` | `renderToStaticMarkup` emits **only** `<button aria-haspopup="true" aria-expanded="false">Menu</button>`. No panel, no items, no links. | **Not for the main navigation.** The entire navigation would be absent from the server HTML. `Menu` is also the wrong pattern: `role="menu"` describes an application menu, not a set of page links. |
| `Disclosure`         | Panel renders as `<div role="group" aria-hidden="true" hidden>` with its children inside                                                | **Not as the server state.** The links are present in the markup but hidden from everyone until hydration. Usable only as an enhancement applied after mount, never as what the server sends.        |
| `ToggleButtonGroup`  | `role="radiogroup"` with `role="radio"` children carrying `aria-checked`                                                                | **Use it, with a caveat below.**                                                                                                                                                                     |
| `SearchField`        | Real `<input type="search">` carrying its `name`                                                                                        | **Use it.** Already proven on `/wazne-telefony` and pinned by `src/components/ssr-degradation.test.tsx`.                                                                                             |

### The theme control takes ADR 0007's documented fallback

ADR 0007 decision 4 asked for two buttons carrying three states, where pressing the active one
deselects it and returns to the system preference, and said the behaviour was "to be confirmed by
rendering". It was. Measured with `@testing-library/user-event`:

| Action                               | Result                                     |
| ------------------------------------ | ------------------------------------------ |
| Click the active button              | selection becomes empty                    |
| `Space` on the active button         | selection becomes empty                    |
| `ArrowRight` from an empty selection | stays empty, focus moves without selecting |

So the mechanism works exactly as the ADR described, including from the keyboard. The problem is
what it announces. `ToggleButtonGroup` is a `radiogroup`: a screen reader says "Ciemny, radio
button, checked, 2 of 2". Nothing in that says a third state exists, nothing suggests pressing the
checked option again returns to it, and arrow keys behave unlike every other radio group the user
has met, where moving the arrow selects.

A control whose accessible semantics describe two states while it has three is a control that lies.
So this spec takes the fallback ADR 0007 already documents: **three explicit options, with the
system option labelled.** With `disallowEmptySelection` the radiogroup semantics then describe the
control exactly, and no user has to discover an unnamed state.

Theme, therefore: `Jasny`, `Ciemny`, `Czarno-biały`, `Żółto-czarny`, `Jak system` — five options in
one `ToggleButtonGroup`, `selectionMode="single"`, `disallowEmptySelection`, `aria-label="Motyw"`.
`Jak system` is the default and writes no attribute.

Text size: `ToggleButtonGroup`, `selectionMode="single"`, `disallowEmptySelection`,
`aria-label="Rozmiar tekstu"`, options `A` / `A` / `A` at 1, 1.25 and 1.5. The three visible glyphs
are identical, so each needs an accessible name of its own: `Standardowy`, `Większy`, `Największy`,
supplied as visually hidden text inside the button, not as `aria-label`, so 2.5.3 Label in Name
still holds for the part that is visible.

Both groups need a `radiogroup` label. The probe rendered one with no accessible name at all, which
is what happens when `aria-label` is forgotten.

## Navigation: what the server sends and what hydration adds

| Width      | Server HTML                                                             | After hydration                                                                                  |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| >= 1024 px | `<nav aria-label="Nawigacja główna">` with a horizontal `<ul>` of links | Unchanged. No JavaScript involved.                                                               |
| < 1024 px  | The same `<nav>`, the same `<ul>`, rendered open as a vertical list     | A trigger button appears and collapses the same list into a panel. The list is never re-created. |

The mechanism, which is the part that must not be improvised:

1. The list is always in the DOM, once. There is never a second copy for the other width.
2. The trigger button is rendered with the `hidden` attribute on the server and unhidden on mount.
   A control that does nothing must not be visible, and this is the one honest way to hide it
   without asking the server what the client can do.
3. The collapse is `Disclosure` / `DisclosurePanel` around the existing list, so the expanded state,
   `aria-controls` and `aria-expanded` come from React Aria rather than from hand-written attributes.
4. The panel starts **expanded** after mount and collapses only on the visitor's first press. A
   navigation that vanishes the moment JavaScript arrives is a worse experience than one that never
   collapsed.

Rule 5 in `CLAUDE.md` forbids primary content behind a `Disclosure`. The main navigation is chrome,
not the primary content of any route, and it is fully present and open before hydration, so the rule
is met in substance as well as in letter. If that reading is ever disputed, the fallback is point 4
without the collapse: a plain vertical list at every width, which costs only vertical space.

## Components

| Block               | Component                                  | Notes                                                                  | Needs JS         |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------- | ---------------- |
| Skip link           | `SkipLink` (built)                         | First tab stop on every page                                           | no               |
| Organisation name   | plain `<span>`                             |                                                                        | no               |
| Text size           | `ToggleButtonGroup` + `ToggleButton`       | three options, `disallowEmptySelection`                                | yes, enhancement |
| Theme               | `ToggleButtonGroup` + `ToggleButton`       | five options including `Jak system`                                    | yes, enhancement |
| Sign language       | plain `<a>`                                | external service; not a language, so not in the language control       | no               |
| Language switcher   | plain `<ul>` of `<a>`                      | each with `lang` and `hreflang`; one entry (`Polski`) until `[locale]` | no               |
| Logo and wordmark   | plain `<a href="/">`                       | image needs a real `alt`, or is decorative beside the wordmark         | no               |
| Site search         | `SearchField` inside `<form method="get">` | submits to `/szukaj`; see the open question                            | no               |
| Portal Pacjenta     | plain `<a>`                                | external system, said so in the visible text, per ADR 0006             | no               |
| Main navigation     | plain `<nav>` + `<ul>` of `<a>`            | `aria-current="page"` on the current one                               | no               |
| Mobile nav collapse | `Disclosure` + `DisclosurePanel`           | wraps the list after mount only                                        | yes, enhancement |
| `Ważne telefony`    | plain `<a>` styled as a primary action     | `ButtonProps` omits `href` and `elementType` in 1.21.1                 | no               |
| Emergency strip     | plain HTML                                 | never `role="alert"`; permanent content                                | no               |
| Footer              | plain HTML                                 |                                                                        | no               |

## Layout

| Breakpoint  | Behaviour                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| >= 1024 px  | Four stacked bars as drawn: utility, main, navigation, emergency. Horizontal padding `--space-6`.                                                             |
| 640-1023 px | Utility bar wraps to two lines. Search collapses to an icon-width field that still carries its visible label. Navigation collapses to the trigger.            |
| < 640 px    | Top bar only: logo, `Ważne telefony` as an icon action with a visible name, navigation trigger. Preferences and language move inside the panel, as annotated. |
| < 320 px    | Not supported below 320 px. At 320 px nothing may scroll horizontally, including at `data-font-scale=3`.                                                      |

The emergency strip never moves into a panel, at any width. It is the one element on the page that a
visitor may need without reading anything first.

## Design tokens

Everything comes from `../../src/styles/tokens.css`. The chrome adds no colour of its own; the two
high-contrast themes add token blocks, not new token names, except for the pair below.

| Token                    | Usage                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `--color-surface-raised` | Utility bar and footer fill                                                        |
| `--color-border`         | Bar separators                                                                     |
| `--color-primary`        | Current navigation item underline, primary action fill                             |
| `--color-danger`         | Emergency strip fill                                                               |
| `--target-min`           | Every control in the chrome, including the three `A` buttons                       |
| `--font-scale`           | **New.** 1, 1.25 or 1.5, set from `data-font-scale`, multiplied into the root size |

## Server-rendered versus enhanced

| Element             | Server-rendered state                                                      | After hydration                      |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| Skip link           | Final                                                                      | Unchanged                            |
| Navigation          | Open list of links                                                         | Same list, collapsible below 1024 px |
| Emergency strip     | Final                                                                      | Unchanged                            |
| Search              | `<form method="get" action="/szukaj">` with a real input                   | Same form                            |
| Theme and text size | Attributes already set by the pre-paint script; controls rendered `hidden` | Controls unhidden and operable       |
| Language switcher   | Final                                                                      | Unchanged                            |
| Footer              | Final                                                                      | Unchanged                            |

The pre-paint script is the one piece of inline JavaScript on the site. It reads both `localStorage`
keys, writes both attributes, and does nothing else. It must be inline and blocking, in `<head>`,
because anything else paints the wrong theme first. A Content-Security-Policy therefore needs a
nonce for it, which is a constraint on the hosting decision and is recorded in ADR 0007.

## States and interactions

| Element           | State            | Behaviour                                                                                |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| Navigation link   | current page     | `aria-current="page"` plus a 4 px underline in `--color-primary`; never colour alone     |
| Navigation link   | hover / focus    | Shared focus ring from `global.css`; underline thickens                                  |
| Preference button | selected         | `aria-checked="true"`, border in `--color-border-strong`, weight 700; never colour alone |
| Preference button | no JavaScript    | `hidden`, so no dead control is ever shown                                               |
| Nav trigger       | no JavaScript    | `hidden`; the list below it is open                                                      |
| Nav trigger       | pressed          | `aria-expanded` toggles; focus stays on the trigger                                      |
| Search            | submitted, no JS | Full page load to `/szukaj`                                                              |
| Emergency strip   | always           | No state. It does not collapse, hide on scroll, or animate.                              |

No animation in the chrome. The navigation panel opens and closes without a transition, because a
collapsing header that animates is the most common way a focus indicator ends up scrolled out of
view (2.4.11 Focus Not Obscured).

## Edge cases

**`data-font-scale=3` at 200 % zoom.** Compounds to roughly 300 %. Nothing may scroll horizontally
at 320 px, and the utility bar wraps rather than truncating. This is the combination ADR 0007 called
out as added test surface.

**A theme the code does not know.** `data-theme="whatever"` from a hand-edited DOM or a stale
`localStorage` value falls through to the system preference rather than to a blank palette. The
attribute is read, matched against the enum, and ignored if it does not match.

**`forced-colors: active` with a high-contrast theme selected.** The system wins. The theme's own
colours are dropped in favour of system colours, and the chrome must stay legible with the fill
gone: every bar keeps a border, not just a background.

**JavaScript fails after the attributes are written.** The pre-paint script is independent of the
bundle, so the chosen theme still applies and only the controls are missing. This is the intended
degradation, not a bug to fix.

**Print.** The chrome drops entirely except the organisation name and the emergency strip's numbers
rendered as text. Nobody prints a navigation bar.

## Focus order

1. Skip link
2. Text size, theme (each group is one tab stop; arrows move within it)
3. Sign language interpreter, language
4. Logo
5. Search field, search button
6. Portal Pacjenta
7. Navigation trigger, below 1024 px only
8. Navigation links in document order
9. `Ważne telefony`
10. Emergency strip: `112`, then the emergency department number
11. The route's own content, beginning with its `<h1>`

Below 640 px the order follows the artboard: logo, `Ważne telefony`, trigger, emergency strip, then
the panel contents when it is open.

Nothing in the chrome traps focus, and nothing moves focus on its own. Opening the navigation panel
leaves focus on the trigger.

## Accessibility notes

- The chrome contributes no `<h1>`. The route owns the only one.
- Two `<nav>` landmarks exist on a route with breadcrumbs, so both carry a name:
  `Nawigacja główna` and `Ścieżka nawigacyjna`.
- Each preference group is labelled, and each button in the text-size group has an accessible name
  beyond the letter `A`.
- Language links carry `lang` and `hreflang` (3.1.2), written in each language's own name, with no
  flags.
- The emergency strip is not `role="alert"`.
- Every icon is `aria-hidden` and sits beside real text, except the mobile `Ważne telefony` action,
  which needs a visible name rather than an `aria-label`, so 2.5.3 holds.
- The logo link's accessible name is the organisation name, not "logo".

## Acceptance criteria

Implementation is done when these pass, in addition to `pnpm verify`:

1. With JavaScript disabled, every main navigation link is present in the HTML of every route, at
   360 px and 1280 px, as an `<a href>` inside `<nav aria-label="Nawigacja główna">`.
2. With JavaScript disabled, no preference control and no navigation trigger is visible.
3. `renderToStaticMarkup` of the chrome contains no `role="menu"` and no `aria-hidden="true"`
   wrapper around a navigation link.
4. Setting `data-theme` to each of the four values changes the rendered palette, and an unknown
   value falls back to the system preference.
5. `pnpm check:contrast` covers both high-contrast themes and passes at AA, with the AAA figure
   reported.
6. At `data-font-scale=3` and 200 % zoom, `/wazne-telefony` does not scroll horizontally at 320 px.
7. Zero axe violations at AA on every existing route, in all four themes, at 360 px and 1280 px.
8. Tabbing from the top of any page reaches the skip link first and the route's `<h1>` region last,
   in the order listed above.
9. The preference chosen on one route is still applied after navigating to another, with no flash of
   the previous theme.
10. Unit test: the pre-paint script writes nothing when `localStorage` is empty, and the attributes
    are absent rather than set to a default value.
11. Unit test (`src/components/ssr-degradation.test.tsx`, extended): the theme and text-size groups
    render with an accessible name, and the mobile navigation trigger renders with `hidden`.

## Open, before implementation

- **Site search has no destination.** The header form submits to `/szukaj`, which does not exist and
  is not in this iteration. Either the search field waits for that route, or `/szukaj` ships as a
  stub in the same commit. Shipping a search box that 404s would repeat the defect this iteration
  just fixed on `/wazne-telefony`.
- **The client logo is a placeholder** in both artboards. The real asset, its dimensions and whether
  it carries the wordmark decide whether the `<img>` needs an `alt` or is decorative.
- **The navigation labels are the redesign's, not the current site's** (`Dla pacjenta`, `Placówki`
  rather than `ABC Pacjenta`, `O nas`). `../information-architecture.md` finding 8 records that this
  is a deliberate change to confirm, and half the labels point at routes that do not exist yet.
  Until they do, every one of them must resolve, per the dead-link test added with the fallback
  routes.
