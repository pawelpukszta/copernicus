# Information architecture and content model

Source: an inspection of https://copernicus.gda.pl on 2026-09-08. The current site is a
client-rendered application: the HTML shell contains only a viewport meta tag, and all content is
produced by JavaScript. That single fact drives the rendering decision in
`../docs/adr/0005-rendering-strategy-and-hosting.md`.

Scope of this project is the **public site only**. The patient and staff portals stay with their
current provider and are reached by link. See `../docs/adr/0006-scope-public-site-only.md`.

## What the current site holds

Entry points found in the main navigation and homepage tiles:

- Oddziały (inpatient departments)
- Przychodnia, Poradnie specjalistyczne (outpatient clinics)
- Ważne telefony (important phone numbers)
- e-Pacjent, Portal Pacjenta login (external systems)
- Aktualności (news, 101 pages of pagination plus an archive from 2016 onward)
- Cennik, Usługi płatne (price list, paid services)
- Projekty Unijne (EU-funded projects and investments)
- BIP, Zamówienia publiczne, Konkursy (statutory public-entity content)
- Badanie opinii, Ocena dostępności (satisfaction and accessibility surveys)
- Połącz z tłumaczem w języku migowym (sign language interpreter connection)

Facilities, each with its own address, phone numbers and email:

| Facility                            | Address                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| Szpital im. M. Kopernika (centrala) | ul. Nowe Ogrody 1-6, 80-803 Gdańsk                            |
| Szpital św. Wojciecha               | al. Jana Pawła II 50, 80-462 Gdańsk                           |
| Wojewódzkie Centrum Onkologii       | ul. Skłodowskiej-Curie 2, 80-210 Gdańsk; al. Zwycięstwa 31/32 |
| COPERNICUS Stomatologia             | al. Zwycięstwa 39, Gdańsk                                     |
| COPERNICUS Profilaktyka             | ul. Wałowa 27, Gdańsk                                         |

Existing accessibility features, which set the floor the redesign may not fall below:

- three skip links: main menu, content, footer
- three text sizes
- contrast inversion
- language switch
- sign language interpreter connection
- accessibility rating survey
- a homepage carousel that already has a pause control

## Content model

Entities, with the fields the redesign needs. Field lists are the starting point for the CMS
schema, not the final one.

**Facility** (`placówka`)
`name`, `slug`, `type` (hospital, clinic, prevention centre), `address`, `coordinates`,
`phoneNumbers[]` (label plus number), `email`, `openingHours`, `accessibilityNotes`
(parking, entrance, lift, induction loop, assistance dog policy), `photos[]`, `departments[]`,
`clinics[]`.

**Department** (`oddział`)
`name`, `slug`, `facility`, `description`, `headOfDepartment`, `phoneNumbers[]`,
`visitingHours`, `admissionInfo`, `whatToBring`, `staff[]`, `relatedClinics[]`.

**Clinic** (`poradnia`)
`name`, `slug`, `facility`, `specialisation`, `referralRequired` (boolean), `phoneNumbers[]`,
`registrationInfo`, `scheduleNotes`, `staff[]`.

**Person** (`lekarz`, `personel`)
`fullName`, `titles`, `roles[]` (per department or clinic), `specialisations[]`, `photo`
(optional), `bio` (optional). Publication requires consent; the model must allow a person to be
listed by role without a photo or biography.

**News item** (`aktualność`)
`title`, `slug`, `publishedAt`, `lead`, `body`, `categories[]`, `relatedFacility` (optional),
`attachments[]`. Roughly 800 to 1000 existing items across 101 pages, going back to 2016. They
need an import script, not manual re-entry.

**Price list item** (`pozycja cennika`)
`serviceName`, `code` (optional), `price`, `unit`, `facility`, `validFrom`, `validTo`,
`category`. Prices change by decision and must be versioned, since a superseded price is a
document people refer back to.

**Contact point** (`punkt kontaktu`) - one record, several views
`label`, `slug`, `facility`, `unit` (optional: department, clinic, building), `phones[]`
(`number` in E.164, `label`, `note`), `fax` (optional, and never rendered as a phone),
`email` (a role mailbox, not a person's), `availability` (opening hours plus exceptions),
`category` (emergency, out-of-hours, registration, diagnostics, secretariat, administration,
press, institutional), `audience` (patient, institution, media), `order`, `lastReviewedAt`.

This is the single most important entity on a hospital site, and the reason it is a **contact
point** rather than a "phone number" is that the same record has to serve three pages without
being maintained three times:

| View               | Route              | Job                                 | What it renders                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task view          | `/wazne-telefony`  | "I need to call someone now"        | Emergency and out-of-hours first, then registration and diagnostics, grouped by facility, with availability. Phones only; an email appears as a secondary line where the record has one and it is genuinely an alternative (cancelling an appointment), never as the primary affordance. |
| Institutional view | `/kontakt`         | "I am writing to this organisation" | Per facility: address, how to get there, parking, building accessibility, secretariat, role mailboxes, ePUAP and e-Doręczenia, NIP, KRS, REGON, the data protection officer, the complaints route.                                                                                       |
| Local view         | `/szpitale/[slug]` | "Everything about this place"       | The facility's own contact points beside its departments, clinics and practical information.                                                                                                                                                                                             |

Rules that follow, and that the screen specs must not break:

- A contact point is authored once. Every view is a query over the same records, filtered by
  `category` and `audience`. Nothing is retyped per page.
- Many contact points may share one number (`58 772 39 50` serves at least four units today), so
  the number is a value on the record, not the record's identity.
- `fax` is a separate field precisely so no view can render it as something to call. The current
  site publishes a fax as WCO's contact number; the model makes that mistake unrepresentable.
- `email` holds a role mailbox. A named person's address is not a contact point.
- `/wazne-telefony` stays a **shortlist**, not the full directory: the task-oriented entries plus a
  link to the per-facility directory. A page that grows to hold every number becomes the page it
  replaced.
- `availability` is required. "Not stated" is a content gap with an owner, not an acceptable value.

**Static page** (`strona informacyjna`)
`title`, `slug`, `body`, `parent`, `lastReviewedAt`. The review date matters: medical information
without a visible review date is a liability.

**Statutory content**: BIP, public procurement and job or service competitions have their own
formal requirements for structure and archiving. Treated as linked external content in this
project, not as CMS entities.

## Routes and rendering tier

Names are Polish, since the audience is Polish and URLs are read aloud over the phone.

| Route                                 | Content                                                 | Tier                                 |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------ |
| `/`                                   | Homepage: emergency contacts, entry points, latest news | ISR                                  |
| `/szpitale`, `/szpitale/[slug]`       | Facilities                                              | SSG                                  |
| `/oddzialy`, `/oddzialy/[slug]`       | Departments                                             | SSG                                  |
| `/poradnie`, `/poradnie/[slug]`       | Clinics                                                 | SSG                                  |
| `/lekarze`, `/lekarze/[slug]`         | Staff directory                                         | ISR                                  |
| `/wazne-telefony`                     | Phone directory                                         | ISR                                  |
| `/cennik`                             | Price list                                              | ISR                                  |
| `/aktualnosci`, `/aktualnosci/[slug]` | News, archive, categories                               | ISR for the list, SSG for items      |
| `/dla-pacjenta/...`                   | Guides: admission, what to bring, patient rights        | SSG                                  |
| `/kontakt`                            | Contact, all facilities                                 | SSG                                  |
| `/deklaracja-dostepnosci`             | Accessibility statement                                 | SSG                                  |
| `/szukaj`                             | Site search results                                     | on demand, no caching                |
| `/zglos-problem-dostepnosci`          | Accessibility feedback form                             | SSG page, POST handled on the server |

Every route in the table is server-rendered HTML. None of them may depend on client JavaScript to
show its primary content.

Deliberately **not** in this project: `/pacjent/*` and `/pracownik/*`. The header links to the
existing portal and says plainly that it is a separate system, so a visitor is never surprised by
a different look and feel.
