# How design and code work together

Two tools, one contract. **The repository is the contract, not the canvas.** Claude Design
composes screens from what this folder declares; Claude Code implements from the specs this
folder produces. Neither side invents a component or a colour on its own.

## The three inputs the canvas may not bypass

| Input                    | File                                                        | Owned by                                   |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| Available components     | `component-exports.generated.md` + `component-inventory.md` | code, generated from the installed package |
| Colour, spacing, type    | `../src/styles/tokens.css`                                  | code, contrast budget enforced in CI       |
| Content model and routes | `information-architecture.md`                               | product plus design, agreed once           |

`brief.md` is the document you paste into Claude Design as the starting instruction. It exists so
the canvas starts from these three inputs instead of from a blank page.

**New to this process? Read `workflow.md`.** It walks the whole loop step by step, with the prompts
to use, where each crossing between the two tools happens, and what to do when design and code
disagree.

## The loop

1. **Audit and IA**, in Claude Code: what the current site holds, what the new structure is.
   Output: `information-architecture.md`.
2. **Inventory**, generated: `pnpm run design:inventory`. CI runs `--check` so it cannot go stale.
3. **Brief**: `brief.md`, updated whenever a constraint changes.
4. **Canvas**, in Claude Design: artboards named after routes. Every block annotated with the
   React Aria component it maps to, or marked as plain HTML. Canvas source lives in
   `canvas/*.dc.html` so it is versioned and readable by Claude Code.
5. **Spec per screen**: `screens/<route>.md`, generated from the finished artboard. Layout,
   token names, component props, states, breakpoints, edge cases, empty and error states.
6. **Implementation**, in Claude Code, from the spec. The accessibility gate in CI catches drift.
7. **Feedback**: when implementation finds that the library cannot do what the artboard shows,
   that is an ADR plus an edit to `brief.md`. Skipping this step is how the canvas and the code
   diverge by the third screen.

## Drift rule

The canvas editor publishes its own versions. When you edit visually and save, the published
artifact is ahead of `canvas/*.dc.html`.

- The canvas is authoritative for **appearance** until a spec is generated from it.
- From then on `screens/<route>.md` is authoritative for **implementation**.
- Re-export the artboard into `canvas/` before generating a spec, so the repo holds the version
  the spec was written from.

Record the published canvas URL in this file when it exists, so any later session finds it
without searching the conversation history.

Canvas URL: not created yet.

## Folder layout

```
design/
  README.md                          this file
  workflow.md                        step-by-step operating manual for the loop
  brief.md                           input for Claude Design
  information-architecture.md        content model, routes, rendering tier per route
  component-inventory.md             policy: what may be used, and what needs JavaScript
  component-exports.generated.md     generated from the installed react-aria-components
  canvas/                            .dc.html artboard sources, versioned
  screens/                           per-route handoff specs, the implementation contract
```
