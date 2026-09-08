# Contributing

## Branches

`main` is protected and always deployable. Work happens on short-lived branches:

```
feat/<scope>-<short-description>
fix/<scope>-<short-description>
a11y/<criterion>-<short-description>
chore/<short-description>
```

Example: `a11y/2.4.13-focus-appearance-tokens`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). The type drives the changelog and
makes an accessibility fix findable later:

```
feat(nav): collapse the main navigation below 640px
fix(form): announce validation errors with aria-errormessage
a11y(button): raise the minimum target area to 44x44 px
docs(adr): record the styling decision
chore(deps): bump react-aria-components to 1.21
```

Use `a11y` for changes whose purpose is a WCAG criterion, even when they also look like a fix.
Reference the criterion in the body: `Refs WCAG 2.2 SC 2.5.5 (AAA)`.

## Before you open a pull request

```bash
pnpm verify
```

That runs formatting, lint, types, the contrast budget, unit tests and the build. Run
`pnpm test:a11y` too when your change touches markup, styling or interaction.

## Pull requests

Every PR carries the accessibility checklist from `.github/pull_request_template.md`. Unchecked
boxes block the merge. Say which browser and which assistive technology you used; "not tested"
is an acceptable answer, "N/A" on a box that clearly applies is not.

## Definition of done for a UI change

Conformance target is WCAG 2.2 AA (see `docs/adr/0004-conformance-target-aa.md`). Items 3 and 7
below are stricter than AA on purpose: they are the AAA enhancements the project already holds.

1. Keyboard-only path works, in a sensible order.
2. Screen reader announces name, role, state and any change of state.
3. Contrast verified by `pnpm run check:contrast`, not by eye. Aim for 7:1 on body text; 4.5:1 is
   the hard floor, and anything between the two shows up in the AAA gap report.
4. Works at 320 px width and at 200% text size.
5. Behaves correctly in `forced-colors` mode and with `prefers-reduced-motion`.
6. Covered by a test that would fail if the behaviour regressed.
7. Interactive targets at least 24 x 24 px (AA floor), 44 x 44 px unless the PR records a reason.

## Optional local hooks

Commit hooks are deliberately not installed by default.

- **Pros of adding husky + lint-staged + commitlint:** malformed commits and unformatted code
  never reach the remote, so CI failures drop.
- **Cons:** every clone runs a post-install script, hooks slow each commit, and contributors
  who work in unusual environments hit friction they cannot always debug.
- **Long term:** with more than two or three regular contributors the hooks pay for themselves.
  Until then CI is the cheaper gate. Raise an ADR when the team grows.
