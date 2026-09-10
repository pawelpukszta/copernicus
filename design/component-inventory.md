# Component inventory and policy

Conformance target is WCAG 2.2 AA (`../docs/adr/0004-conformance-target-aa.md`). The fastest way
to miss it is a custom widget with hand-written roles and key handling. Hence the policy below.

## Policy

1. Every interactive element on an artboard maps to a component in
   `component-exports.generated.md`, or is plain HTML.
2. Anything outside that list requires an ADR before it reaches a spec. The ADR states which
   keyboard interactions, roles and focus behaviour will be written by hand, and who tests them
   with a screen reader.
3. React Aria Components ships **no** `"use client"` directives (verified on 1.21.1: zero files in
   `dist`). In the Next.js App Router that means every library component is reached through a
   wrapper in `src/components/<Name>/` whose file starts with `'use client'`. Application code
   imports the wrapper, never the library directly. This is also what keeps the client bundle
   from growing by accident.
4. Client-side navigation goes through `RouterProvider`, so `Link`, `MenuItem href` and
   `Breadcrumb` use the framework router instead of a full page load.

## What each group needs from JavaScript

The public site is rendered on the server. Whatever a visitor needs during an emergency has to be
readable before hydration and with JavaScript disabled: phone numbers, addresses, opening hours,
department and clinic pages, the accessibility statement. The table says which components are
safe there and what to use instead when they are not.

| Group              | Components                                                                                                                                                  | Works without JS                             | Use on critical paths                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Text and structure | `Header`, `Heading`, `Text`, `Separator`, `Group`, `Section`, `Keyboard`, `VisuallyHidden`                                                                  | yes                                          | yes                                                                                                  |
| Links              | `Link`, `Breadcrumbs`, `Breadcrumb`                                                                                                                         | yes                                          | yes                                                                                                  |
| Buttons            | `Button`, `ToggleButton`, `ToggleButtonGroup`                                                                                                               | renders, but `onPress` needs JS              | only inside a `<form>` that also submits natively                                                    |
| Forms              | `Form`, `TextField`, `TextArea`, `Input`, `Label`, `FieldError`, `NumberField`, `SearchField`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch` | renders and submits natively                 | yes, with server-side validation as the source of truth                                              |
| Tables             | `Table`, `TableHeader`, `TableBody`, `Row`, `Cell`, `Column`                                                                                                | yes; sorting, resizing and selection need JS | yes, with server-rendered sort links                                                                 |
| Disclosure         | `Disclosure`, `DisclosureGroup`, `DisclosurePanel`                                                                                                          | no                                           | use native `<details>`/`<summary>`, or render expanded                                               |
| Tabs               | `Tabs`, `TabList`, `Tab`, `TabPanel`                                                                                                                        | no                                           | split into separate routes, or stacked sections with headings                                        |
| Pickers and search | `Select`, `ComboBox`, `Autocomplete`, `ListBox`, `GridList`                                                                                                 | no                                           | native `<select>` in a form, plus a server-rendered results page                                     |
| Overlays           | `Dialog`, `Modal`, `ModalOverlay`, `Popover`, `Tooltip`                                                                                                     | no                                           | never the only place information exists; tooltip content must also be visible text                   |
| Dates              | `Calendar`, `RangeCalendar`, `DateField`, `DatePicker`, `DateRangePicker`, `TimeField`                                                                      | no                                           | native `<input type="date">` fallback                                                                |
| Menus              | `Menu`, `MenuTrigger`, `MenuItem`, `SubmenuTrigger`                                                                                                         | no                                           | main navigation must exist as a plain list of links; a menu is an enhancement over it                |
| Trees              | `Tree`, `NavigationTree` and their parts                                                                                                                    | no                                           | nested `<ul>` of links for the department hierarchy                                                  |
| Status             | `ProgressBar`, `Meter`                                                                                                                                      | renders static value                         | yes for static values                                                                                |
| Toasts             | `UNSTABLE_Toast*`                                                                                                                                           | no                                           | server-rendered inline message after a form submission; note the UNSTABLE prefix, the API can change |
| Files and drag     | `FileTrigger`, `DropZone`, `DropIndicator`                                                                                                                  | no                                           | a plain `<input type="file">` must remain available                                                  |
| Colour pickers     | `ColorPicker` and its parts                                                                                                                                 | no                                           | not needed on this site                                                                              |

### When not to use a React Aria component

React Aria is the default. It stops being the default only where one of two conditions holds, and
both are checked against the component's real server-rendered DOM rather than argued:

1. **The pre-hydration DOM has no usable control for the task.** `Select` renders a dead button
   plus an `aria-hidden`, `tabindex="-1"` native select, so before hydration there is nothing a
   visitor can operate. `SearchField` renders a real `<input type="search">` and is fine. The
   difference is per component, never per library.
2. **The component's role overstates the content.** `Table` is `role="grid"`, an interactive 2D
   widget that puts screen readers into grid navigation. For a read-only data table with no
   selection, plain table semantics describe it more accurately.

Neither condition is about the share of visitors who switch JavaScript off. That share is about
0.2%. The share who have it enabled and still do not receive it was measured at 0.9% by the UK
Government Digital Service in 2013, five times larger and not a choice: corporate proxies, failed
requests, script errors, abandoned loads. On top of that sits the window between first paint and
hydration, which every visitor passes through and which lasts seconds on a poor connection. These
two conditions are what make that window harmless without giving up the library.

Record every deviation in the screen spec together with the rendered DOM that justifies it, and
cover it in `src/components/ssr-degradation.test.tsx` so upgrading React Aria cannot silently
change the answer.

Two rules follow from the table and belong in every screen spec:

- **Main navigation is a list of links first.** `Menu` and `NavigationTree` improve it; they do not
  replace it. A hospital site whose navigation disappears without JavaScript fails its purpose.
- **No information exists only inside an overlay.** A popover or tooltip may repeat something, never
  be the only carrier of it.

## Components this project expects to need

Mapped from the current site's content, before any redesign work:

| Need                                       | Component                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Department and clinic hierarchy            | nested links, optionally `NavigationTree` as enhancement                                                |
| News list with 100+ pages and year archive | `SearchField`, `Select`, server-rendered pagination                                                     |
| Important phone numbers                    | `Table` with server-rendered sort links                                                                 |
| Facility contact cards                     | plain HTML, `Link`                                                                                      |
| Price list                                 | `Table`                                                                                                 |
| Frequently asked questions                 | native `<details>` or `Disclosure` with expanded fallback                                               |
| Language switch                            | `Select` in a form, or plain links                                                                      |
| Theme switch (light, dark, high contrast)  | `ToggleButtonGroup` or `RadioGroup`, persisted server-side or via cookie so it survives the first paint |
| Cookie consent                             | `Dialog` is acceptable here, since it is not information the visitor came for                           |
| Accessibility feedback form                | `Form` plus fields, server-validated                                                                    |
