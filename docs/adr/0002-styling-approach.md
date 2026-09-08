# ADR 0002: Tailwind 4 utilities over CSS custom-property tokens

- **Status:** accepted
- **Date:** 2026-09-08

## Decision

Design tokens live as CSS custom properties in `src/styles/tokens.css` and are exposed to
Tailwind 4 through `@theme inline`. Component-specific rules live in a plain `.css` file next to
the component; Tailwind utilities are used for layout and one-off spacing.

## Options considered

**Tailwind alone, with values in the config**

- For: fastest to write, tiny CSS output, consistent spacing by default.
- Against: colours end up scattered across class names, which makes any contrast budget
  impossible to verify mechanically. A `text-blue-600` in a template is invisible to a contrast
  script.

**CSS Modules alone**

- For: full control, clear component boundaries, no utility soup in JSX.
- Against: more boilerplate, and spacing and typography drift unless the team is disciplined.

**Chosen: tokens in CSS custom properties, consumed by both Tailwind and component CSS**

- For: a single source of colour truth that `scripts/check-contrast.mjs` can parse, so CI blocks
  any token change that breaks the AA budget and reports the distance to AAA on the same run.
  Theme switching (light, dark, forced-colors) is a custom-property swap rather than a class-name
  rewrite. React Aria state attributes style cleanly in component CSS.
- Against: two places to look when styling a component, and the discipline of "no raw colour
  outside tokens.css" has to be enforced in review.

**Long term**

The enforceable contrast budget is what makes AA hold past the launch sprint and keeps AAA a
decision rather than a rebuild. A team that writes colours inline will pass an audit once and
drift within two quarters, because nothing fails when someone picks a slightly lighter grey.
Parsing tokens for contrast only works if the tokens are the only source, which is the constraint
this ADR buys.

## Consequences

- Adding a colour means editing `tokens.css` **and** the manifest in `scripts/check-contrast.mjs`,
  including the pair kind (`body`, `large` or `nontext`) that selects its thresholds.
- Arbitrary Tailwind colour utilities (`text-[#abc]`, `bg-slate-200`) are treated as review
  blockers.
- A dedicated design system package is out of scope for now; revisit if a second product needs
  the same tokens.
