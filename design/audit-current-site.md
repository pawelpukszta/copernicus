# Audit of the current site: Ważne telefony

Inspected 2026-09-08 at https://copernicus.gda.pl/abc-pacjenta/wazne-telefony. This page was
audited first because it serves the visitor the brief puts first: someone who needs a phone number
now. What it does today is the reason the redesign starts here.

## What the page is

Reached as `Start > ABC Pacjenta > Ważne telefony`, so the most-needed page on the site sits two
levels down under an editorial category. It holds eleven groups, **all collapsed by default**:

Szpital im. Mikołaja Kopernika · Szpital św. Wojciecha · Wojewódzkie Centrum Onkologii ·
COPERNICUS Stomatologia · COPERNICUS Profilaktyka (Wałowa) · Rejestracja do poradni
specjalistycznych · Nocna i Świąteczna Opieka Zdrowotna · Zakłady Diagnostyki Obrazowej ·
Infolinia Onkologiczna · Rzecznik Prasowy · Zespół Kontroli ds. Zakażeń

## Findings

**1. Nothing is scannable.** With every group closed, the page shows eleven headings and no
numbers. A visitor must guess which group holds what they need, and the browser's own find
function returns nothing, because the content is not in the collapsed panels until they are
opened. This is the single biggest usability problem on the site.

**2. The emergency number is three interactions deep.** Expanding the first group reveals
`SZPITALNY ODDZIAŁ RATUNKOWY 58 76 40116`, listed between the switchboard and the management
secretariat, with no visual distinction. Someone in a hurry has to read past administrative
numbers to find the emergency department.

**3. Out-of-hours care has no number at all.** Expanding `Nocna i Świąteczna Opieka Zdrowotna`
reveals exactly one thing: a link labelled **TUTAJ**. No number, no address, no hours. Two
problems in one: the information a worried parent needs at 22:00 is not on the page, and the link
text alone conveys nothing, which fails 2.4.9 Link Purpose (Link Only) at AAA and is thin even
against 2.4.4 at level A.

**4. The same number is written three different ways.** `58 76 40100` in the accordion,
`58 764 01 00` in the footer, `58 76 40 200` for diagnostics. Grouping is inconsistent within one
page, which makes numbers harder to read aloud, harder to dial, and impossible to deduplicate.
The redesign normalises storage to E.164 and display to one grouping: `58 764 01 00`.

**5. Phone entries mix audiences and channels.** One group contains an emergency department, a
switchboard with opening hours, a management secretariat with a fax and an email address, and two
registration desks. Press office and infection control sit in the same list as patient
registration.

**6. Availability is recorded for some entries only.** `CENTRALA` has "od poniedziałku do piątku
w godz. 7:00-15:00"; most entries have nothing, so a visitor cannot tell whether calling at 18:00
is pointless.

## Data captured, for the content model

Verified numbers, normalised. Everything marked TO CONFIRM is a gap in the current site, not a
design placeholder.

| Entry                                       | Number                     | Availability                   |
| ------------------------------------------- | -------------------------- | ------------------------------ |
| Kopernik, Szpitalny Oddział Ratunkowy       | 58 764 01 16               | assumed 24/7, TO CONFIRM       |
| Kopernik, centrala                          | 58 764 01 00               | Mon-Fri 7:00-15:00             |
| Kopernik, rejestracja przychodni            | 58 772 39 50               | TO CONFIRM                     |
| Kopernik, rejestracja diagnostyki obrazowej | 58 764 02 00, 58 764 03 00 | TO CONFIRM                     |
| Kopernik, sekretariat zarządu               | 58 764 01 42, 58 764 03 40 | Mon-Fri, plus fax 58 302 14 16 |
| Szpital św. Wojciecha                       | 58 768 40 00               | TO CONFIRM                     |
| Wojewódzkie Centrum Onkologii               | 58 341 93 48               | TO CONFIRM                     |
| COPERNICUS Stomatologia                     | 58 520 38 37               | TO CONFIRM                     |
| COPERNICUS Profilaktyka                     | 58 300 56 76 ext. 101      | TO CONFIRM                     |
| Nocna i świąteczna opieka                   | **TO CONFIRM**             | not published today            |
| Rejestracja do poradni specjalistycznych    | **TO CONFIRM**             | not read                       |
| Zakłady Diagnostyki Obrazowej               | **TO CONFIRM**             | not read                       |
| Infolinia onkologiczna                      | **TO CONFIRM**             | not read                       |
| Rzecznik prasowy                            | **TO CONFIRM**             | not read                       |
| Zespół Kontroli ds. Zakażeń                 | **TO CONFIRM**             | not read                       |

## What this dictates for the redesign

1. `/wazne-telefony` becomes a top-level route, not a child of an editorial category.
2. No accordions for primary content. Groups are headings over an open, scannable list.
3. Urgent numbers are pinned at the top of the page and repeated as a permanent header strip
   carrying 112, which is the one number that is always correct.
4. Availability is a required field on a phone entry, not an optional sentence.
5. Press, media and institutional contacts are a separate group from patient contacts.
6. The nine TO CONFIRM rows are a content task for the client, with an owner and a date, before
   the screen spec is written.
