# ADR 0005: Next.js App Router, with a hosting-agnostic rendering strategy

- **Status:** accepted
- **Date:** 2026-09-08
- **Supersedes:** the plain Vite SPA assumed in ADR 0001

## Context

The current site is client-rendered: its HTML shell contains only a viewport meta tag and all
content is produced by JavaScript. For a healthcare provider that is a functional defect, not an
SEO detail. A visitor on a slow connection, with a script blocker, or on a device where the bundle
fails to execute, gets an empty page instead of the number for the emergency department.

The hosting target is **not yet decided**. Self-hosting on the provider's own infrastructure is
plausible, and so is a managed platform. That uncertainty has to be absorbed by the architecture
rather than resolved by guessing.

## Decision

Next.js App Router, with rendering assigned per route in
`../../design/information-architecture.md`, and with three rules that keep the result portable:

1. **Node runtime only.** No `export const runtime = 'edge'`, no `@vercel/*` packages, no platform
   primitives that exist on one host. Authorisation and API handlers are ordinary route handlers.
2. **ISR is an optimisation, never a correctness requirement.** Every route must be correct if
   revalidation never fires, because a self-hosted multi-instance deployment needs a shared cache
   handler before ISR behaves as documented. Where freshness actually matters, fetch on request.
3. **`output: 'standalone'`,** so a container image is one build away whichever host wins.

## Rendering tiers

- **SSG**: facilities, departments, clinics, guides, contact, accessibility statement. Content
  changes by editorial decision, not by the minute.
- **ISR**: homepage, staff directory, phone directory, price list, news list. Being five minutes
  stale costs nothing.
- **On request, uncached**: site search, and anything reflecting live state.

Two corrections to the tiering that was originally proposed:

**Appointment availability must never be ISR.** A statically regenerated slot list shows a slot
that disappeared two minutes ago; the visitor does everything right and gets an error. Live state
is fetched per request or on the client, with an explicit loading state and a visible refresh.
Since scheduling belongs to the patient portal, which ADR 0006 puts out of scope, this rule is
recorded here for whoever integrates it later.

**Login pages are static.** A login form holds no user data, so it is SSG. Only the pages behind
authentication are server-rendered per request. The practical benefit is that the login page keeps
working when the backend does not.

## Options considered

**Astro with React islands.** For a content site this is the better fit on the two axes that
matter most here: zero JavaScript by default, and interactivity only where an island is placed.
Rejected for now because the team chose Next.js, and because a single framework across the public
site and any later authenticated work is worth more than the bundle savings. If the public site
ever ships noticeably slow, this is the first thing to revisit.

**React Router v7 framework mode.** SSR-first, self-hosts cleanly, no client/server boundary to
reason about. Rejected because it has no ISR equivalent, so semi-dynamic content would be handled
purely through HTTP caching, which is more configuration to get right than the team wants to own.

**Staying with the Vite SPA.** Rejected: it is the defect being fixed.

## Consequences

- The build layer changes: Vite is replaced, Vitest gets its own config, Tailwind moves to the
  PostCSS plugin, Playwright starts `next start` instead of `vite preview`. The migration order is
  in `../migration-to-nextjs.md`.
- **React Aria Components ships no `"use client"` directives** (verified on 1.21.1: zero files in
  `dist`). Every library component is therefore reached through a wrapper under
  `src/components/<Name>/` whose file begins with `'use client'`. Application code imports
  wrappers only. The wrapper layer that already exists is kept for exactly this reason.
- Client-side navigation goes through React Aria's `RouterProvider`, wired to the Next router, so
  `Link` and `MenuItem href` do not fall back to full page loads.
- Choosing a managed platform later unlocks edge handlers and turnkey ISR; nothing has to be
  rewritten to take advantage of them. Choosing self-hosting later requires a cache handler for
  ISR and nothing else. That symmetry is the whole point of the three rules above.
- The accessibility gate stays as it is. `pnpm test:a11y` runs against the production server, so it
  now also verifies that content is present in the server-rendered HTML.
