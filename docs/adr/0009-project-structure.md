# ADR 0009: Project structure (bounded-context modules over a thin App Router)

- **Status:** accepted
- **Date:** 2026-09-15
- **Supersedes:** the implicit `app/` + `components/` + `content/` layout that grew out of the
  bootstrap and the Next.js migration

## Context

The repository has three source directories today: `src/app` (routes), `src/components` (React
Aria wrappers, the client boundary) and `src/content` (the contact-point model, its fixtures,
queries, validation and copy, all in one flat folder). That was right for one route. It stops
being right at the second bounded context, which is where the next iteration lands: facilities
get their own pages, news needs an import of roughly a thousand items, on-duty state and
temporary notices are dynamic data with their own lifecycle.

Without a decision, files are placed by whoever writes them. Three sessions in, `src/content`
already mixes four concerns (types, fixture data, application queries, UI copy) and
`src/components/PhoneLink` imports business copy from it, so a "React Aria wrapper" now knows
what a switchboard is. Neither is a defect yet. Both are the shape of the codebase in two years if
nothing says otherwise.

What the structure has to serve, in priority order:

1. **The maintenance owner is the hospital's IT department** (see `../../CLAUDE.md` and
   `../architecture-decisions` in the project notes). Predictability and a small vocabulary beat
   architectural completeness. A developer who has never seen the repository must find the file
   for "the phone number of the oncology registration" in under a minute.
2. **A team of 5 to 15 front-end developers over 5 to 7 years**, working on independent
   business areas at the same time, with merge conflicts and ownership as the daily cost.
3. **Existing hard rules must stay enforceable by script**: colour only from `tokens.css`,
   `'use client'` only in the wrapper layer, primary content never client-only.
4. **Open decisions must stay open**: no CMS yet, hosting undecided, the `[locale]` segment comes
   in a later phase (ADR 0008). The structure must absorb each of those without a re-layout.
5. **Extractability**: a business area should be liftable into a workspace package, or in the
   far case a separately deployed front-end, without rewriting its imports.

The brief for this decision asked for Clean Architecture, Feature-Sliced Design and
Domain-Driven Design applied together, with separate top-level layers for `domains`, `features`,
`widgets`, `shared`, `infrastructure`, `integrations`, `services` and `ui`. That is the vocabulary
of a product with heavy write-side logic and many features per domain. This site is read-mostly,
each domain has one to three views, and eight top-level layers would give a five-person team more
places to put a file than it has files. The decision below keeps the principles and drops the
ceremony.

## Decision

One vocabulary, six source layers, one direction of dependency:

```
src/
├── app/              Routing only: page, layout, route, metadata, static params. No logic.
├── widgets/          Page blocks that cross modules: header, footer, emergency strip, alerts.
├── modules/          Bounded contexts. Everything a business area owns, in one folder.
├── components/       React Aria wrappers. The only 'use client' layer (with providers.tsx).
├── shared/           Code with no business noun in it: i18n primitives, dates, SEO, config.
├── infrastructure/   How data gets in and stays fresh: content sources, cache tags, env.
└── styles/           tokens.css and global.css. Unchanged.
```

Dependencies point downwards only, and every arrow that crosses a module boundary goes through
that module's `index.ts`:

```
app ──► widgets ──► modules ──► shared
 │         │          │  └────► infrastructure ──► shared
 │         └──────────┼───────► components ──────► shared
 └────────────────────┘
```

### 1. A module is a bounded context and holds its own layers

`src/modules/<name>/` is the unit of ownership. Inside it the Clean Architecture rings appear as
folders, innermost first:

```
modules/news/
├── index.ts        Public API. The only path other layers may import: `@/modules/news`.
├── model/          Types, invariants, validation, constants. Pure TypeScript. No React, no Next.
├── data/           Repository port, DTOs, mappers, and the sources that implement the port.
│   ├── repository.ts
│   ├── dto.ts
│   ├── mappers.ts
│   └── sources/{local,cms}/
├── queries/        Application layer: the use cases routes call. The only place for caching.
├── actions/        Server actions, only where a route mutates. Absent in most modules.
├── ui/             Server components specific to this module. Never 'use client'.
└── copy.ts         Locale-keyed strings the module owns (the existing contactCopy pattern).
```

Not every module has every folder. A module is created when a business noun needs a type; it is
not created for a page. `docs/project-structure.md` lists the initial set (contacts, facilities,
staff, news, announcements, on-duty, pricing, pages, search, accessibility) and the anatomy of
each folder.

### 2. `app/` is routing, nothing else

A `page.tsx` calls one or more queries, passes the result to module UI or widgets, and sets
metadata. It contains no data shaping, no filtering, no strings a test would want to assert on.
The test for a route file is that it could be deleted and rewritten from the screen spec in ten
minutes. Route handlers under `app/api/` follow the same rule: parse, delegate to a module, return.

### 3. `components/` stays business-free

The wrapper layer keeps its name, because `scripts/check-client-boundary.mjs`, CI and every
document already point at it. It gains one rule: a wrapper may import from `shared/` only. A
component that knows what a contact point or a facility is belongs in `modules/<x>/ui/`.
`PhoneLink` is the first file this moves.

### 4. `shared/` has no business nouns

`shared/` is for code that would make sense in a different hospital's repository unchanged:
`LocalizedText` and `text()`, date and phone formatting, metadata helpers, the route registry,
site configuration. The review question is literal: if a file under `shared/` mentions a
facility, a department, a contact point or a news item, it is in the wrong layer.

### 5. `infrastructure/` is transport, not business

The CMS client, the search index client, the cache tag registry, environment parsing and the
revalidation plumbing live here. Infrastructure never imports a module; modules import
infrastructure. A module's `data/sources/cms/` uses `infrastructure/cms/client.ts` to fetch and
its own `mappers.ts` to shape.

### 6. Enforced by script, like the other rules

`scripts/check-structure.mjs` walks `src/`, resolves every import, and fails the build on: an
upward import, a deep import into another module, a `components/` file importing a module, a
business import in `shared/`, `data/sources/**` or `data/dto.ts` read from outside its own
`data/`, and a relative import that climbs out of its module. It runs in `pnpm verify` and in CI
between the client-boundary check and the inventory check. Cross-module dependencies are an
explicit allowlist in the script, in the same way colour pairs are a manifest in
`check-contrast.mjs`: adding one is a reviewed change, not a drift.

### 7. The AI working rules point at one skill

`.claude/skills/project-structure/SKILL.md` is the placement table: "I am adding X, it goes in
Y". `CLAUDE.md` gets one hard rule pointing at it. Every future session, human or model, starts
from the same map.

## Consequences

**Pros**

- One question to answer when creating a file: which module owns this noun. The layer inside the
  module follows from what the file is (type, source, query, component).
- Ownership maps to folders, so `CODEOWNERS` is one line per module and a review request lands
  with the right people. Two developers on `news` and `facilities` touch disjoint trees.
- The public API rule (`index.ts`) makes a module extractable to `packages/<name>` with a path
  alias change and nothing else. That is the whole of the "prepared for micro-frontends" claim,
  and it is enough: the day the hospital needs a separately deployed front-end is not a day to
  plan for with folders.
- The CMS decision is absorbed at `data/sources/cms/`, hosting at `infrastructure/`, the locale
  segment at `app/[locale]/`. None of them moves a module.
- The existing checks keep working unchanged, and the new one has the same shape, so the team
  learns one pattern for "the build enforces the architecture".

**Cons**

- Ceremony per module: five folders and an `index.ts` for a bounded context that today has one
  type and one page. Accepted, because the alternative is deciding later where 40 files go.
- The `index.ts` files become merge hotspots when several developers extend one module at once.
  Mitigation in `docs/project-structure.md`: grouped re-export blocks, one block per subfolder.
- Import-direction checking by script is coarser than a lint plugin: it works at path level, has
  no autofix, and reports after the fact. Chosen anyway for zero dependencies and consistency with
  the other checks; the plugin route is recorded below as the upgrade path.
- The migration of `src/content` is real work touching every route and its tests, and it must
  land as one change so the legacy allowance in the checker can be removed. Plan in
  `docs/project-structure.md`.

**Long-term effects**

- Growth inside a module is expected and has a rule: when `ui/` passes roughly fifteen components
  it is split by feature (`ui/archive/`, `ui/list/`), still inside the module. The top level does
  not grow with the product; the module count grows with the business, which is slow.
- `shared/` is where structure dies in most codebases. The no-business-noun test is the guard,
  and the checker makes an import of a module from `shared/` a build failure, so the drift cannot
  compile.
- When a module gains write-side logic (a booking flow, a form with server state), `actions/`
  already exists and the checker already keeps mutations out of `ui/` and `app/`.
- The vocabulary (`modules`, `widgets`, `components`, `shared`, `infrastructure`) is one that a
  developer hired from any Angular, Nest or FSD background recognises within a day. That is the
  hiring-pool argument from ADR 0005 applied to folders.

## Alternatives considered

**Separate `domains/` and `features/` layers (the brief).** Correct for a product where domain
logic is reused by many features and features are numerous per domain. Rejected here because each
domain has one to three read views, so the split produces two folders per noun with three files
each and a permanent "is this a feature or a domain" question for a team that should not have to
ask it. The internal `model/` and `queries/` folders carry the same separation without the
top-level ceremony.

**Full Feature-Sliced Design (`entities/features/widgets/pages`, slice segments).** FSD's layer
discipline is kept (downward-only, public API per slice), its vocabulary is not. `entities` and
`features` are the same split as above, and FSD's `pages` layer duplicates what the App Router
already forces.

**Classic `components/hooks/utils/lib/pages`.** The default of every starter, and fine to about
fifty views. Rejected because it sorts files by what they are made of instead of what they are
about, so a change to "how facilities are shown" touches five folders and the ownership of any
file is unknowable from its path. This is the structure the brief asked not to end up with, and
the reason is sound.

**Dependency injection with repository interfaces bound at a composition root.** The textbook
Clean Architecture answer to "where does the CMS adapter live". Rejected as a default: a
container or a factory per module is a second thing to learn for a team whose data layer is a
read-only content fetch. `repository.ts` in each module exports the port and the bound instance in
one file; the day two implementations must coexist at runtime, that file is the seam.

**`eslint-plugin-boundaries` instead of a custom script.** More precise, IDE feedback while
typing, autofix for some rules. Deferred rather than rejected: the custom script has zero new
dependencies, matches the two checks the team already knows, and the rules it encodes are the
same ones the plugin would. If the plugin is adopted later, `check-structure.mjs` is deleted and
its allowlist becomes the plugin configuration. Both cannot coexist: two sources of truth for one
rule is worse than either.

**Moving the existing code now, in this change.** Rejected in favour of a documented migration
plan, so the structure decision can be reviewed on its own and the code move can be verified by
`pnpm verify` as a separate, revertible commit.
