# Copernicus public site: working rules

Redesign of the public website of Copernicus Podmiot Leczniczy sp. z o.o. (five facilities in
Gdańsk). Read this before writing code; it is the short version of the documents it points to.

**Conformance target: WCAG 2.2 level AA.** Not AAA. Several AAA enhancements are held on purpose
(7:1 body contrast, 44 px targets, enhanced focus appearance, reduced motion) and must not
regress. See `docs/adr/0004-conformance-target-aa.md` and `docs/accessibility.md`.

**Scope: the public site only.** The patient and staff portals stay with their provider and are
reached by link. No health data enters this repository. `docs/adr/0006-scope-public-site-only.md`.

## Commands

| Command                 | What it does                                                                      |
| ----------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`              | Next dev server on port 3000                                                      |
| `pnpm verify`           | The full gate, in CI order. Run before every PR.                                  |
| `pnpm test:a11y`        | Playwright: axe, keyboard, focus, target size, 200% zoom, server-rendered content |
| `pnpm check:contrast`   | Token pairs against WCAG thresholds, AA blocking, AAA reported                    |
| `pnpm check:boundary`   | Fails when `'use client'` appears outside `src/components`                        |
| `pnpm design:inventory` | Regenerates the React Aria component list after a library upgrade                 |

`pnpm typecheck` runs **after** the build, because `next-env.d.ts` references types Next
generates. `pnpm verify` already orders it correctly.

## Hard rules

1. **Colour only from `src/styles/tokens.css`.** No hex, no `oklch()`, no Tailwind colour
   utilities in components. A new colour means a token plus an entry in the manifest in
   `scripts/check-contrast.mjs`, in the same commit.
2. **`'use client'` only in `src/components/**` and `src/providers.tsx`.** React Aria ships no
   client directives of its own, so the wrappers are the boundary. `pnpm check:boundary` enforces
   it and prints the whole client surface.
3. **Interactive widgets come from React Aria, through the wrappers.** Never hand-roll roles,
   focus management or key handling. If a pattern is missing from
   `design/component-exports.generated.md`, write an ADR before building it.
4. **Deviating from a React Aria component needs rendered evidence**, not an argument. The two
   accepted reasons are in `design/component-inventory.md`: the pre-hydration DOM has no usable
   control, or the component's role overstates the content. Record the rendered DOM in the screen
   spec.
5. **Primary content is never behind a `Disclosure`, a `Popover` or a `Tabs` panel**, and never
   rendered only on the client. This is the defect the whole project exists to fix.
6. **Implement from the screen spec**, `design/screens/<route>.md`, not from the design canvas and
   not from a screenshot. The canvas is a picture with annotations; the spec is the contract.
7. **User preferences live on `<html>` as data attributes, and an absent attribute means "follow
   the system".** `data-theme` takes `light`, `dark` or a named high-contrast theme, never a
   boolean. `data-font-scale` takes `1`, `2` or `3`. Nothing else may read or write those keys.
   `docs/adr/0007-user-preferences-theme-contrast-text-size.md`.
8. **Every human-readable string in `src/content/` is locale-keyed**, even while Polish is the only
   locale, and `<html lang>` comes from the route. The language code for Ukrainian is `uk`.
   `docs/adr/0008-internationalisation.md`.

## Conventions

- UI copy is Polish. **Code comments, documentation and commit messages are English.**
- Conventional Commits, plus an `a11y` type for changes whose purpose is a WCAG criterion.
  Reference the criterion in the body, e.g. `Refs WCAG 2.2 SC 2.5.8 (AA)`.
- Branch per route: `feat/<route>`, `fix/<scope>`, `a11y/<criterion>-<slug>`.
- Every PR carries the checklist in `.github/pull_request_template.md`. Unchecked AA boxes block
  the merge.
- Commit identity for this repository is the owner's GitHub noreply address, supplied by their
  global git config. Do not set `user.email` in the repository.

## Where things are

```
design/workflow.md              How design and code hand work to each other, step by step
design/screens/<route>.md       The implementation contract for one route
design/information-architecture.md  Content model (contact point) and the route table
design/component-inventory.md   What may be used, and what each component needs from JavaScript
docs/accessibility.md           AA criteria, manual owners, the costed path to AAA
docs/adr/                       Decisions with their trade-offs
```

## Open decisions that affect implementation

- Hosting is undecided, so nothing may depend on ISR for correctness and nothing may use the edge
  runtime. `docs/adr/0005-rendering-strategy-and-hosting.md`.
- No CMS yet. Routes read from a typed module under `src/content/` until one is chosen; that
  module is the contract the CMS will have to satisfy.
- The preference controls (theme, contrast, text size) and the language switcher are built as one
  iteration of the loop after `/wazne-telefony`, not per route. Until then only their contract
  exists: rules 7 and 8 above.
- Translation is tiered. Only tier 1 is committed to all four languages; the table is in
  `docs/adr/0008-internationalisation.md`.
