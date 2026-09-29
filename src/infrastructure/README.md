# infrastructure/

How data gets in and stays fresh: the content source selection (local fixtures now, CMS
later), the CMS and search clients, the cache tag registry and revalidation plumbing, typed
environment parsing (the only place `process.env` is read), logging.

Infrastructure never imports a module. A module's `data/sources/cms/` uses the client from
here and its own mappers to shape the result. See `docs/project-structure.md`, section 1
and `docs/adr/0005-rendering-strategy-and-hosting.md` for the caching rules.
