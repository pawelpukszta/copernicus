# Accessibility statement: source of truth

This file is the internal source for the public accessibility statement. The published version
has to be written in Polish and placed on the site itself; this is the English working copy the
team keeps in sync with reality.

**Not legal advice.** Whether a formal declaration is legally required here, and in what form,
depends on whether the operator is a public entity under the Polish act of 4 April 2019 on the
digital accessibility of public entities' websites and mobile applications, and on the
obligations arriving with the European Accessibility Act. Have that confirmed by counsel before
publishing. What follows is the technical content the statement needs, whichever regime applies.

## Declared conformance

> The site conforms to WCAG 2.2 at level AA. It is not fully conformant with level AAA.

State the date of the assessment, who performed it, and the method (self-assessment, external
audit, or both). Never declare a level the manual test matrix has not verified.

## Required contents of the statement

1. Conformance status: AA, with the exact standard version, WCAG 2.2.
2. Non-accessible content, listed with the criterion and the reason: incompatibility with the
   standard, disproportionate burden, or content outside the scope of the legislation.
3. Preparation date of the statement, date of the last review, and the assessment method.
4. Feedback channel: an email address and a phone number, plus the expected response time.
5. Enforcement route: how to escalate if the response is unsatisfactory.
6. For public entities in Poland: information about the architectural accessibility of the
   building and about the availability of a sign language interpreter, which are part of the
   statutory declaration even though they are not WCAG matters.

## What must be disclosed as not yet met

Level AAA is not claimed, so the statement does not have to enumerate AAA gaps. It should still
say plainly which AAA enhancements the site does provide, because that is an honest and useful
signal to users:

- contrast ratios of at least 7:1 for body text
- interactive targets of at least 44 x 44 px
- a focus indicator meeting the enhanced appearance criterion
- reduced-motion support

Anything from `accessibility.md` that is still open at publication time belongs in section 2 as
non-accessible content, with a target date. An empty section 2 next to unfinished manual testing
is the single most common way an accessibility statement becomes a liability.

## What it would take to declare AAA

See [Path to AAA](accessibility.md#path-to-aaa). The two blockers are organisational rather than
technical: sign language interpretation for prerecorded audio (1.2.6) and a lower-secondary
reading level for all content, or a maintained simplified version of it (3.1.5). Both are
recurring budgets. Until they are funded, the correct public wording is "level AA, with
individual AAA enhancements", never "level AAA".

## Review cadence

Review this file and the published statement at every release, and at least once a year. A stale
statement that claims more than the site delivers is worse than no statement.
