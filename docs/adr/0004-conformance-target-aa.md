# ADR 0004: Conformance target is WCAG 2.2 AA, with a documented path to AAA

- **Status:** accepted
- **Date:** 2026-09-08
- **Supersedes:** the AAA target assumed in ADR 0001, 0002 and 0003

## Context

The project brief set level AAA. Working through the criteria showed that AAA is not primarily an
engineering target: two criteria, 1.2.6 Sign Language and 3.1.5 Reading Level, require recurring
production and editorial budgets rather than code, and several others (2.2.3 No Timing, 3.3.9
Accessible Authentication Enhanced) depend on backend and vendor decisions outside this
repository. No funded plan exists for those today.

## Decision

Declare and enforce **WCAG 2.2 level AA**. Keep every AAA enhancement that is already
implemented, and track the remainder as a measured gap in `docs/accessibility.md`, with the
tooling able to switch to AAA enforcement through two environment variables.

## Options considered

**Declare AAA now and treat the gaps as debt**

- For: keeps the original ambition visible; no conversation about lowering a goal.
- Against: the public accessibility statement would overstate conformance, which is a legal and
  reputational exposure in its own right, independent of how good the site actually is. It also
  makes CI dishonest: either the AAA checks fail permanently and get ignored, or they are disabled
  and the claim rests on nothing.
- Long term: teams that declare a level they cannot hold end up with a red build they route
  around, and the accessibility work loses its enforcement mechanism entirely.

**Declare AA and drop AAA from the codebase**

- For: simplest to reason about; no advisory output to interpret.
- Against: throws away work already done. The palette clears 7:1, targets are 44px, the focus ring
  meets the enhanced criterion. Relaxing those to AA minimums invites drift, and re-earning them
  later costs a design pass across every component.
- Long term: the AAA option closes quietly, and reopening it becomes a redesign rather than a
  decision.

**Chosen: declare AA, keep the AAA enhancements, measure the gap**

- For: the public claim matches verified reality. CI blocks AA regressions, so the gate is real.
  The AAA thresholds still run on every build as advisory output, so the distance to AAA is a
  number someone can act on rather than a guess. Flipping `CONTRAST_LEVEL=aaa` and
  `A11Y_LEVEL=aaa` in CI is the whole technical cost of changing the decision later.
- Against: two levels in the tooling means contributors must read the output carefully; an `AA`
  line is a pass, not a failure. Advisory checks can be ignored if nobody owns them, so the gap
  table needs an owner per row.
- Long term: this is the arrangement that keeps AAA reachable without claiming it. The stricter
  values cost nothing while they hold, and the moment they stop holding, the advisory output says
  so on the same build.

## Consequences

- The accessibility statement declares AA. `docs/accessibility-statement.md` is its source, and
  the wording "AA, with individual AAA enhancements" is the only permitted stronger phrasing.
- `pnpm check:contrast` fails on an AA breach and prints a "Gap to AAA" block. The Playwright
  suite behaves the same way, recording an `aaa-gap` annotation.
- New colours should clear 7:1 where practical. When one cannot, it must still clear AA, and the
  advisory output will record it. That is an accepted outcome, not a build failure.
- Deciding to pursue AAA is a product and budget decision. `docs/accessibility.md` carries the
  cost estimate per criterion so that decision can be made with numbers.
