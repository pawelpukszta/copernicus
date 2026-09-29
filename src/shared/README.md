# shared/

Code with no business noun in it: i18n primitives (`Locale`, `LocalizedText`, `text()`),
phone and date formatting, SEO helpers, the route registry, site configuration, utility
types, unit-test helpers.

The review test is literal: if a file here mentions a facility, a department, a contact
point or a news item, it belongs in a module. `shared/` imports nothing else under `src/`;
`scripts/check-structure.mjs` fails the build otherwise.
