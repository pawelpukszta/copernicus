# modules/

Bounded contexts: one folder per business area (contacts, facilities, news, announcements,
on-duty, staff, pricing, pages, search, accessibility). A module owns its model, data access,
queries, server actions and module-specific server components, and exposes them only through
its `index.ts`.

Anatomy, rules and examples: `docs/project-structure.md`, section 3 and 5. Placement table:
`.claude/skills/project-structure/SKILL.md`. Cross-module edges are the allowlist in
`scripts/check-structure.mjs`; register a new module there, even with `[]`.

No file here may declare `'use client'`; interactive behaviour comes from `@/components`.
