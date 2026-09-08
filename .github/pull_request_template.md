## What changed

<!-- One or two sentences. Link the issue. -->

## Accessibility checklist

Conformance target is WCAG 2.2 **AA**. Tick what applies; strike out what does not. A PR that
touches markup, styling or interaction cannot merge with unchecked boxes in the AA section.

### AA, required

- [ ] Operable with the keyboard alone, in a logical order
- [ ] Focus indicator visible on every new interactive element (2.4.7)
- [ ] Focused element not fully hidden by sticky headers, overlays or toasts (2.4.11)
- [ ] Interactive targets at least 24 x 24 px (2.5.8)
- [ ] Text contrast at least 4.5:1, non-text at least 3:1, verified by `pnpm run check:contrast`
- [ ] Information never conveyed by colour alone (1.4.1)
- [ ] Form fields have a persistent visible label plus programmatic association (3.3.2)
- [ ] Errors described in text, announced to assistive technology, with a suggested fix where the
      system can infer one (3.3.1, 3.3.3)
- [ ] Correct `autocomplete` tokens on personal-data fields (1.3.5)
- [ ] Hover and focus content is dismissable, hoverable and persistent (1.4.13)
- [ ] Images have a meaningful alt text or are marked decorative (1.1.1)
- [ ] Headings and labels describe their content, hierarchy unbroken (1.3.1, 2.4.6)
- [ ] Reflows to 320 px width without horizontal scrolling (1.4.10)
- [ ] Readable at 200% text size and with overridden text spacing (1.4.4, 1.4.12)
- [ ] Works in Windows High Contrast / `forced-colors` mode
- [ ] Screen reader pass done (say which: NVDA, JAWS, VoiceOver, TalkBack)

### AAA enhancements the project already holds, do not regress

- [ ] Body-text contrast still 7:1 (1.4.6); if not, the AAA gap report explains why
- [ ] Targets still 44 x 44 px (2.5.5); if not, the reason is stated below
- [ ] Focus indicator still >= 2px perimeter with >= 3:1 contrast (2.4.13)
- [ ] `prefers-reduced-motion` respected (2.3.3)

## Manual test notes

<!-- Browser and assistive technology used, plus anything a reviewer should re-check. -->

## AAA gap introduced by this PR

<!-- Paste the advisory lines from `pnpm run check:contrast`, or the `aaa-gap` annotations from
     `pnpm run test:a11y`, or write "none". This keeps docs/accessibility.md honest. -->
