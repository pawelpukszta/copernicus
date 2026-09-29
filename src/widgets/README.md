# widgets/

Page blocks that cross module boundaries or appear on every page: site header and footer,
the emergency strip, the critical alert banner, the language banner. Server components.

A block that renders one module's data on one route is not a widget; it belongs in that
module's `ui/`. Widgets import modules through their public API only (`@/modules/<name>`).
See `docs/project-structure.md`, sections 1 and 7.
