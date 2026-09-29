# Project structure

The map of `src/`. Decision and trade-offs in `adr/0009-project-structure.md`; the placement
table for day-to-day work in `../.claude/skills/project-structure/SKILL.md`; enforcement in
`../scripts/check-structure.mjs` (`pnpm check:structure`, part of `pnpm verify`).

Read this when creating a directory, a module or a file type you have not created in this
repository before. For "where does this one file go", the skill is faster.

## 1. The tree

```
copernicus/
├── .claude/skills/project-structure/   Placement rules for AI sessions (kept in sync with this file)
├── .github/                            CI, PR template, issue templates
├── design/                             Design-to-code contract: IA, canvas, screen specs (unchanged)
├── docs/                               ADRs, accessibility, this file
├── e2e/                                Playwright: cross-cutting a11y specs + one spec per route
├── public/                             Static files served as-is
├── scripts/                            Build-time checks and generators (Node, .mjs)
└── src/
    ├── app/                            ROUTING ONLY
    │   ├── layout.tsx                  Root layout: <html lang>, skip links, header/footer widgets
    │   ├── (site)/                     Route group: pages with the standard chrome
    │   │   ├── page.tsx                /
    │   │   ├── aktualnosci/            /aktualnosci, /aktualnosci/[slug], /aktualnosci/archiwum
    │   │   ├── ogloszenia/             /ogloszenia, /ogloszenia/[slug]
    │   │   ├── szpitale/               /szpitale, /szpitale/[slug]
    │   │   ├── oddzialy/               /oddzialy, /oddzialy/[slug]
    │   │   ├── poradnie/               /poradnie, /poradnie/[slug]
    │   │   ├── lekarze/                /lekarze, /lekarze/[slug]
    │   │   ├── wazne-telefony/         /wazne-telefony
    │   │   ├── dyzury/                 /dyzury
    │   │   ├── kontakt/                /kontakt
    │   │   ├── cennik/                 /cennik
    │   │   ├── dla-pacjenta/           Guides, FAQ: /dla-pacjenta/[...slug]
    │   │   ├── szukaj/                 /szukaj (uncached)
    │   │   ├── deklaracja-dostepnosci/
    │   │   └── zglos-problem-dostepnosci/
    │   ├── api/                        Route handlers: parse, delegate to a module, respond
    │   │   ├── revalidate/route.ts     CMS webhook -> revalidateTag (infrastructure/cache)
    │   │   └── health/route.ts
    │   ├── sitemap.ts                  Built from the route registry + module queries
    │   ├── robots.ts
    │   ├── not-found.tsx
    │   └── error.tsx
    │   (i18n phase, ADR 0008: the (site) group moves under app/[locale]/, nothing else changes)
    │
    ├── proxy.ts                        Next 16 middleware (renamed from middleware.ts). Node runtime.
    ├── providers.tsx                   React Aria providers. 'use client' allowed here.
    │
    ├── widgets/                        PAGE BLOCKS THAT CROSS MODULES. Server components.
    │   ├── SiteHeader/                 Utility bar, main nav, preferences, language links
    │   ├── SiteFooter/
    │   ├── EmergencyStrip/             Reads modules/contacts; shown on every page
    │   ├── CriticalAlertBanner/        Reads modules/announcements (kind: critical)
    │   ├── LanguageBanner/             Accept-Language differs from route locale (ADR 0008 §5)
    │   ├── HomeEntryPoints/
    │   └── Breadcrumbs/                Route-aware wrapper around components/Breadcrumbs
    │
    ├── modules/                        BOUNDED CONTEXTS. One folder per business area.
    │   ├── contacts/                   ContactPoint, EmergencyContact, availability, the three views
    │   ├── facilities/                 Facility, Department, Clinic, location, accessibility notes
    │   ├── staff/                      Person, roles, consent-aware listing
    │   ├── news/                       NewsItem, categories, archive, import from the old site
    │   ├── announcements/              Announcement (ogłoszenie), Notice (komunikat), CriticalAlert
    │   ├── on-duty/                    DutySchedule, currently on-duty units, out-of-hours care
    │   ├── pricing/                    PriceListItem with validity, versioned
    │   ├── pages/                      Static informational pages, guides, FAQ, review dates
    │   ├── search/                     Site search: index, query parsing, results
    │   └── accessibility/              Statement content, feedback form action, conformance data
    │
    ├── components/                     REACT ARIA WRAPPERS. The only 'use client' layer.
    │   └── <Name>/<Name>.tsx, <Name>.css, <Name>.test.tsx, index.ts     (unchanged convention)
    │
    ├── shared/                         NO BUSINESS NOUNS.
    │   ├── i18n/                       Locale, LocalizedText, text(), locales, next-intl config
    │   ├── lib/                        phone.ts, dates.ts, slug.ts, assert.ts, pagination.ts
    │   ├── seo/                        metadata(), jsonLd(), canonical(), hreflang()
    │   ├── a11y/                       Helpers with no UI: visually-hidden text, id generators
    │   ├── config/                     site.ts (name, base URL), routes.ts (route registry)
    │   ├── types/                      Utility types (Brand, DeepReadonly, ISODate)
    │   └── testing/                    Render helpers, fixtures factories for unit tests
    │
    ├── infrastructure/                 TRANSPORT AND FRESHNESS. Never imports a module.
    │   ├── content/                    ContentSource abstraction: local | cms, chosen by env
    │   ├── cms/                        client.ts (fetch + auth), later graphql/ or rest/
    │   ├── cache/                      tags.ts (the tag registry), revalidate.ts
    │   ├── search/                     Index client (when a search engine is chosen)
    │   ├── env.ts                      Parsed, typed environment; the only place process.env is read
    │   └── logger.ts
    │
    ├── content/                        LEGACY. Migrates into modules/contacts + facilities + shared.
    └── styles/                         tokens.css, global.css (unchanged)
```

## 2. Layer rules

| Layer            | May import from                                                     | May never                                                        |
| ---------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `app`            | `widgets`, `modules/<x>` (index), `components`, `shared`, `styles`  | contain business logic, strings a test asserts on, `'use client'`, deep module paths, `infrastructure` |
| `widgets`        | `modules/<x>` (index), `components`, `shared`                       | import `app`, `infrastructure`, module internals                 |
| `modules/<x>`    | own files, `shared`, `infrastructure`, `components` (from `ui/` only), other modules on the allowlist (index only) | import `app`, `widgets`, another module's internals, declare `'use client'` |
| `components`     | `shared`, `react-aria-components`, `next/*`                         | import `modules`, `widgets`, `app`, `infrastructure`             |
| `shared`         | `shared`                                                            | import anything else under `src/`; mention a business noun       |
| `infrastructure` | `shared`                                                            | import `modules`, `widgets`, `components`, `app`                 |

Two rules inside a module:

- `data/dto.ts` and `data/sources/**` are read only by `data/repository.ts` and `data/mappers.ts`.
  A DTO that reaches `queries/` or `ui/` means the CMS shape has leaked into the product.
- `model/` imports nothing from React or Next. It is the part of the module that would survive a
  framework change, and the part unit tests cover without a DOM.

Cross-module dependencies are an allowlist in `scripts/check-structure.mjs`. The initial set:

```
contacts      -> facilities
staff         -> facilities
news          -> facilities
announcements -> facilities
on-duty       -> facilities, contacts
pricing       -> facilities
search        -> (every module; it indexes them)
accessibility -> facilities
pages         -> (none)
facilities    -> (none)
```

`facilities` is the root of the graph because every other noun on a hospital site belongs to a
place. Adding an edge is a reviewed change to the script, with a one-line reason in the commit.

## 3. Anatomy of a module

```
modules/<name>/
├── index.ts
├── model/
├── data/
│   ├── repository.ts
│   ├── dto.ts
│   ├── mappers.ts
│   └── sources/
│       ├── local/
│       └── cms/
├── queries/
├── actions/
├── ui/
└── copy.ts
```

**`index.ts`**: the public API. Grouped re-export blocks, one block per subfolder, so two
developers adding to `queries/` and `ui/` at once do not conflict on the same lines. Types are
exported with `export type`. Nothing from `data/dto.ts` or `data/sources/` is ever re-exported.

**`model/`**: entity types (`news-item.ts`), value objects (`availability.ts`), closed enums as
`as const` arrays with derived types (the `contactCategories` pattern), invariants and limits as
named constants, `validation.ts` returning `ValidationIssue[]` in the existing shape. Every
human-readable field is `LocalizedText` (ADR 0008). No React, no Next, no fetch.

**`data/repository.ts`**: the port and its bound instance in one file.

```ts
export interface NewsRepository {
  list(params: NewsListParams): Promise<readonly NewsItem[]>;
  bySlug(slug: string, locale: Locale): Promise<NewsItem | null>;
  slugs(): Promise<readonly string[]>;
}

// The active source. Switching to the CMS is this line plus the cms/ folder; nothing above data/ changes.
export const newsRepository: NewsRepository = createLocalNewsRepository();
```

When `infrastructure/content` selects the source by environment, this becomes
`selectSource({ local: createLocalNewsRepository, cms: createCmsNewsRepository })`.

**`data/dto.ts`**: the wire shape of the external source, as it arrives, with the source's own
field names. Never imported outside `data/`.

**`data/mappers.ts`**: `toNewsItem(dto: NewsItemDto): NewsItem`. Pure functions, unit tested
against recorded fixtures. Validation of the mapped result happens here too, so a broken record in
the CMS fails at import, not at render.

**`data/sources/local/`**: typed TypeScript records, today's `src/content/facilities.ts` and
`contact-points.ts`. They implement the repository interface directly (no DTO step, the record
already is the model). This is the source until a CMS is chosen, and the fixture set for tests
afterwards.

**`data/sources/cms/`**: fetches through `infrastructure/cms/client.ts`, maps through `mappers.ts`.
Empty until the CMS decision.

**`queries/`**: the use cases a route calls. One file per use case, verb-first name:
`list-news.ts`, `get-news-item.ts`, `urgent-contact-points.ts`. A query composes the repository
with filtering, sorting, grouping and pagination, and returns model types or a view model
declared in the same file. **This is the only layer that may cache**: `cache()` for per-request
dedupe, `unstable_cache` or `'use cache'` with tags from `infrastructure/cache/tags.ts` for ISR
tiers. ADR 0005 rule 2 applies: the query must return correct data when revalidation never fires.
Queries that run in a GET form (the `/wazne-telefony` filter) parse `searchParams` here, so the
server path and any later enhanced client path share one implementation.

**`actions/`**: `'use server'` functions, only in modules where a route mutates (today:
`accessibility` for the feedback form). Parse and validate input with the module's `model/`
validators, delegate, return a discriminated result type, never throw for user errors.

**`ui/`**: server components that render this module's nouns: `NewsCard`, `ContactRow`,
`FacilityAddress`. Same folder convention as `components/`: `<Name>/<Name>.tsx`, `<Name>.css`,
`<Name>.test.tsx`, `index.ts`. Interactive behaviour comes from `@/components`; a module UI file
never declares `'use client'` (`check:boundary` enforces it). When `ui/` passes roughly fifteen
components, split by feature: `ui/archive/`, `ui/list/`, `ui/detail/`.

**`copy.ts`**: locale-keyed strings that describe the state of a record rather than the design of
a page (`hoursUnknown`, `numberInPreparation`). Page-level copy stays in the route until the
message catalogue phase, when both move to `next-intl` namespaces named after the module.

## 4. Data flow, in one line

```
source (local | cms) -> dto -> mapper -> model -> repository -> query (cache, shape) -> app/page -> module ui / widget -> components
```

Each arrow is a folder boundary the checker knows about. The two most common mistakes are a DTO
field used in a component (the mapper was skipped) and a fetch in a page (the query was skipped).

## 5. Examples

### Aktualności (news)

```
modules/news/
├── index.ts
├── model/
│   ├── news-item.ts          NewsItem, NewsCategory, Attachment
│   ├── validation.ts         title length, lead required, publishedAt is a past date
│   └── archive.ts            ArchiveYear, ArchiveMonth value objects
├── data/
│   ├── repository.ts         NewsRepository, newsRepository
│   ├── dto.ts                LegacyNewsDto (shape of the old site's export)
│   ├── mappers.ts            toNewsItem(), normaliseLegacyHtml()
│   └── sources/
│       ├── local/news.ts     Imported records, generated by scripts/import-news.mjs
│       └── cms/
├── queries/
│   ├── list-news.ts          Paginated list, ISR tag: tags.news.list
│   ├── get-news-item.ts      By slug, SSG; also serves generateStaticParams
│   ├── archive-index.ts      Years and months with counts
│   └── latest-news.ts        Homepage strip (three items)
├── ui/
│   ├── NewsCard/
│   ├── NewsList/
│   ├── NewsArticle/
│   └── ArchiveNav/
└── copy.ts                   publishedOn, readMore is NOT here (bare "więcej" is forbidden)

app/(site)/aktualnosci/
├── page.tsx                  listNews(searchParams) -> <NewsList>
├── [slug]/page.tsx           getNewsItem(slug) -> <NewsArticle>; generateStaticParams from slugs()
└── archiwum/[year]/page.tsx
```

### Ogłoszenia, komunikaty, alerty (announcements)

Three kinds, one module, because they share lifecycle fields (`validFrom`, `validTo`, `severity`,
`scope`) and differ in placement, which is the widget's concern, not the model's.

```
modules/announcements/
├── model/
│   ├── announcement.ts       kind: 'announcement' | 'notice' | 'critical'; scope: site | facility
│   └── validation.ts         a critical alert must have validTo; scope facility must name one
├── data/                     repository, local source, cms source
├── queries/
│   ├── list-announcements.ts Published, in validity window, by facility; ISR
│   ├── active-critical.ts    Uncached: correctness matters (ADR 0005 §2)
│   └── active-notices.ts     For a facility page
└── ui/
    ├── AnnouncementCard/
    └── NoticeList/

widgets/CriticalAlertBanner/  Calls activeCritical(); renders a role="region" with an accessible name,
                              never role="alert" on page load (it would interrupt the screen reader)
```

### Szpitale, oddziały, poradnie (facilities)

One module: a clinic without its facility is not a thing, and the three entities share address,
phones, accessibility notes and staff references. Separate modules would need three edges between
them on day one.

```
modules/facilities/
├── model/
│   ├── facility.ts           Facility, FacilityRef, FacilityId, FacilityType
│   ├── department.ts         Department, admission info, visiting hours
│   ├── clinic.ts             Clinic, referralRequired, registration info
│   ├── location.ts           Address, Coordinates, HowToGetThere, Parking
│   ├── accessibility-notes.ts  Entrance, lift, induction loop, assistance dog policy
│   └── validation.ts
├── data/
│   ├── repository.ts         FacilityRepository with facilities(), departments(), clinics()
│   └── sources/local/        facilities.ts (moved from src/content), departments.ts, clinics.ts
├── queries/
│   ├── list-facilities.ts
│   ├── get-facility.ts       With its departments, clinics and contact points (via contacts index)
│   ├── list-departments.ts   Grouped by facility
│   ├── get-department.ts
│   ├── list-clinics.ts       Filter by specialisation and referral requirement (GET form)
│   └── get-clinic.ts
└── ui/
    ├── FacilityCard/
    ├── FacilityAddress/      Postal address as <address>, map link, how to get there
    ├── AccessibilityNotes/
    ├── DepartmentHeader/
    └── ClinicRegistrationInfo/

app/(site)/szpitale/[slug]/page.tsx      SSG: getFacility(slug) + facilityContactPoints(facilityId)
app/(site)/oddzialy/[slug]/page.tsx      SSG
app/(site)/poradnie/page.tsx             SSG list with a server-rendered filter form
```

### Kontakty (contacts)

Today's `src/content`, minus what moves out. The three views of the IA are three queries.

```
modules/contacts/
├── model/
│   ├── contact-point.ts      ContactPoint, Phone, UnitRef, categories, audiences, limits
│   ├── availability.ts       Availability, DayRange, formatAvailability()
│   ├── emergency.ts          EmergencyContact, short codes
│   └── validation.ts         moved as-is
├── data/
│   ├── repository.ts
│   └── sources/local/contact-points.ts
├── queries/
│   ├── urgent-contact-points.ts        /wazne-telefony block 1
│   ├── facility-groups.ts              /wazne-telefony block 2, with the GET filter
│   ├── institutional-contact-points.ts /kontakt
│   ├── facility-contact-points.ts      /szpitale/[slug] local view
│   └── resolve-phones.ts               The switchboard fallback (fallback.ts today)
├── ui/
│   ├── PhoneLink/            Moved from components/: it knows contactCopy, so it is not a wrapper
│   ├── ContactRow/
│   ├── AvailabilityText/
│   └── FaxLine/              Exists so a fax can never render as a tel: link
└── copy.ts                   contactCopy, moved as-is
```

`shared/lib/phone.ts` takes `formatPhoneNumber`, `isE164`, `telHref`: they know digits, not
hospitals. `shared/i18n/` takes `locale.ts`.

### Dyżury (on-duty)

Dynamic data with a schedule and a "now": the module where ADR 0005 rule 2 matters most.

```
modules/on-duty/
├── model/
│   ├── duty-schedule.ts      DutySchedule: unit, facility, slots[], kind (night-and-holiday, pharmacy, ...)
│   ├── duty-slot.ts          DutySlot: from, to (ISO datetime with offset), contactPointId
│   └── validation.ts         slots do not overlap, every slot has a contact
├── data/
│   ├── repository.ts
│   ├── dto.ts                Shape of whatever system publishes the roster
│   ├── mappers.ts
│   └── sources/local/
├── queries/
│   ├── on-duty-now.ts        Uncached. Takes `now` as a parameter so it is testable and so the
│   │                         page can print "stan na HH:MM" (the visitor must see how fresh it is)
│   ├── upcoming-duties.ts    ISR is fine for the week view
│   └── duty-contact.ts       Joins contacts via @/modules/contacts index
└── ui/
    ├── OnDutyNow/            Renders the time of the data, never only "teraz"
    └── DutyTable/            A real <table> with <th scope>, not a grid of divs

app/(site)/dyzury/page.tsx   export const dynamic = 'force-dynamic'
```

## 6. Naming

- Directories and non-component files: `kebab-case` (`contact-point.ts`, `list-news.ts`).
- React components: `PascalCase` folder and file, `index.ts` re-export, colocated `.css` and
  `.test.tsx` (existing convention, applies in `components/`, `widgets/` and `modules/*/ui/`).
- Route folders: Polish, as in `design/information-architecture.md`. Everything else English.
- Queries: verb first (`list-`, `get-`, `active-`, `resolve-`). Repositories: `<Noun>Repository`.
  Mappers: `to<Noun>()`. DTOs: `<Noun>Dto`.
- Tests: colocated `*.test.ts(x)` for units; `e2e/<route>.spec.ts` per route plus the existing
  cross-cutting specs. No `__tests__` folders.
- Imports: always through the `@/` alias across layer boundaries. Relative imports only inside one
  module or one component folder. A relative path containing `../..` is a smell the checker flags
  when it leaves the module.
- CSS class prefix `cp-`, BEM, as today. Component styles beside the component; tokens only.

## 7. Working in a team of 5 to 15

Problems this structure predicts, and what answers each one.

**"Which module owns this?"** The noun decides, not the page. A department's phone number is a
`ContactPoint` (contacts), the department is a `Department` (facilities). When two modules seem to
own a thing, the thing is usually a reference: the owning module exports a `<Noun>Ref` type, the
other module stores the ref. `FacilityRef` is the model for this.

**`index.ts` merge conflicts.** Grouped blocks per subfolder, alphabetical within a block. Add to
the end of the right block. A conflict on `index.ts` is then a two-line resolution.

**`shared/` as a landfill.** The review question is mechanical: does the file mention a business
noun? Then it is a module file. The checker fails a `shared/` file that imports a module, so the
worst case cannot compile.

**Widget sprawl.** A widget exists because it crosses modules or appears on every page. A block
that renders one module's data on one route is that module's `ui/`. If `widgets/` passes about
twelve entries, some of them are module UI in the wrong place.

**Client surface growth.** Unchanged: `check:boundary` prints every `'use client'` file. The new
rule that `components/` may not import modules keeps wrappers reusable and small, so the client
bundle grows with widget count, not with business logic.

**Cache tag collisions.** Tags come from one registry, `infrastructure/cache/tags.ts`, namespaced
by module: `news:list`, `news:item:<slug>`, `facilities:all`. A string literal tag in a query is a
review comment.

**i18n key collisions** (later phase). Message namespaces are module names. A key belongs to the
module whose `ui/` renders it.

**Ownership and review.** `CODEOWNERS` maps `src/modules/<x>/` to a team or a pair; `components/`,
`shared/` and `infrastructure/` to whoever holds the architecture role, since a change there
affects everyone. Route files under `app/` follow the module they render.

**Onboarding.** The skill file and this document are the onboarding. A new developer's first task
is a query in an existing module: it touches `model/`, `queries/`, `index.ts` and a page, which is
the whole vertical slice in four files.

## 8. Decisions left to the implementer, with consequences

**Schema library (zod, valibot) or hand-written validators.** Today validators are hand-written
(`validation.ts` returns `ValidationIssue[]` with severity). Keeping that: zero dependencies,
issues carry the severity model the content-gap report needs, types are declared once in TS.
Cost: no parse-and-narrow in one step, so DTO validation at the CMS boundary is more code. Adding
zod when the CMS lands: DTOs become schemas, `toNewsItem(schema.parse(raw))` is one line, and
the CMS contract is testable against recorded payloads. Cost: a second place types are declared
(schema and inferred type), bundle weight if a schema ever reaches a client component, and a
dependency the hospital's IT department has to keep current. Long-term: whichever is chosen, keep
it inside `data/` and `actions/`; a schema in `ui/` means a boundary was skipped. Recommendation:
stay hand-written until `data/sources/cms/` exists, then decide with a real payload in hand.

**`unstable_cache` versus `'use cache'` (cacheComponents).** Both live only in `queries/`. `'use
cache'` is the direction Next is taking and gives per-function granularity with tags; it changes
the mental model of the whole app when enabled at config level and is still moving between
minors. `unstable_cache` is stable in behaviour despite the name and is what ADR 0005 was written
against. Long-term: a query is a function either way, so switching is a per-file edit. Choose at
the point the first ISR route ships, record it in ADR 0005, and do not mix the two in one module.

**Per-module `copy.ts` versus `next-intl` catalogues now.** ADR 0008 schedules catalogues for the
i18n phase. Doing it earlier gives one mechanism from the start at the cost of a provider,
message loading and a namespace scheme before any second locale exists. Staying with `copy.ts`
keeps strings typed and colocated; the cost is one migration per module later. Recommendation:
follow the ADR; the migration is mechanical because every string is already locale-keyed.

**Colocated tests versus `tests/` tree.** Colocated is the existing convention and keeps the
test beside the code it protects, which is what makes a moved module carry its tests with it.
A separate tree is easier to exclude from coverage and to run by layer. Not worth two conventions:
stay colocated, keep `e2e/` for Playwright.

## 9. Migration of `src/content`

One change, one PR, `pnpm verify` green before and after, so it can be reverted whole.

1. Create `src/shared/i18n/locale.ts` from `content/locale.ts`; `src/shared/lib/phone.ts` from
   `content/phone.ts`.
2. Create `src/modules/facilities/` with `model/facility.ts` (`Facility`, `FacilityRef`,
   `FacilityId` out of `contact-point.ts`), `data/repository.ts`, `data/sources/local/facilities.ts`
   (from `content/facilities.ts`), `queries/get-facility.ts`, `index.ts`.
3. Create `src/modules/contacts/` with `model/` (`contact-point.ts` minus facility types,
   `availability.ts`, `emergency.ts`, `validation.ts`), `data/sources/local/contact-points.ts`,
   `queries/` (split `queries.ts` and `fallback.ts` by use case), `copy.ts`, `ui/PhoneLink/` (moved
   from `components/`), `index.ts`.
4. Move each test beside the file it tests. `ssr-degradation.test.tsx` stays in `components/`
   if it tests wrappers only; otherwise it follows the component it tests.
5. Rewrite imports in `app/**` and `components/**` from `@/content` to `@/modules/contacts`,
   `@/modules/facilities`, `@/shared/i18n`, `@/shared/lib/phone`.
6. Delete `src/content/`. Remove the `content` legacy entry from `scripts/check-structure.mjs`
   and from `.claude/skills/project-structure/SKILL.md`. Update rule 8 in `CLAUDE.md` to say
   `src/modules/**/model` instead of `src/content/`.
7. `pnpm verify`, then `pnpm test:a11y` against the standalone build, since PhoneLink's rendered
   DOM must not change.

Until step 6 lands, the checker allows `app` and `components` to import `@/content`, and reports
the count so the debt is visible in CI output.
