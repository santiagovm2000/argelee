# Argelee

Landing page and made-to-order menu for **ArGelees**, artisan jellies; orders convert through
WhatsApp. Angular 22 + Tailwind CSS 4, built and run with **Bun**. No component library: every
component is ours. No backend: the site prerenders to static HTML (`outputMode: "static"`) and
deploys to any static host.

This file is loaded on every session, so it holds only rules that are always true.
Detail lives in `docs/` — read the file you need, when you need it:

| Question                                       | File                    |
| ---------------------------------------------- | ----------------------- |
| Where does this code go? What may import what? | `docs/ARCHITECTURE.md`  |
| What colour / size / spacing do I use?         | `docs/DESIGN-SYSTEM.md` |
| How do I name it, write it, translate it?      | `docs/CONVENTIONS.md`   |
| How do pages, URLs and metadata work?          | `docs/SEO.md`           |
| Which skill or MCP helps here?                 | `docs/TOOLING.md`       |

---

## Non-negotiable rules

These are project law. If a change would break one, stop and say so instead of working around it.

1. **Separate files, always.** Never put HTML in a `.ts`. Every component is `name.ts` + `name.html`.
   Logic that is not view state belongs in a service, not the component.
2. **No native CSS in HTML.** No `style="..."`, no `[style.x]`, no `[ngStyle]`. Use Tailwind
   utilities; if a utility genuinely cannot express it, add a class in `src/styles/` and use that.
   Components have **no** stylesheet file — the schematics are configured with `style: none`.
   Every button shows `cursor: pointer` — Tailwind v4's preflight does not, so `base.css` sets it
   for `button`, `[role="button"]` and `summary`. It is global: never repeat it per button.
3. **No hardcoded text, in any language.** Every string a visitor can read comes from
   `public/i18n/<lang>.json` through a typed key from `T`. One JSON file per language, no splitting.
4. **No magic values.** Numbers and strings that carry meaning get a name in
   `core/config/app.constants.ts`, a `*.constants.ts`, a `*.data.ts`, or a local `const`.
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
10. **Never put the project name in a filename.** `theme.service.ts`, not `argelee.service.ts`.
11. **All tests live in `tests/`.** One folder, mirroring the source tree, never a spec file
    sitting next to the code it covers. Import through the path aliases (`@core/...`).
    Schematics are configured with `skipTests: true` so generators cannot scatter them.
12. **Every page exists in every language.** Routes are per-language (`/` es, `/en` en). Never add
    a route to one language only — it breaks the reciprocal hreflang set. Every page calls
    `SeoService.apply()` with typed keys and its path `segments`. See `docs/SEO.md`.
13. **The menu is data.** Pieces, sizes, layers, fruit and prices live in `core/catalog/`; the
    templates iterate them. Never describe a piece in HTML. See `docs/ARCHITECTURE.md`.
14. **No UI library.** Buttons, chips, the shelf, the toggle: all ours, all Tailwind utilities on
    native elements. Do not add a component library or an icon font; inline the SVG you need.
15. **Conventional Commits, always.** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`,
    `test:`, `perf:`, `build:`, `ci:`. Scope when it helps: `feat(catalog): add a piece`.

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

Read the `frontend-design` skill before building or reshaping any UI. The look is set and lives in
`docs/DESIGN-SYSTEM.md`: Italiana for headings, Karla for text, Parisienne for the wordmark; a
barely-blue white page, pale steel-blue panels, ink for the one call to action; straight corners,
hairline rules, small tracked capitals for labels. **No AI slop** and no template defaults: every
choice must be defensible for this brand.

Motion is restraint. Nothing floats, breathes or cascades in on load. The only animation is CSS
scroll-driven depth (`src/styles/motion.css`) that answers the visitor's own scrolling, plus quiet
hover transitions. No JavaScript scroll listeners, and every animated element is fully visible when
the animation does not run.

## Commands

```bash
bun install
bun start              # dev server
bun run build          # prerendered static build -> dist/argelee/browser
bun run build:pages    # same, with the /argelee/ base href for the GitHub Pages preview
bun run verify         # i18n + contrast + templates + structure + lint + test + build.

bun run i18n           # regenerate typed translation keys after editing a locale JSON
bun run images         # regenerate responsive AVIF derivatives + social cards + manifest
bun run favicon        # regenerate favicon.svg / .ico / apple-touch-icon from the wordmark font
bun run social-card    # redraw the brand card behind the home link preview, then run images
bun run palette        # re-derive the colour scale after changing the brand hex
bun run contrast       # WCAG AA check on the token pairings
bun run finalize       # sitemap + robots + llms + 404.html (runs inside build)
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
- `.env` holds `SITE_ORIGIN` and `SITE_INDEXABLE`, and is git-ignored. Never treat a value in the
  bundle as secret: minification is not encryption, so anything the browser needs is public.
- Every price is a placeholder until the owner supplies the real list. `SITE.whatsappNumber` is
  the real business line, in the digits-only form wa.me links take.
