# Accessibility contract

**Conformance target: WCAG 2.2, level AA**, for every public page and flow.

Level AAA is **not** claimed. It is tracked as a measured gap with a documented route, so the
decision to pursue it later stays a product decision rather than a rebuild. The reasoning is in
[`adr/0004-conformance-target-aa.md`](adr/0004-conformance-target-aa.md); the route itself is in
[Path to AAA](#path-to-aaa) below.

Automated tooling detects roughly 30 to 40 percent of real WCAG failures. The tables below split
the work into what CI guards, what a person must verify, and what is a content obligation rather
than a code one.

## What CI guards today

| Check                                          | Command               | Criteria covered                           |
| ---------------------------------------------- | --------------------- | ------------------------------------------ |
| Contrast budget on design tokens               | `pnpm check:contrast` | 1.4.3 (AA), 1.4.11 (AA)                    |
| axe-core scan, light and dark                  | `pnpm test:a11y`      | 1.1.1, 1.3.1, 2.4.4, 3.1.1, 4.1.2 and more |
| Skip link on first Tab                         | `pnpm test:a11y`      | 2.4.1 (A)                                  |
| Target size >= 24 x 24 px, inline links exempt | `pnpm test:a11y`      | 2.5.8 (AA)                                 |
| Visible focus indicator while tabbing          | `pnpm test:a11y`      | 2.4.7 (AA)                                 |
| No horizontal scroll at 200% text              | `pnpm test:a11y`      | 1.4.4, 1.4.10 (AA)                         |
| `jsx-a11y` strict ruleset                      | `pnpm lint`           | static markup errors                       |
| Component behaviour tests                      | `pnpm test`           | 2.1.1, 3.3.2, 4.1.2                        |

The browser suite runs four Playwright projects: Chromium, Firefox and desktop Safari at desktop
widths, plus an emulated iPhone.

Engine differences are handled **by capability, not by a list of browser names**. Safari leaves
links out of Tab traversal unless the user turns on Full Keyboard Access, and a touch profile has
no Tab key at all, so an assertion about Tab order would report a browser default as a defect in
the page. Two rules follow:

- Anything that can be verified without Tab runs everywhere. The skip link is checked by focusing
  it directly and asserting that it moves into the viewport, which works on every engine and on
  the touch profile too.
- `the skip link is the first Tab stop` probes the engine first, on neutral content rather than on
  our own markup, and skips itself when links are not part of Tab traversal. Probing neutral
  content matters: probing the skip link itself would let a real regression make the assertion
  skip instead of fail.
- `everything the keyboard reaches shows a focus indicator` walks Tab and asserts an indicator on
  each stop, then asserts that it reached at least one element. Without that last assertion an
  engine that ignores Tab would turn the check into a green tick that proves nothing. On desktop
  Safari it covers the form controls, which is what Safari's default reaches.

Two of those checks also measure the AAA thresholds and report the distance without failing the
build: the contrast script prints a "Gap to AAA" block, and the Playwright suite records an
`aaa-gap` annotation. That is the mechanism that keeps AAA from quietly drifting out of reach.

## AA criteria that need a manual owner

Automation cannot judge these. Each needs a named owner before launch.

| Criterion                                 | Level | What it demands                                                       | Owner        |
| ----------------------------------------- | ----- | --------------------------------------------------------------------- | ------------ |
| 1.2.4 Captions (Live)                     | AA    | Captions for live audio in synchronised media                         | TBD          |
| 1.2.5 Audio Description                   | AA    | Audio description for prerecorded video                               | TBD          |
| 1.3.5 Identify Input Purpose              | AA    | Correct `autocomplete` tokens on personal-data fields                 | FE           |
| 1.4.5 Images of Text                      | AA    | Real text instead of text baked into images                           | Content      |
| 1.4.12 Text Spacing                       | AA    | No loss of content when users override spacing                        | FE           |
| 1.4.13 Content on Hover or Focus          | AA    | Hover and focus content dismissable, hoverable, persistent            | FE           |
| 2.4.5 Multiple Ways                       | AA    | More than one route to each page: search plus navigation or a sitemap | IA           |
| 2.4.6 Headings and Labels                 | AA    | Headings and labels that actually describe their content              | Content      |
| 2.4.11 Focus Not Obscured (Minimum)       | AA    | Focused element not fully hidden by sticky headers or overlays        | FE           |
| 3.2.3 Consistent Navigation               | AA    | Navigation in the same relative order across pages                    | IA           |
| 3.2.4 Consistent Identification           | AA    | Same function, same name, everywhere                                  | Design       |
| 3.2.6 Consistent Help                     | AA    | Help mechanism in the same relative place on every page               | Product      |
| 3.3.3 Error Suggestion                    | AA    | Correction suggested when the system can infer one                    | FE           |
| 3.3.4 Error Prevention                    | AA    | Legal, financial and data submissions reversible or confirmed         | FE + Backend |
| 3.3.7 Redundant Entry                     | AA    | Do not ask for the same information twice in one process              | FE + Backend |
| 3.3.8 Accessible Authentication (Minimum) | AA    | No cognitive function test without an alternative                     | Backend      |

## Path to AAA

The site already satisfies several AAA criteria because they were cheap to build in from the
start. Those wins are kept deliberately: they cost nothing to maintain and they shorten the
distance if the AAA decision is ever taken.

### Already met, no further work needed

| Criterion                          | Level | How it is met                                                                                                                                        |
| ---------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.6 Contrast (Enhanced)          | AAA   | Every token pair clears 7:1 body text and 4.5:1 large text, verified in both themes by `pnpm check:contrast`                                         |
| 2.4.13 Focus Appearance            | AAA   | Shared 3px focus ring with a 2px offset, contrast > 3:1 on every surface                                                                             |
| 2.5.5 Target Size                  | AAA   | 44 x 44 px minimum enforced through `--target-min`, asserted in `e2e/keyboard.spec.ts`                                                               |
| 2.3.3 Animation from Interactions  | AAA   | `prefers-reduced-motion` handled globally in `global.css`                                                                                            |
| 1.4.8 Visual Presentation (partly) | AAA   | Line height 1.6, paragraph spacing 2em, measure capped at 70 characters, never justified. Missing: user-selectable foreground and background colours |

### Remaining work, ordered by cost

| Criterion                                  | Level | What is missing                                                                        | Rough cost                              | Owner             |
| ------------------------------------------ | ----- | -------------------------------------------------------------------------------------- | --------------------------------------- | ----------------- |
| 2.1.3 Keyboard (No Exception)              | AAA   | Audit of every widget with no path-dependent input allowed                             | Low, FE audit                           | FE                |
| 3.2.5 Change on Request                    | AAA   | No automatic context change anywhere, including redirects and carousels                | Low, FE audit                           | FE                |
| 2.4.10 Section Headings                    | AAA   | Every content block introduced by a heading                                            | Low, editorial                          | Content           |
| 2.5.6 Concurrent Input Mechanisms          | AAA   | Never restrict the input method                                                        | Low, FE audit                           | FE                |
| 1.4.8 Visual Presentation (rest)           | AAA   | User-selectable text and background colours, i.e. a theme picker beyond light and dark | Medium, design plus FE                  | Design + FE       |
| 2.2.3 No Timing                            | AAA   | No time limits at all except real-time events                                          | Medium, depends on session handling     | Product + Backend |
| 2.2.4 Interruptions                        | AAA   | Every interruption postponable or suppressible                                         | Medium                                  | Product           |
| 2.2.5 Re-authenticating                    | AAA   | Data preserved across a session expiry                                                 | Medium, backend                         | Backend           |
| 2.2.6 Timeouts                             | AAA   | Warn users about data loss from inactivity                                             | Low, once 2.2.5 exists                  | Backend           |
| 2.4.9 Link Purpose (Link Only)             | AAA   | Every link understandable from its text alone, so no bare "więcej"                     | Medium, editorial across the whole site | Content           |
| 2.4.12 Focus Not Obscured (Enhanced)       | AAA   | Focused element never obscured even partly, which constrains sticky headers            | Medium, design constraint               | Design + FE       |
| 3.1.3 Unusual Words                        | AAA   | Glossary for medical terminology, linked at first use                                  | High, editorial                         | Content           |
| 3.1.4 Abbreviations                        | AAA   | Expansion available on first use                                                       | Medium, editorial                       | Content           |
| 3.1.6 Pronunciation                        | AAA   | Pronunciation where meaning is ambiguous                                               | Medium, editorial                       | Content           |
| 3.3.6 Error Prevention (All)               | AAA   | Every submission reversible, checked and confirmed, not only legal or financial ones   | Medium, FE plus backend                 | FE + Backend      |
| 3.3.9 Accessible Authentication (Enhanced) | AAA   | No cognitive function test in login at all, including object recognition               | Medium, backend and vendor dependent    | Backend           |
| 1.2.9 Audio-only (Live)                    | AAA   | Text alternative for live audio                                                        | High, operational                       | Content           |
| 1.2.8 Media Alternative (Prerecorded)      | AAA   | Full text alternative for every prerecorded video                                      | High, production                        | Content           |
| 1.2.6 Sign Language                        | AAA   | Sign language interpretation for all prerecorded audio                                 | Very high, production                   | Content           |
| 3.1.5 Reading Level                        | AAA   | Lower-secondary reading level, or a maintained simplified version of every page        | Very high, editorial and ongoing        | Content           |

### The two that decide whether AAA is realistic

**1.2.6 Sign Language** and **3.1.5 Reading Level** are not engineering work. The first means
commissioning an interpreter for every piece of prerecorded audio, forever. The second means
either writing all medical content at a lower-secondary reading level or maintaining a parallel
simplified version of the whole site, forever. Both are recurring editorial and production
budgets, not a sprint.

Everything else on the list above is reachable by the front-end and backend teams within the
project. If those two are funded, AAA is achievable; if they are not, the honest claim is
**AA with AAA enhancements**, and that is what the accessibility statement must say. Overstating
conformance is its own exposure, so the statement is written from this file, not from ambition.

### How to flip the switch

The tooling is already level-aware. When the decision is taken:

1. Set `CONTRAST_LEVEL=aaa` and `A11Y_LEVEL=aaa` in `.github/workflows/ci.yml`.
2. The contrast and target-size checks stop being advisory and start blocking.
3. Work through the remaining-work table above; the manual criteria still need manual sign-off.

Nothing in the codebase has to be restructured for that, which is the point of building the
AA baseline this way.

## User preferences

Three controls are offered in the header: text size, contrast and colour scheme. None of them is
required by AA; they are kept because the current site has them and because 1.4.8 (AAA) asks for
user-selectable colours. Their interaction model, storage, schedule and trade-offs are in
[`adr/0007-user-preferences-theme-contrast-text-size.md`](adr/0007-user-preferences-theme-contrast-text-size.md).

Two consequences land in this file:

- The 200% reflow assertion has to be repeated at the maximum text scale, which is effectively
  300%. A setting the site offers is a setting the site has to survive.
- A high-contrast theme, when one is added, must not fight `forced-colors: active`. The Windows
  High Contrast row of the matrix below covers the combination.

Language is a separate axis with its own decision record,
[`adr/0008-internationalisation.md`](adr/0008-internationalisation.md). The criteria it touches are
3.1.1 Language of Page, 3.1.2 Language of Parts on the switcher itself, and 3.2.5 Change on Request
(AAA), which is why no locale redirect happens on `Accept-Language`.

## Manual test matrix

Run before every release, and for any PR touching navigation, forms or dialogs.

| Assistive technology                 | Browser         | Platform         | Frequency     |
| ------------------------------------ | --------------- | ---------------- | ------------- |
| NVDA                                 | Firefox, Chrome | Windows          | Every release |
| JAWS                                 | Chrome          | Windows          | Every release |
| VoiceOver                            | Safari          | macOS            | Every release |
| VoiceOver                            | Safari          | iOS              | Every release |
| TalkBack                             | Chrome          | Android          | Every release |
| Keyboard only                        | all supported   | all              | Every PR      |
| 400% browser zoom                    | Chrome          | desktop          | Every release |
| Windows High Contrast                | Chrome, Edge    | Windows          | Every release |
| Voice control (Dragon, Voice Access) | Chrome          | Windows, Android | Quarterly     |

## Review order for a new component

1. Does React Aria already implement the pattern? Use it. Do not hand-roll roles or key handling.
2. Does it need a colour that is not in `tokens.css`? Add the token and its pair to the contrast
   manifest in the same commit.
3. Is the hit area at least 24 x 24 px, and 44 x 44 unless there is a documented reason?
   Links inside a sentence are exempt from both figures; do not pad them.
4. Does the focus indicator survive on every background the component can sit on?
5. Can a sticky header, dialog or toast fully hide the focused element? 2.4.11 (AA) forbids that.
6. Is every state change announced without stealing focus?
7. Does the component read correctly with NVDA and VoiceOver, not only in the axe report?

## Definition of an accessibility bug

Any barrier that prevents a person from completing a task with their chosen input method or
assistive technology, whether or not a WCAG criterion names it. Report it with
`.github/ISSUE_TEMPLATE/accessibility_bug.md`; it is treated as a defect, never as an enhancement.
