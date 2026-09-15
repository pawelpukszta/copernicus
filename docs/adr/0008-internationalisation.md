# ADR 0008: Internationalisation (pl, en, de, uk)

- Status: accepted
- Date: 2026-09-15

## Context

The site must serve Polish, English, German and Ukrainian. The current site has a language switch in
its top bar, so the capability is part of the floor the redesign may not fall below.

Three facts constrain the answer:

- `design/information-architecture.md` states that route names are Polish because URLs are read
  aloud over the phone. Anything that lengthens the Polish URLs has a real cost.
- The content inventory is roughly 800 to 1000 news items back to 2016, plus statutory content (BIP,
  procurement, competitions) that is legally Polish. Translating all of it will not happen.
- The content model in the same document was written monolingual. Locale has to enter it before
  records are authored, or every record is re-authored later.

## Decision

### 1. The language tag for Ukrainian is `uk`, not `ua`

`ua` is a country code. `uk` is the ISO 639-1 language code. It ends up in URLs, in `lang`
attributes and in `hreflang`, so it is fixed now rather than migrated later.

### 2. Translation is tiered, and the tiers are a product commitment

| Tier | Languages          | Content                                                                                                                    |
| ---- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | pl, en, de, uk     | Emergency and out-of-hours contacts, how to get care, insurance and EHIC, patient rights, what to bring, addresses and how to get there, the accessibility statement, the accessibility feedback form |
| 2    | pl, en             | Facilities, departments, clinics, price list                                                                                |
| 3    | pl only            | News, EU projects, procurement, competitions, BIP                                                                           |

A page in a tier it does not belong to is not silently machine-translated and not a dead link: the
language switcher stays enabled and the target page states, in the requested language, that this
content exists in Polish only, with a link to it. Pretending otherwise is the failure mode of every
multilingual public site.

### 3. Route shape: the default locale is unprefixed

```
/wazne-telefony            pl
/en/important-phone-numbers en
/de/...                     de
/uk/...                     uk
```

Polish URLs keep their current shape. Other locales carry a prefix.

### 4. Slugs are per-locale, but resolved through a map

The content layer holds a slug per locale for each page. Non-Polish locales start by reusing the
Polish slug and switch to translated slugs page by page, tier 1 first. The routing layer reads the
map from the start, so switching a slug is a content change, never a routing change.

### 5. No automatic redirect on `Accept-Language`

The requested URL is always rendered in the locale the URL names. If the browser's preferred
language differs, a dismissible banner at the top of the page offers the other version.

### 6. The switcher is links, in each language's own name

`Polski`, `English`, `Deutsch`, `Українська`, each with `lang` and `hreflang` on the anchor
(3.1.2 Language of Parts), each pointing at the same page in that locale, or at the language's
home page when that page does not exist in it. No flags: a flag is a country, not a language, and
`uk` in particular is not served by one. The sign language interpreter link is not a language and
does not belong in this control.

### 7. Schedule

Three separate moments, and conflating them is the mistake this ADR exists to prevent.

| When                                 | What                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Now, before `/wazne-telefony` is implemented | The content types in `src/content/` carry locale. `ContactPoint.label`, `note` and every human-readable string are locale-keyed. `<html lang>` is driven by the route, not hard-coded. The switcher exists in the header markup with Polish as its only entry. |
| The chrome iteration (after `/wazne-telefony`) | The switcher becomes real as a list of links, still with one entry.                                                                                                   |
| A dedicated phase, after the first five or six Polish routes exist | `[locale]` segment, message catalogues, the slug map, `hreflang` and the language banner.                                                                              |

The reason for the split: locale in the data model is nearly free now and expensive later, whereas
the routing layer is cheap to add later and would slow every screen down if it were added first.

### 8. Library

`next-intl` for message catalogues and locale negotiation. It works with the App Router, keeps
messages out of the bundle for locales that are not requested, and does not require a client
provider for server-rendered strings.

## Consequences

**Pros**

- Polish URLs, the ones spoken over the phone, never change.
- The tier table turns "we support four languages" into a scoped, costed commitment, which is what
  the editorial team can actually staff.
- Locale in the data model from day one means the news import and the CMS schema are written once.
- No automatic redirect keeps 3.2.5 Change on Request (AAA) satisfied and keeps shared links stable.

**Cons**

- Asymmetric routing (one unprefixed locale, three prefixed) is more configuration than prefixing
  every locale, and is a known source of middleware mistakes. It needs a routing test per locale.
- Per-locale slugs mean a page has four identities, and a redirect has to be kept when a slug
  changes. The slug map is the place that debt accumulates.
- Locale-keyed strings make every content record wider and every authoring screen busier, including
  for the roughly 90 percent of records that will only ever hold Polish.

**Long-term effects**

- The tier boundary will be pushed. Every new page will arrive with a request to translate it, and
  the tier table is the artefact that makes that a decision rather than a drift.
- Ukrainian needs Cyrillic in the font subset. Decide this with the typography, not after, or the
  Ukrainian pages fall back to a system font and look like a different site.
- If a CMS is chosen later, its localisation model is now a hard selection criterion: field-level
  translation with per-locale publishing states, not one site per language.

## Alternatives considered

**Prefix every locale, including `/pl/`.** Uniform routing, no asymmetric middleware, and the
cleanest `hreflang` set. Rejected because it changes every Polish URL on a site whose IA says the
URLs are read aloud, and because it forces a redirect map for roughly a thousand existing news
items.

**One shared Polish slug under every prefix (`/en/wazne-telefony`).** Cheapest to build and to link
across locales. Rejected as the end state because an English-speaking visitor cannot read the URL,
but it is exactly what the slug map starts with, so the cheap option is the first step rather than a
different path.

**Separate subdomains or country domains.** Strongest signal to search engines, and full editorial
independence per language. Rejected: four deployments, four certificates and four sets of statutory
footers for a site where three of the four languages will hold a few dozen pages.
