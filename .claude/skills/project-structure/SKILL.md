---
name: project-structure
description: Where every file goes in the Copernicus repository (Next.js 16 App Router, bounded-context modules). Use before creating, moving or naming any file or directory under src/, when adding a module, a query, a component, a widget, a server action, a data source, a test or a route, and when an import crosses a layer. Also use when check:structure fails.
---

# Project structure: placement rules

The repository is organised as bounded-context modules under a thin App Router. The decision is
`docs/adr/0009-project-structure.md`; the full map with examples is `docs/project-structure.md`;
the build enforces it with `pnpm check:structure` (`scripts/check-structure.mjs`). This skill is
the short version: answer "what am I adding" and follow the row.

## Step 1: which layer

```
src/
├── app/             Routing only. page.tsx, layout.tsx, route.ts, metadata, generateStaticParams.
├── widgets/         Blocks that cross modules or appear on every page (header, footer, alerts).
├── modules/<name>/  Bounded contexts. Everything a business area owns.
├── components/      React Aria wrappers. The only layer allowed to declare 'use client'.
├── shared/          No business nouns: i18n primitives, formatting, SEO, config, test helpers.
├── infrastructure/  Content sources, CMS/search clients, cache tags, env. Never imports a module.
├── content/         LEGACY. Do not add files. Migrating per docs/project-structure.md §9.
└── styles/          tokens.css, global.css.
```

Dependencies point down only: `app -> widgets -> modules -> shared | infrastructure -> shared`,
and `components -> shared`. Nothing imports upward. Cross-module imports go through
`@/modules/<name>` (the `index.ts`) and must be on the allowlist in `scripts/check-structure.mjs`.

## Step 2: the placement table

| I am adding...                                                 | It goes in                                                                 | Notes                                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A route, page, layout, loading or error UI                     | `app/(site)/<polish-route>/page.tsx`                                       | Calls queries, renders module UI/widgets, sets metadata. No logic, no asserted strings.    |
| A route handler (webhook, health, form POST without an action) | `app/api/<name>/route.ts`                                                  | Parse, delegate to a module, respond.                                                      |
| A type for a business noun (Facility, NewsItem, DutySlot)      | `modules/<owner>/model/<noun>.ts`                                          | Pure TS. Human-readable fields are `LocalizedText`. Closed enums as `as const` arrays.     |
| Validation rules or limits for a noun                          | `modules/<owner>/model/validation.ts`, constants beside the type           | Returns `ValidationIssue[]` with severity, the existing pattern.                           |
| A reference to another module's noun                           | Store the owner's `<Noun>Ref` type, imported from `@/modules/<owner>`      | Never copy the fields. `FacilityRef` is the model.                                         |
| Typed records / fixtures (today's data)                        | `modules/<owner>/data/sources/local/<plural>.ts`                           | Implements the repository directly. Only `data/` may import it.                            |
| The wire shape of an external source                           | `modules/<owner>/data/dto.ts`                                              | Never leaves `data/`.                                                                      |
| DTO -> model conversion                                        | `modules/<owner>/data/mappers.ts`                                          | Pure, tested against recorded fixtures. Validate the mapped result here.                   |
| The data access interface and the active source                | `modules/<owner>/data/repository.ts`                                       | `interface <Noun>Repository` plus `export const <noun>Repository`.                         |
| A CMS/API fetch for one module                                 | `modules/<owner>/data/sources/cms/`                                        | Uses `@/infrastructure/cms/client`, shapes with the module's mappers.                      |
| A use case a route calls (list, get, filter, group)            | `modules/<owner>/queries/<verb>-<noun>.ts`                                 | One file per use case. The only layer that may cache. Parses `searchParams` here.          |
| Caching: `cache()`, `unstable_cache`, `'use cache'`, tags      | Inside a query, tags from `@/infrastructure/cache/tags`                    | Must be correct if revalidation never fires (ADR 0005 rule 2). Live state: uncached.       |
| A server action (form mutation)                                | `modules/<owner>/actions/<verb>-<noun>.ts`                                 | `'use server'`. Validate with `model/`, return a result type, never throw for user errors. |
| A server component that renders one module's noun              | `modules/<owner>/ui/<Name>/<Name>.tsx` (+ `.css`, `.test.tsx`, `index.ts`) | Never `'use client'`. Interactivity comes from `@/components`.                             |
| A block used on every page or spanning modules                 | `widgets/<Name>/`                                                          | Server component. Imports modules via their index only.                                    |
| A React Aria wrapper or any `'use client'` file                | `components/<Name>/`                                                       | May import `shared` only. If it knows a business noun, it is module UI, not a wrapper.     |
| A locale-keyed string describing a record's state              | `modules/<owner>/copy.ts`                                                  | Page copy stays in the route until the next-intl phase (ADR 0008 §7).                      |
| A formatter or helper with no business meaning                 | `shared/lib/<topic>.ts`                                                    | Phone, dates, slugs, pagination math.                                                      |
| Locale, `LocalizedText`, `text()`, locale list                 | `shared/i18n/`                                                             |                                                                                            |
| Metadata, JSON-LD, canonical, hreflang helpers                 | `shared/seo/`                                                              |                                                                                            |
| Site name, base URL, the route registry                        | `shared/config/site.ts`, `shared/config/routes.ts`                         | `sitemap.ts` and breadcrumbs read the registry.                                            |
| A unit-test render helper or fixture factory                   | `shared/testing/`                                                          | Module fixtures stay in the module's `data/sources/local/` and are imported by its tests.  |
| Cache tag names                                                | `infrastructure/cache/tags.ts`                                             | Namespaced by module: `news:list`, `news:item:<slug>`. No string literal tags in queries.  |
| Reading `process.env`                                          | `infrastructure/env.ts` only                                               | Exported typed and parsed.                                                                 |
| An HTTP client for a vendor (CMS, search, maps)                | `infrastructure/<vendor>/client.ts`                                        | Knows transport and auth, not business shapes.                                             |
| A colour                                                       | `styles/tokens.css` + manifest in `scripts/check-contrast.mjs`             | Never in a component. Existing hard rule 1.                                                |
| A unit test                                                    | Beside the file: `<file>.test.ts(x)`                                       | No `__tests__` folders.                                                                    |
| A Playwright spec                                              | `e2e/<route>.spec.ts`, cross-cutting ones keep their current names         |                                                                                            |
| A build-time check or generator                                | `scripts/<verb>-<noun>.mjs`, wired into `verify` and CI                    | Same shape as `check-client-boundary.mjs`.                                                 |
| Middleware                                                     | `src/proxy.ts`                                                             | Next 16 name. Node runtime only.                                                           |
| A new module                                                   | `modules/<kebab-name>/` with `index.ts` + the folders it needs             | Register it in `MODULE_DEPENDENCIES` in `scripts/check-structure.mjs`, even as `[]`.       |

## Step 3: which module owns the noun

| Noun (Polish)                                                            | Module          |
| ------------------------------------------------------------------------ | --------------- |
| Punkt kontaktu, numer, faks, dostępność godzin, numer alarmowy           | `contacts`      |
| Placówka / szpital, oddział, poradnia, adres, dojazd, dostępność budynku | `facilities`    |
| Lekarz, personel, rola, specjalizacja                                    | `staff`         |
| Aktualność, kategoria, archiwum, załącznik                               | `news`          |
| Ogłoszenie, komunikat tymczasowy, alert krytyczny, baner                 | `announcements` |
| Dyżur, harmonogram, jednostka dyżurująca, NiŚOZ                          | `on-duty`       |
| Cennik, pozycja cennika, ważność ceny                                    | `pricing`       |
| Strona informacyjna, poradnik dla pacjenta, FAQ, data przeglądu          | `pages`         |
| Wyszukiwarka, indeks, wynik                                              | `search`        |
| Deklaracja dostępności, formularz zgłoszenia problemu                    | `accessibility` |

The noun decides, not the page. A department's phone number is a `ContactPoint` in `contacts`;
the department itself is in `facilities`. When two modules seem to own a thing, one owns it and
the other stores a `<Noun>Ref`.

Allowed cross-module edges (importer -> importee): `contacts -> facilities`, `staff -> facilities`,
`news -> facilities`, `announcements -> facilities`, `on-duty -> facilities, contacts`,
`pricing -> facilities`, `accessibility -> facilities`, `search -> *`. Anything else is a reviewed
change to `scripts/check-structure.mjs` with a one-line reason in the commit.

## Step 4: naming

- Files and directories: `kebab-case`. React components: `PascalCase` folder and file with
  `index.ts`, colocated `.css` and `.test.tsx` (existing convention).
- Queries verb-first: `list-news.ts`, `get-facility.ts`, `active-critical.ts`. Repositories
  `<Noun>Repository`, mappers `to<Noun>()`, DTOs `<Noun>Dto`.
- Route folders Polish (URLs are read aloud over the phone); everything else English.
- Imports across any boundary use `@/`. Relative imports only inside one module or one
  component folder.
- `index.ts` of a module: grouped re-export blocks, one per subfolder, alphabetical inside the
  block, `export type` for types, never anything from `data/dto.ts` or `data/sources/`.

## Step 5: before finishing

Run `pnpm check:structure` and `pnpm check:boundary`. If `check:structure` fails, the message
names the rule and the fix; do not add an exception to the script to make it pass unless the
change is a deliberate new cross-module edge. If a new kind of file has no row in this table, add
the row here and in `docs/project-structure.md` in the same change, and say so in the commit.

## Invariants this skill does not repeat

Colour only from tokens; `'use client'` only in `components/` and `providers.tsx`; interactive
widgets from React Aria through wrappers; primary content never client-only; user preferences
on `<html>` data attributes; every string locale-keyed. They are in `CLAUDE.md` and apply on top
of everything above.
