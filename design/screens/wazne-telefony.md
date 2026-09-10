# Handoff spec: /wazne-telefony

Source artboards: `../canvas/Main.dc.html` (1280 px) and `../canvas/PhonesMobile.dc.html` (360 px),
as published on 2026-09-09 and verified unchanged against the live canvas before this spec was
written. Header details are in the header artboards and are specified separately; this file covers
only what the route owns.

Conformance target WCAG 2.2 AA (`../../docs/adr/0004-conformance-target-aa.md`). Stack: Next.js 16
App Router, React Aria Components through the wrappers in `src/components`
(`../../docs/adr/0005-rendering-strategy-and-hosting.md`).

## Overview

The route serves one user in a hurry: someone who needs a phone number now. Everything else on the
page is secondary to that. It replaces a page whose eleven collapsed groups showed no numbers at
all (`../audit-current-site.md`), so the two rules that must survive implementation are: **nothing
primary is behind a disclosure**, and **urgent numbers are above everything else**.

Rendering tier: ISR. The page must be correct if revalidation never fires, per rule 2 of ADR 0005.

## Content model: contact point

This is the closed model. `/kontakt` and `/szpitale/[slug]` render the same records, so no field may
be added here for the benefit of this route alone.

```ts
type ContactPoint = {
  id: string; // stable CMS id, never derived from the number
  slug: string; // unique within facility
  label: string; // 3-80 chars, sentence case; SHOUTING CAPS are rejected at authoring
  facility: FacilityRef; // required
  unit?: UnitRef; // department, clinic or building
  phones: Phone[]; // 0-4; at least one phone OR an email is required
  fax?: string; // E.164; never rendered as callable
  email?: string; // role mailbox only
  availability: Availability; // required, see below
  category:
    | 'emergency'
    | 'out-of-hours'
    | 'registration'
    | 'diagnostics'
    | 'secretariat'
    | 'administration'
    | 'press'
    | 'institutional';
  audience: Array<'patient' | 'institution' | 'media'>; // at least one
  order: number; // within its group
  lastReviewedAt: string; // ISO date, required
  note?: string; // <= 140 chars, e.g. "budynek A, badania TK i MRI"
};

type Phone = {
  number: string; // E.164, e.g. "+48587640116"
  extension?: string; // digits only
  label?: string; // when a contact point has several, e.g. "odwołania zabiegów"
  note?: string; // <= 60 chars
};

type Availability =
  | { kind: '24/7' }
  | { kind: 'hours'; weekly: DayRange[]; exceptions?: Exception[] }
  | { kind: 'unknown' }; // renders as "Godziny do potwierdzenia", never as blank

type DayRange = { days: Array<1 | 2 | 3 | 4 | 5 | 6 | 7>; from: string; to: string }; // "07:00"
type Exception = {
  days: Array<1 | 2 | 3 | 4 | 5 | 6 | 7>;
  from: string;
  to: string;
  note?: string;
};
```

Validation, enforced in the CMS schema and re-checked at build:

1. `number` is E.164. A display format is derived, never authored: `+48 58 764 01 16` renders as
   `58 764 01 16`. This exists because the current site writes one number three ways.
2. `fax` may never appear in `phones`. The current site publishes WCO's fax as its phone number;
   the separate field makes that unrepresentable.
3. `email` must be a role mailbox. Reject an address whose local part looks like a person
   (`^[a-z]\.?[a-z]+$` against the staff directory), because one unit currently publishes an
   employee's personal address.
4. `availability.kind === 'unknown'` is allowed but raises an authoring warning and appears in the
   content-gap report. It is not a silent blank.
5. Several contact points may carry the same number. `58 772 39 50` serves at least four units, so
   the number is a value, never an identity.

### What this route selects

| Block                   | Query                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Pilne                   | `category in ('emergency','out-of-hours')` and `audience` includes `patient`, ordered `order`                                        |
| Facility groups         | `audience` includes `patient` and `category in ('registration','diagnostics','secretariat')`, grouped by `facility`, ordered `order` |
| Dla mediów i instytucji | `audience` includes `media` or `institution`                                                                                         |

The route is a **shortlist**: at most 8 rows per facility group. Beyond that the group renders its
first 8 and a link to `/szpitale/[slug]#kontakt`. A page that grows to hold every number becomes
the page it replaced.

## Layout

12-column thinking is not used; the page is a single measure-limited column with full-width tables.

| Breakpoint  | Behaviour                                                                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| >= 1024 px  | `main` padding `--space-6 --space-8 --space-12`. Pilne is a 3-column grid, `repeat(3, minmax(0, 1fr))`, gap `--space-6`. Groups render as `<table>`. Filter row is horizontal, fields `align-items: end`.                                                                                       |
| 640-1023 px | `main` padding `--space-6 --space-4 --space-12`. Pilne becomes 2 columns; the third cell wraps. Tables keep the table layout. Filter row wraps to two lines.                                                                                                                                    |
| < 640 px    | `main` padding `--space-4 --space-3 --space-8`. Pilne is one column, each number a full-width primary button. Tables switch to the stacked row pattern from the mobile artboard: label, number, availability, separated by `1px solid --color-border`. Filter stacks, both controls full width. |
| < 320 px    | Not supported below 320 px, per 1.4.10. At 320 px nothing may scroll horizontally.                                                                                                                                                                                                              |

Prose blocks are capped at `--measure` (70ch). Tables are not: a phone table is data, and capping
it would force truncation, which is forbidden below.

## Design tokens used

Every value below comes from `../../src/styles/tokens.css`. No raw colour may appear in the
implementation; `pnpm check:contrast` guards the palette.

| Token                                        | Value (light)        | Usage on this route                                            |
| -------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| `--color-surface`                            | `#ffffff`            | Page background, table odd rows                                |
| `--color-surface-raised`                     | `#f4f6f8`            | Pilne card, table even rows, fallback card, footer             |
| `--color-text`                               | `#14181c`            | Body copy, row labels                                          |
| `--color-text-muted`                         | `#4a5560`            | Availability, captions, breadcrumb current page, footer        |
| `--color-primary`                            | `#0b4a6f`            | Phone links, primary button fill                               |
| `--color-text-inverse`                       | `#ffffff`            | Primary button label                                           |
| `--color-danger`                             | `#8a1c1c`            | Emergency strip fill, Pilne border and heading                 |
| `--color-warning`                            | `#6b4400`            | Content-gap markers (design time only, see decisions)          |
| `--color-border`                             | `#5b6672`            | Row separators, card borders                                   |
| `--color-border-strong`                      | `#14181c`            | Input borders, table header underline, secondary button border |
| `--color-focus`                              | `#0b4a6f`            | Focus ring                                                     |
| `--space-1 … --space-12`                     | `0.25rem … 3rem`     | All spacing; no arbitrary values                               |
| `--target-min`                               | `2.75rem`            | Minimum height of every phone link, button and input           |
| `--radius-sm` / `--radius-md`                | `0.25rem` / `0.5rem` | Inputs and table cells / buttons and cards                     |
| `--measure`                                  | `70ch`               | Prose width                                                    |
| `--focus-ring-width` / `--focus-ring-offset` | `3px` / `2px`        | Shared focus indicator from `global.css`                       |

Type scale used here: `2rem` h1 desktop, `1.75rem` h1 mobile, `1.375rem` h2 desktop, `1.25rem` h2
mobile, `1rem` body, `0.9375rem` secondary. Phone numbers: `1.75rem` in Pilne desktop, `1.375rem`
in mobile rows, `1rem` in table cells, always `font-weight: 700` and
`font-variant-numeric: tabular-nums` so digits align in a column and are easier to read back.

## Components

| Block                | Component                                                    | Props / markup                                                                | Needs JS                                    |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------- |
| Breadcrumbs          | `Breadcrumbs`, `Breadcrumb` wrappers                         | last item `aria-current="page"`, not a link                                   | no                                          |
| Page heading         | plain `<h1>`                                                 | one per page                                                                  | no                                          |
| Pilne card           | plain HTML `<section aria-labelledby>`                       | never a `Disclosure`                                                          | no                                          |
| Phone number         | plain `<a href="tel:+48…">`                                  | visible text is the display format; `aria-label` omitted so 2.5.3 holds       | no                                          |
| Pilne number, mobile | `Button` wrapper rendered as `<a>` via `elementType`         | `variant="primary"`; full width                                               | no                                          |
| Filter, search field | native `<input type="search" name="q">`                      | **not** `SearchField`, see deviations                                         | no                                          |
| Filter, facility     | native `<select name="placowka">`                            | **not** `Select`, see deviations                                              | no                                          |
| Filter, submit       | `Button` wrapper                                             | `type="submit"`, `variant="primary"`                                          | no                                          |
| Group table          | `Table`, `TableHeader`, `Column`, `TableBody`, `Row`, `Cell` | `aria-label` per table = the facility name; `<caption>` carries the sort hint | renders without JS; sorting is server links |
| Group rows, mobile   | plain HTML `<div>` rows                                      | not a table below 640 px                                                      | no                                          |
| Fallback actions     | `Button` wrappers as `<a>`                                   | `variant="secondary"`                                                         | no                                          |
| Content-gap marker   | plain HTML `<span>`                                          | design time only                                                              | no                                          |

### Deviations from the artboard annotations

The artboard note maps the filter to `SearchField + Select + Button`. This spec uses native
`<input type="search">` and `<select>` instead, and the note should be updated.

Reason: the filter must work with no JavaScript, and React Aria's `Select` renders a button plus a
popover that is inert before hydration, so the server-rendered state would be a control that looks
interactive and is not. A native select works immediately, submits with the form, and gets the
platform's own mobile picker. What React Aria would add here is typeahead over a six-item list,
which is not worth an inert control on the one page a panicking visitor uses.

Consequence to accept: the facility control looks like a native widget rather than a designed one,
so it will not match `Select` elsewhere in the product. That inconsistency is deliberate and
documented here rather than being discovered later. Revisit only if the list grows past ~15
facilities, when typeahead starts to matter.

## Server-rendered versus enhanced

| Element                      | Server-rendered state                                                                                                                                           | After hydration                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Everything except the filter | Final. No client component involved.                                                                                                                            | Unchanged                                                                                                                                              |
| Filter form                  | `<form method="get" action="/wazne-telefony">` with native controls; submitting reloads the route with `?q=&placowka=` and the server returns the filtered list | The same form, client-side filtered over the already-rendered rows, `history.replaceState` keeps `?q=` in the URL so a shared link reproduces the view |
| Table sorting                | `<a href="?sort=label">` in the column header; the server returns the sorted list                                                                               | Same links; no client sorting                                                                                                                          |

Two rules for the implementation: no row is ever rendered only on the client, and the filter's
enhanced path must not change what the page shows relative to the server path for the same query.

## States and interactions

| Element          | State                     | Behaviour                                                                                                                                                                                  |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phone link       | default                   | `--color-primary`, underlined, `text-decoration-thickness: 0.08em`                                                                                                                         |
| Phone link       | hover                     | `--color-primary-hover`, thickness `0.15em`; no colour-only change                                                                                                                         |
| Phone link       | focus-visible             | Shared 3px ring, 2px offset, from `global.css`                                                                                                                                             |
| Phone link       | visited                   | Not styled differently; a called number is not "used up"                                                                                                                                   |
| Primary button   | default / hover / pressed | `--color-primary` / `--color-primary-hover` / `--color-primary-active`                                                                                                                     |
| Primary button   | focus-visible             | Shared ring                                                                                                                                                                                |
| Primary button   | disabled                  | Not used on this route. Nothing here can be unavailable.                                                                                                                                   |
| Secondary button | default / hover           | `--color-surface` with `--color-border-strong` border / `--color-surface-raised`                                                                                                           |
| Search input     | default                   | 2px `--color-border-strong`, `--radius-sm`, min-height `--target-min`                                                                                                                      |
| Search input     | focus-visible             | Shared ring                                                                                                                                                                                |
| Search input     | invalid                   | Not possible; any string is a valid query                                                                                                                                                  |
| Filter           | submitting, no JS         | Full page load; the browser's own progress is the only indicator                                                                                                                           |
| Filter           | filtering, enhanced       | Synchronous over rendered rows, so no spinner. If it ever becomes a fetch, the list keeps the previous rows, gets `aria-busy="true"`, and a `role="status"` region announces the new count |
| Table row        | hover                     | No hover state. Rows are not clickable; only the number is.                                                                                                                                |

No animation on this route. The only transition is the button's `background-color 120ms ease-out`,
inherited from the Button wrapper, and it is suppressed under `prefers-reduced-motion`.

## Edge cases

**Missing number.** Decided: the row stays, and renders the facility switchboard as a fallback,
labelled so the substitution is visible, for example `Rejestracja do poradni: numer w przygotowaniu,
tymczasowo centrala 58 764 01 00`. Alternatives considered: hiding the row is cleanest visually but
conceals from the patient that the unit exists; showing "numer w przygotowaniu" alone is honest but
leaves them with no way to reach anyone, and after six months reads as neglect. The fallback keeps a
path to a human, which is the page's job. The orange dashed `[NUMER DO UZUPEŁNIENIA]` marker in the
artboards is a **design-time device only** and must not ship.

**Missing availability.** Renders `Godziny do potwierdzenia` in `--color-text-muted`. Never blank.

**Long labels.** Wrap; never truncate. `text-wrap: pretty` on labels. A truncated phone label is
worse than a tall row. Numbers are never truncated, never abbreviated, never split across lines
(`white-space: nowrap` on the number itself).

**Several numbers in one row.** Up to four, stacked in the cell with `gap: --space-1`, each its own
44 px target, each with its `label` when present.

**Zero results after filtering.** Pilne stays visible. The groups are replaced by: a heading
`Nie znaleziono numeru dla „<query>"`, a `role="status"` announcement of the same text, the two
fallback actions, and a link that clears the filter. Never an empty page.

**CMS unavailable.** At build or revalidation time, serve the last successful render. If there is
none, the route falls back to a statically compiled page containing the five switchboards and 112,
committed in the repository. A hospital phone page that can 500 is not acceptable.

**Print.** People print this page and pin it up. `@media print`: drop the header strip, the filter
and the fallback buttons; render every group as a table; print the number next to each label in
black; put `lastReviewedAt` in the footer. Minimum 12 pt body.

**Forced colours.** Windows high contrast must keep the emergency strip legible: `forced-colors`
block sets `border` on the strip and relies on system colours, as the Button wrapper already does.

**Long strings from translation.** The page is Polish today; German or Ukrainian labels run ~30%
longer. Table column widths are percentages, not fixed, and labels wrap.

## Focus order

1. Skip link (from the layout)
2. Header: logo link, navigation links, `Ważne telefony` action
3. Emergency strip: `112`
4. Breadcrumbs: `Start`
5. Pilne: `112`, SOR number, out-of-hours number or its fallback
6. Filter: search input, facility select, `Filtruj`
7. Each group in document order: the sort links in the header row, then each row's number(s)
8. Fallback card: `Wszystkie dane kontaktowe`, `Zgłoś problem z dostępnością`
9. Footer links

Nothing on this route traps focus, opens an overlay, or moves focus on its own. After an enhanced
filter, focus stays where it was and the result count is announced through `role="status"`.

## Accessibility notes

- One `<h1>`. Groups are `<h2>`; no level is skipped.
- Every group is a `<section aria-labelledby>` pointing at its `<h2>`.
- Tables carry `aria-label` equal to the facility name; the first cell of each row is
  `<th scope="row">`.
- The emergency strip is not a `role="alert"`. It is permanent content, and an alert would be
  announced on every page load.
- Availability is plain text in its own cell, never a tooltip.
- `112` and every number is a `tel:` link with the visible text as its accessible name (2.5.3).
- Contrast: body 7:1, non-text 3:1, verified by `pnpm check:contrast`. White on `--color-danger` is
  9.28:1.
- Targets: 44 x 44 px minimum, which clears 2.5.8 (AA, 24 px) and 2.5.5 (AAA, 44 px). Links inside a
  sentence are exempt and must not be padded.

## Acceptance criteria

Implementation is done when these pass, in addition to `pnpm verify`:

1. `e2e/server-rendered.spec.ts` extended: with JavaScript disabled, `/wazne-telefony` returns 200
   and its HTML contains `112`, the SOR number, and all five switchboards.
2. With JavaScript disabled, submitting the filter form returns a filtered list from the server.
3. Every phone link is at least 44 x 44 px at 360 px, 768 px and 1280 px (existing target-size
   assertion, extended to this route).
4. No `details`, `Disclosure` or `Popover` in the route's server output.
5. Zero axe violations at AA in light and dark, at 360 px and 1280 px.
6. Focus order matches the list above, asserted by tabbing through and collecting accessible names.
7. Filtering to a query with no matches leaves Pilne rendered and announces the empty state.
8. A contact point with `availability.kind === 'unknown'` renders `Godziny do potwierdzenia`.
9. A contact point with no phone renders the facility switchboard fallback, labelled.
10. Unit test: the display formatter turns `+48587640116` into `58 764 01 16` and refuses a value
    that is not E.164.
11. Unit test: a record with a `fax` value inside `phones` fails validation.

## Open, before implementation

- Nine numbers are still unknown (`../audit-current-site.md`). The route can ship with the
  switchboard fallback, but the content owner and a date have to exist first.
- Whether `/wazne-telefony` stays a top-level route or lives under `/dla-pacjenta` needs the
  client's answer. This spec assumes top level, which is the point of the redesign.
