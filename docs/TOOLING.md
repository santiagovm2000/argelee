# Tooling: skills and MCP servers

What to reach for, and when. `.mcp.json` is committed, so every clone gets the same servers.

## MCP servers

| Server                  | Why it matters here                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular-cli`           | Ships with Angular 22. `get_best_practices` returns the _current_ official guidance instead of a model's memory of Angular 15; `search_documentation` queries angular.dev live. This is why generated code lands on `input()` and `@if`. |
| `chrome-devtools-mcp`   | Drives a real Chromium: screenshots at each breakpoint, console and network inspection, Lighthouse, Core Web Vitals traces. This is how "fully responsive" and "good LCP" get _verified_ rather than asserted.                           |
| `@playwright/mcp`       | Accessibility-tree-based browser control. Better for repeatable interaction flows and for auditing semantics/ARIA.                                                                                                                       |
| `@upstash/context7-mcp` | Version-accurate docs for libraries with no first-party MCP (Transloco, Tailwind).                                                                                                                                                       |
| `claude_design`         | Reads the owner's Claude Design projects (`DesignSync`). Needs `/design-login` once per session. Files come back capped at 256 KiB, so large images must be exported by hand.                                                            |

### Browser binary

This machine has no Google Chrome, so both browser servers are pointed at Edge (Chromium, CDP 1.3)
in `.mcp.json`: `chrome-devtools` via `--executablePath`, `playwright` via `--browser msedge`. If
Chrome ever gets installed, drop both flags — they are the only reason those entries carry arguments.

Two things learnt the hard way with the DevTools server: a screenshot of a **background tab** hangs
until the protocol timeout, so call `select_page` with `bringToFront` first; and a Lighthouse run
leaves its mobile emulation on the page, so reset the viewport with `emulate` afterwards.

Not wanted on this project: the Figma MCP. Skip anything database-, backend- or deploy-related
too: this project has no backend.

## Skills

### Every UI change

- **`frontend-design`** — aesthetic direction, typography pairing, and the anti-AI-slop calibration.
  Load it _before_ writing markup, not after. Required by `CLAUDE.md`.

### Verifying work

- **`chrome-devtools` MCP** — screenshots at 360 / 768 / 1280 / 1920, console logs, Lighthouse,
  a performance trace. The cheapest way to catch a responsive break, a 404 or a broken hydration.
- **`design-review`** — designer's-eye QA: spacing inconsistency, hierarchy problems, AI-slop
  patterns, sluggish interactions. Run after a section is built, before calling it done.
- **`qa`** / **`qa-only`** — systematic functional pass. `qa-only` reports without editing.
- **`code-review`** — correctness review of the diff. Use `--fix` to apply findings.
- **`security-review`** — thin surface here (no backend), but worth it before going public.

### Shipping

- **`commit`** — Conventional Commits, which this project requires. The owner reviews the running
  site first; a green `verify` is not licence to commit.
- **`simplify`** — reuse and dead-code cleanup after a feature lands. Quality only, not bug hunting.

### Occasionally

- **`design`** — a multi-artboard canvas for mocking screens before committing to code.
- **`spec`** — turns a vague brief into an executable spec. Worth it before a large feature.
- **`run`** — launches the app the way this project expects.
- **`learn`** — records a project learning so it survives context loss.
- **`update-config`** — edits `.claude/settings.json`: hooks, permissions, env.

### Not for this project

Anything video (`hyperframes`, `motion-graphics`, `product-launch-video`, …), mobile
(`flutter-dev`, `ios-*`), or backend (`nestjs-expert`, `supabase-database`). They will match on
keywords like "landing" or "design" — ignore them.

## A suggested loop

```
1. frontend-design           decide the direction before writing markup
2. build                     bun start, iterate
3. bun run verify            i18n + contrast + templates + structure + lint + test + build
4. chrome-devtools           screenshot at 360 / 768 / 1280 / 1920, Lighthouse, trace
5. design-review             designer's-eye pass, fix what it finds
6. code-review               correctness pass on the diff
7. hand over                 the owner reviews; commit only on their word
```
