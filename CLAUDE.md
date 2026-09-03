# Argelee

Marketing landing page. Angular 22 + PrimeNG 22 + Tailwind 4, built and run with **Bun**.
No backend: the site prerenders to static HTML (`outputMode: "static"`) and deploys to any static host.

This file is loaded on every session, so it holds only rules that are always true.
Detail lives in `docs/` — read the file you need, when you need it:

| Question                                       | File                    |
| ---------------------------------------------- | ----------------------- |
| Where does this code go? What may import what? | `docs/ARCHITECTURE.md`  |
| What colour / size / spacing do I use?         | `docs/DESIGN-SYSTEM.md` |
| How do I name it, write it, translate it?      | `docs/CONVENTIONS.md`   |
| Which skill or MCP helps here?                 | `docs/TOOLING.md`       |

---

## Non-negotiable rules

These are project law. If a change would break one, stop and say so instead of working around it.

1. **Separate files, always.** Never put HTML in a `.ts`. Every component is `name.ts` + `name.html`.
   Logic that is not view state belongs in a service, not the component.
2. **No native CSS in HTML.** No `style="..."`, no `[style.x]`, no `[ngStyle]`. Use Tailwind
   utilities; if a utility genuinely cannot express it, add a class in `src/styles/` and use that.
   Components have **no** stylesheet file — the schematics are configured with `style: none`.
3. **No hardcoded text, in any language.** Every string a visitor can read comes from
   `public/i18n/<lang>.json` through a typed key from `T`. One JSON file per language, no splitting.
4. **No magic values.** Numbers and strings that carry meaning get a name in
   `core/config/app.constants.ts`, a `*.constants.ts`, or a local `const`.
5. **Strong typing.** `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
   No `any`. Use `unknown` and narrow. Never loosen a compiler flag to make code compile.
6. **Comments are brief, in English, and only on functions, methods and classes.**
   Never comment a variable, a constant, or a parameter — name it better instead.
7. **No aggressive lifecycle hooks.** Never `ngDoCheck` or `ngOnChanges`; they run on every
   change-detection pass. Derive with `computed()` / `linkedSignal()` from `input()` signals.
8. **Fully responsive.** Every screen works from 320px up. Design mobile-first, verify at
   360 / 768 / 1280 / 1920. No fixed pixel widths on layout containers.
9. **Accessibility is a floor, not a feature.** WCAG AA contrast, visible keyboard focus,
   `prefers-reduced-motion` respected, real semantics. `bun run contrast` must pass.
10. **Never put the project name in a filename.** `theme.preset.ts`, not `argelee.preset.ts`.
11. **All tests live in `tests/`.** One folder, mirroring the source tree, never a spec file
    sitting next to the code it covers. Import through the path aliases (`@core/...`).
    Schematics are configured with `skipTests: true` so generators cannot scatter them.
12. **Conventional Commits, always.** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`,
    `test:`, `perf:`, `build:`, `ci:`. Scope when it helps: `feat(landing): add pricing section`.

## Angular rules

- Standalone components only. Never write `standalone: true` — it is the default.
- Never set `changeDetection: OnPush` — it is the default in v22.
- Signals for state: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`.
- `inject()`, never constructor injection. `@Service()` for new singletons, not `@Injectable({providedIn:'root'})`.
- Native control flow (`@if` / `@for` / `@switch`). Never `*ngIf` / `*ngFor` / `ngClass` / `ngStyle`.
- Host bindings go in the `host` object of the decorator, never `@HostBinding` / `@HostListener`.
- `NgOptimizedImage` (`ngSrc`) for every raster image. Feature routes are lazy-loaded.
- Prefer Signal Forms (`@angular/forms/signals`) when forms arrive.

## Design

Read the `frontend-design` skill before building or reshaping any UI. **No AI slop**: no generic
cream-and-serif, no lone-acid-accent-on-black, no default gradient hero. Choices must be specific
to this brand and defensible. The palette is derived from the primary `#3AC5F7`; see
`docs/DESIGN-SYSTEM.md` before picking any colour, size or spacing value.

## Commands

```bash
bun install
bun start              # dev server
bun run build          # prerendered static build -> dist/argelee/browser
bun run verify         # i18n + contrast + templates + structure + lint + test + build.

bun run i18n           # regenerate typed translation keys after editing a locale JSON
bun run images         # regenerate responsive AVIF derivatives + manifest
bun run palette        # re-derive the colour scale after changing the brand hex
bun run contrast       # WCAG AA check on the token pairings
bun run check:templates # no hardcoded text, no native CSS in templates
bun run check:structure # tests only in tests/, no project name in a filename
bun run test           # vitest, reads only from tests/
```

`bun run verify` is the gate. A change is not done until it passes.

## Working agreements

- Use `bun`, never `npm`/`yarn`/`pnpm`. Generate files with `bun run ng generate ...` so the
  configured schematics apply.
- After editing a locale JSON, run `bun run i18n` — a missing key in one language fails the build.
- Never edit a `*.generated.ts` file. Change its source and re-run the generator.
- `.env` holds `PRIMENG_LICENSE_KEY` and is git-ignored. Never commit a key.
