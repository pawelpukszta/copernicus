# Copernicus

Front-end for the Copernicus website redesign. The project conforms to **WCAG 2.2 level AA**,
with the remaining AAA criteria tracked as a measured gap rather than dropped. Accessibility is a
build constraint here, not a review step: contrast, focus, target size and keyboard behaviour are
all verified in CI.

Level AAA is not claimed. The reasoning is in
[`docs/adr/0004-conformance-target-aa.md`](docs/adr/0004-conformance-target-aa.md) and the route
to it, with a cost estimate per criterion, is in
[`docs/accessibility.md`](docs/accessibility.md#path-to-aaa).

## Stack

| Concern             | Choice                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Build               | Vite 8                                                                                              |
| UI                  | React 19 + React Aria Components                                                                    |
| Language            | TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)                   |
| Styling             | Tailwind CSS 4 with CSS custom-property design tokens                                               |
| Unit tests          | Vitest + Testing Library (jsdom)                                                                    |
| Accessibility tests | Playwright + axe-core, plus keyboard, zoom and target-size assertions, AA blocking and AAA advisory |
| Lint                | ESLint 9 flat config, `jsx-a11y` in strict mode, type-aware rules                                   |

Rationale and trade-offs for each choice are recorded in [`docs/adr/`](docs/adr).

## Requirements

- Node.js >= 22.13 (`.nvmrc` pins the major; 22.13 is what pnpm 11.25 itself requires)
- pnpm 11.25.0

The `packageManager` field pins the pnpm version, and pnpm 10+ downloads that exact version on
first use. Keep it aligned with the version the team actually runs: a pin nobody has installed
turns every fresh clone into a surprise download, and a failed download leaves a broken shim
rather than a clear error. To raise it, change the field and tell the team in the same PR.

`pnpm-workspace.yaml` holds pnpm's supply-chain policy exemptions. pnpm 11 applies a cooldown to
freshly published versions; the file records which versions were deliberately allowed through it,
currently the `typescript-eslint` 8.70.0 packages. It is committed on purpose: without it a clean
install elsewhere can resolve differently from the one that produced the lockfile. Remove an entry
once the version has aged past the cooldown.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

## Scripts

| Command               | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`            | Dev server with HMR                                                             |
| `pnpm build`          | Type-check the project references, then produce the production bundle           |
| `pnpm preview`        | Serve the production build on port 4173                                         |
| `pnpm lint`           | ESLint over the whole repo                                                      |
| `pnpm typecheck`      | TypeScript, no emit                                                             |
| `pnpm test`           | Unit and component tests                                                        |
| `pnpm test:coverage`  | Same, with a V8 coverage report                                                 |
| `pnpm test:a11y`      | Playwright suite: axe scan, keyboard, focus, 200% zoom, target size             |
| `pnpm check:contrast` | Verifies every token pair against its WCAG threshold, AA blocking, AAA reported |
| `pnpm verify`         | Everything above, in the order CI runs it                                       |

Run `pnpm verify` before opening a pull request; it is the same gate CI applies.

## Project layout

```
src/
  components/<Name>/     Component, its CSS, its tests, and a barrel export
  styles/tokens.css      Design tokens; the single source of colour truth
  styles/global.css      Reset, base typography, one shared focus indicator
e2e/                     Playwright accessibility and keyboard suites
scripts/check-contrast.mjs  Contrast budget guard used by CI
design/                  The contract between Claude Design and Claude Code
docs/accessibility.md    AA criteria, manual owners, and the costed path to AAA
docs/accessibility-statement.md  Source for the public accessibility statement
docs/adr/                Architecture decisions with their trade-offs
```

## Accessibility contract

Conformance target is WCAG 2.2 AA and that is what the public statement declares. Several AAA
enhancements are implemented anyway, because they were cheap to build in and expensive to
re-earn: 7:1 body-text contrast, 44 x 44 px targets, an enhanced focus indicator, reduced-motion
support. CI enforces the AA thresholds and prints the distance to AAA as advisory output, so the
gap stays a number someone can act on. Set `CONTRAST_LEVEL=aaa` and `A11Y_LEVEL=aaa` to make it
blocking.

Automated checks cover roughly a third of WCAG failures. The rest is manual and listed in
[`docs/accessibility.md`](docs/accessibility.md), including the screen reader matrix and the
criteria that no tool can verify.

Two rules keep the codebase honest:

1. **No new colour outside `src/styles/tokens.css`.** Every pair a user can see must appear in
   the manifest in `scripts/check-contrast.mjs` with its pair kind, or CI does not know to guard
   it.
2. **No custom interactive widget without React Aria.** If a pattern is missing from React Aria,
   raise it in an ADR before hand-rolling roles and key handlers.

## Design workflow

The visual design is produced on a Claude Design canvas and implemented from specs, with the
repository holding the contract between the two. `design/README.md` describes the loop; the short
version is that the canvas may only use components from `design/component-exports.generated.md`
and tokens from `src/styles/tokens.css`, both of which CI verifies.

Regenerate the component list after upgrading React Aria:

```bash
pnpm run design:inventory
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch and commit conventions, and the
accessibility checklist that every pull request carries.
