# ADR 0001: Vite, React 19 and React Aria Components

- **Status:** accepted
- **Date:** 2026-09-08
- **Context:** the Copernicus redesign conforms to WCAG 2.2 AA and keeps AAA reachable (see
  ADR 0004), so the component layer decides how much accessibility work is bought rather than
  written.

## Decision

Vite 8 + React 19 + TypeScript 5.9 (strict), with all interactive primitives built on
[React Aria Components](https://react-spectrum.adobe.com/react-aria/).

## Why React Aria rather than an off-the-shelf component library

**For**

- Behaviour and accessibility are separated from presentation, so a AAA visual language can be
  applied without fighting a vendor's design decisions.
- Adobe maintains the keyboard, focus and screen reader behaviour across browser and AT
  combinations, including the cases most teams get wrong: focus containment, typeahead in
  listboxes, virtual cursor behaviour in iOS VoiceOver, touch versus pointer semantics.
- State is exposed as data attributes (`data-hovered`, `data-focus-visible`, `data-pressed`),
  which keeps styling out of CSS pseudo-classes that do not reflect the accessibility tree.

**Against**

- More code to write than adopting a styled library such as MUI or Mantine: React Aria ships
  behaviour, not looks.
- The team must learn its render-prop and slot conventions.
- Some patterns are still missing or immature, so a few widgets will need custom work anyway.

**Long term**

An accessibility-led project inverts the usual trade-off. A styled library saves weeks at the
start and then costs months, because contrast and focus requirements force overrides of the
vendor's tokens, and any accessibility gap in the vendor's implementation becomes a bug the team
cannot fix at the source. React Aria front-loads the effort and keeps the accessibility surface
auditable. It also keeps the AAA option open: the enhanced criteria that are behavioural rather
than editorial are largely satisfied by React Aria already.

## Why TypeScript 5.9 rather than 7.x

TypeScript 7 is available, but `typescript-eslint` supports `>=4.8.4 <6.1.0`. Adopting TS 7 today
means dropping type-aware linting, which is where the `jsx-a11y` and `no-floating-promises` value
sits. Pinned to `~5.9.3`; revisit once `typescript-eslint` publishes TS 7 support.

## Consequences

- Every interactive widget goes through React Aria, or an ADR explains why not.
- Version bumps of `react-aria-components` need an accessibility regression run, not just CI.
- Contributors need onboarding on React Aria conventions; `src/components/Button` and
  `src/components/TextField` are the reference implementations.
