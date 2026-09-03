# Tooling: skills and MCP servers

What to reach for, and when. Verified against the versions installed on 2026-09-02.

## MCP servers

`.mcp.json` is committed, so every clone gets the same servers.

### Configured

| Server                                    | Why it matters here                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `angular-cli` (`npx -y @angular/cli mcp`) | Ships with Angular 22. `get_best_practices` returns the _current_ official guidance instead of a model's memory of Angular 15; `search_documentation` queries angular.dev live; `find_examples` returns idiomatic signals / control-flow snippets. This is the single highest-value server for this repo — it is why generated code lands on `input()` and `@if` rather than decorators and `*ngIf`. Flags: `--read-only`, `--local-only`. |

### Worth adding

| Server                  | Install                                                               | Why                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chrome-devtools-mcp`   | `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest` | Drives a real Chrome: screenshots at each breakpoint, console and network inspection, Core Web Vitals traces. This is how "fully responsive" and "good LCP" get _verified_ rather than asserted. The highest-value addition for a landing page. |
| `@playwright/mcp`       | `claude mcp add playwright -- npx -y @playwright/mcp@latest`          | Accessibility-tree-based browser control. Better than DevTools MCP for repeatable interaction flows and for auditing semantics/ARIA. Some overlap — add it when the page grows real interaction.                                                |
| `@upstash/context7-mcp` | `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`      | Version-accurate docs for libraries with no first-party MCP. Useful here for PrimeNG 22 and Transloco 8, whose APIs changed recently.                                                                                                           |

Not wanted on this project: the Figma MCP.

Skip anything database-, backend- or deploy-related too: this project has no backend.

## Skills

### Every UI change

- **`frontend-design`** — aesthetic direction, typography pairing, and the anti-AI-slop calibration.
  Load it _before_ writing markup, not after. Required by `CLAUDE.md`.

### Verifying work

- **`claude-in-chrome`** — drive the real browser: screenshots, console logs, click through the page.
  The cheapest way to catch a responsive break or a broken hydration.
- **`design-review`** — designer's-eye QA: spacing inconsistency, hierarchy problems, AI-slop
  patterns, sluggish interactions. Run after a section is built, before calling it done.
- **`qa`** / **`qa-only`** — systematic functional pass. `qa-only` reports without editing.
- **`code-review`** — correctness review of the diff. Use `--fix` to apply findings.
- **`security-review`** — thin surface here (no backend), but worth it before going public.

### Shipping

- **`commit`** — Conventional Commits, which this project requires.
- **`simplify`** — reuse and dead-code cleanup after a feature lands. Quality only, not bug hunting.

### Occasionally

- **`design`** — a multi-artboard canvas for mocking screens before committing to code.
- **`design-consultation`** — full design-system proposal with font and colour previews.
  Useful once, when the visual identity is decided.
- **`spec`** — turns a vague brief into an executable spec. Worth it before a large feature.
- **`run`** — launches the app the way this project expects.
- **`learn`** — records a project learning so it survives context loss.
- **`update-config`** — edits `.claude/settings.json`: hooks, permissions, env.
- **`fewer-permission-prompts`** — allowlists the read-only commands used most, cutting interruptions.

### Not for this project

Anything video (`hyperframes`, `motion-graphics`, `product-launch-video`, …), mobile
(`flutter-dev`, `ios-*`), or backend (`nestjs-expert`, `supabase-database`). They will match on
keywords like "landing" or "design" — ignore them.

## A suggested loop

```
1. frontend-design           decide the direction before writing markup
2. build                     bun start, iterate
3. bun run verify            i18n + contrast + templates + lint + build
4. claude-in-chrome          screenshot at 360 / 768 / 1280 / 1920
5. design-review             designer's-eye pass, fix what it finds
6. code-review               correctness pass on the diff
7. commit                    Conventional Commits
```
