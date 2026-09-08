# ADR 0003: Layered accessibility testing

- **Status:** accepted
- **Date:** 2026-09-08

## Decision

Four layers, cheapest first:

1. **Static:** `eslint-plugin-jsx-a11y` in strict mode, errors not warnings.
2. **Unit:** Vitest + Testing Library, queried by role and accessible name, so a test fails when
   the accessibility tree changes even if the DOM still looks fine.
3. **Browser:** Playwright + axe-core across Chromium, Firefox and WebKit, in light and dark
   themes, plus explicit assertions for target size, focus visibility and 200% text zoom. AA
   findings fail the build; AAA findings are recorded as an `aaa-gap` annotation unless
   `A11Y_LEVEL=aaa` is set.
4. **Manual:** the screen reader matrix in `docs/accessibility.md`, per release.

## Why not rely on axe alone

**For axe-only**

- One dependency, fast, and it catches the common markup failures.

**Against**

- Axe detects roughly a third of WCAG failures. It cannot judge whether a link text makes sense on
  its own (2.4.9), whether the focus indicator is obscured by a sticky header (2.4.11), or whether
  the reading level fits (3.1.5).
- A green axe run creates false confidence, which is the specific failure mode that produces
  audit-passing sites people still cannot use.

**Long term**

The layers exist so that a regression is caught by the cheapest mechanism that can catch it. The
contrast script and target-size assertions are the two highest-value custom checks, because those
thresholds are exactly what drifts silently during a redesign. They are also the two that carry
the AAA advisory output, which is how the gap in ADR 0004 stays a number rather than a memory.

## Consequences

- CI runs two jobs; the accessibility job installs browsers and is the slower one.
- New AAA-relevant behaviour should arrive with the assertion that guards it, in the same PR.
- Manual screen reader passes stay mandatory. They are the only layer that verifies the
  experience rather than the markup.
