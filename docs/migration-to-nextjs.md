# Migration: Vite SPA to Next.js App Router

**Status: completed on 2026-09-08.** Decision and rationale:
`adr/0005-rendering-strategy-and-hosting.md`. The plan below is kept as the record of what was
done and why; the section at the end lists what the plan got wrong, which is the part worth
reading before the next framework-level change.

Verified before landing: ESLint clean, `tsc --noEmit` clean, 6 unit tests passing, `next build`
producing static output for `/`, and the full Playwright suite (10 tests) green against the
standalone server.

## What survives untouched

- `src/styles/tokens.css` and the contrast budget in `scripts/check-contrast.mjs`
- `src/components/**`: the wrapper layer is exactly what the App Router needs
- `e2e/**`: the Playwright accessibility and keyboard suites
- `docs/**`, `design/**`, the PR template, the issue template
- `.editorconfig`, `.gitattributes`, `.prettierrc.json`, the commit conventions

## What is replaced

| Now                                              | After                                            |
| ------------------------------------------------ | ------------------------------------------------ |
| `vite`, `@vitejs/plugin-react`, `vite.config.ts` | `next@16`, `next.config.ts`                      |
| `@tailwindcss/vite`                              | `@tailwindcss/postcss` plus `postcss.config.mjs` |
| `index.html`, `src/main.tsx`                     | `src/app/layout.tsx`, `src/app/page.tsx`         |
| Vitest config inside `vite.config.ts`            | standalone `vitest.config.ts`                    |
| Playwright `webServer: vite preview`             | `next build && next start`                       |
| `tsconfig.app.json` include list                 | Next's `tsconfig.json` with the `next` plugin    |

## Order of operations

1. **Dependencies.** Add `next@^16.3.4`, `@tailwindcss/postcss@^4.3.3`,
   `eslint-config-next@^16.3.4`. Remove `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`.
   Keep `vitest`, which no longer needs Vite as a peer through the app config. Node stays at
   `>=22.13`, which satisfies Next's `>=20.9`.
2. **Config files.** `next.config.ts` with `output: 'standalone'` and nothing platform-specific.
   `postcss.config.mjs` with the Tailwind plugin. `vitest.config.ts` carrying over the jsdom
   environment, the setup file and the coverage settings.
3. **App shell.** `src/app/layout.tsx` renders `<html lang="pl">`, imports
   `src/styles/global.css`, and mounts the skip links plus the landmark structure.
   `src/app/page.tsx` becomes the homepage. Metadata moves from `index.html` into the
   `metadata` export.
4. **Client boundary.** Add `'use client'` to the first line of every file under
   `src/components/**` that imports React Aria. Verified fact behind this step: the library ships
   no `"use client"` directives of its own. Add a `providers.tsx` client component holding
   `RouterProvider` wired to `useRouter`, and mount it in the layout. Then run
   `pnpm run check:boundary`: it lists the client surface and fails if the directive appears
   anywhere else.
5. **Routes.** Create the route folders from the table in
   `../design/information-architecture.md`, each initially a server component returning static
   content. Set `revalidate` per the tier column.
6. **Tests.** Point Playwright at `next build && next start` on port 3000. Unit tests need no
   change; they test components, not the framework.
7. **Lint.** Add `eslint-config-next` to the flat config, in the block that already scopes
   type-aware rules to `ts`/`tsx`. Keep `jsx-a11y` strict as the primary accessibility gate;
   Next's own rules are additive.
8. **CI.** Update the build step. `pnpm run design:inventory:check` and
   `pnpm run check:boundary` are already wired into the verify gate and the workflow.
9. **Verify.** `pnpm verify` plus `pnpm test:a11y`. The accessibility suite now also proves that
   content exists in the server-rendered HTML, which is the defect this whole migration addresses.
   Add one assertion for that explicitly: fetch a route with JavaScript disabled and check that
   the phone number for the emergency department is in the response body.

## Risks

- **Client boundary creep.** One `'use client'` in the wrong place pulls a subtree into the
  bundle. Mitigation: `pnpm run check:boundary` is already in the verify gate and in CI, so the
  wrapper layer stays the only place that directive appears. A bundle size check belongs in CI
  too, once real pages exist.
- **Tailwind 4 with PostCSS.** Behaves the same as the Vite plugin, but the `@theme inline`
  block in `global.css` must keep working; verify the generated custom properties after step 2.
- **Two test runners sharing a transform.** Vitest without the Vite config still needs the React
  plugin for JSX in tests. Confirm `vitest.config.ts` includes it, or tests fail on the first
  `.tsx` import.
- **ISR under self-hosting.** Not a migration risk, but do not add `revalidate` values that the
  deployment cannot honour. Rule 2 of ADR 0005 keeps correctness independent of it.

## What the plan got wrong

Three things surfaced only when the migration actually ran. All are now reflected in the
configuration, but they are worth knowing before anyone changes the build layer again.

**Next 16 removed the `eslint` key from `next.config.ts`.** Setting `eslint.ignoreDuringBuilds`
is no longer a valid option and fails type checking with `TS2353`. Linting is a separate step in
`pnpm verify` and in CI anyway, so nothing was lost.

**`jsx` must be `react-jsx`, not `preserve`.** Next rewrites the key during the build and says so
in the output. It also appends `.next/dev/types/**/*.ts` to `include`. Both are now in the
committed `tsconfig.json` so the file does not change under anyone's feet.

**`next start` does not work with `output: 'standalone'`.** Next prints a warning and the correct
command is `node .next/standalone/server.js`, which needs `.next/static` and `public` copied
beside it first. That is what `scripts/prepare-standalone.mjs` does, in Node rather than a shell
one-liner so it also works on Windows. The `start` script and the Playwright `webServer` both use
it, which turns out to be an improvement on the original plan: the accessibility suite now
exercises the exact artefact that gets deployed.

A fourth, smaller consequence: `next-env.d.ts` references types that Next generates under
`.next/types`, so a standalone `tsc --noEmit` cannot run before a build. `pnpm verify` and the CI
workflow therefore run the type check **after** the build. `next build` type-checks the project
itself, so this is belt and braces rather than the only gate.

## What was not adopted

**`eslint-config-next`.** It would add Next's own rules, including a second accessibility ruleset
alongside `jsx-a11y` in strict mode. Two overlapping a11y rulesets produce duplicate findings and
disagreement about which one is authoritative, and the flat-config story for it is still awkward.
The rules genuinely worth having are `no-img-element` and `no-html-link-for-pages`; revisit when
the first real images and cross-route links land, and add them individually rather than the whole
preset.
