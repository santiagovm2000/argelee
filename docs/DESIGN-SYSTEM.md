# Design system

Read the `frontend-design` skill before building or reshaping UI. This file is the token contract;
that skill is the taste.

## Identity

The look comes from the owner's Claude Design draft ("Decorativa" variant) and reads as a boutique
pâtisserie card: quiet, editorial, cool.

- **Type.** `Italiana` (a high-contrast display serif) for every heading, price and statement, at
  weight 400 and line-height 1 in the hero. `Karla` for all text, weight 300 for reading and 500 for
  the small tracked capitals. `Parisienne` for the wordmark and nothing else, in the wine of the
  hand-painted logo.
- **Colour.** A barely-blue white page (`surface`), pure white panels (`surface-raised`), and a
  pale steel blue (`surface-tint`) for the section that holds the menu. **The primary action is
  ink, not blue**: blue is for eyebrow labels, links and hairline rules. Photographs bring the only
  saturated colour; do not add warm accents to the chrome.
- **Shape.** Straight-cut: 4px controls, 10px cards, 8px panels. Rules are 1px. Decoration is a
  soft circle and a thin ring behind the hero, and the rule–dot–rule ornament under the headline.
- **Voice.** Eyebrows in small tracked capitals (`text-eyebrow`), buttons in small tracked
  capitals (`text-label`), everything else in sentence case.
- **Motion.** Restraint. Nothing floats, breathes or cascades in; the draft's own animations were
  rejected. The hero is a muted, looping video with the headline over it; after that, depth answers
  scrolling (photos inside their frames, the shelf's focus) and hover states transition quietly.

Spend boldness in one place: the hero — a full-bleed video, the headline at up to 110px over a
navy scrim. The section is scoped `.arg-dark`, so it uses the dark tokens whatever the theme.

## No AI slop

The house style is _specific_, not _safe_. Three looks read instantly as machine-generated and are
banned unless someone argues them on the merits for this brand:

- cream background (#F4F1EA-ish) + high-contrast serif display + terracotta accent
- near-black background with a single acid-green or vermilion accent
- broadsheet layout: hairline rules, zero radius, dense newspaper columns

Also avoid, unless the content genuinely calls for it: a big-number-plus-tiny-label hero,
`01 / 02 / 03` step markers where the content is not a sequence, gradient text, entrance
animations on every block, and decorative motion scattered across the page. Structural devices
must encode something true about the content.

## Tokens

`src/styles/tokens.css` is the only place raw values are written. Tailwind v4 turns each `@theme`
entry into both a CSS variable and a utility class.

| Group       | Tokens                                                                                                                                   | Utility                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Type family | `--font-display`, `--font-body`, `--font-script`, `--font-mono`                                                                          | `font-display`                      |
| Type scale  | `eyebrow`, `label`, `caption`, `body-sm`, `body`, `body-lg`, `title`, `statement`, `price`, `headline`, `display`, `script-sm`, `script` | `text-headline`                     |
| Tracking    | `--tracking-eyebrow`, `--tracking-label` (also baked into `text-eyebrow` / `text-label`)                                                 | `tracking-label`                    |
| Brand       | `--color-brand-50` … `950`, derived from `#4E6E90`                                                                                       | `bg-brand-600`                      |
| Neutral     | `--color-neutral-0` … `950`, hue-matched to the brand                                                                                    | `text-neutral-500`                  |
| Wine        | `--color-vino`, `--color-vino-soft`                                                                                                      | `text-vino`                         |
| Radius      | `--radius-control` (4px), `--radius-card` (10px), `--radius-panel` (8px)                                                                 | `rounded-card`                      |
| Elevation   | `--shadow-raised`, `--shadow-overlay`                                                                                                    | `shadow-raised`                     |
| Layout      | `--container-content`, `--container-wide`, `--container-prose`, `--spacing-card`, `--spacing-shelf`                                      | `max-w-wide`, `w-card`, `gap-shelf` |
| Motion      | `--duration-instant/quick/settled/deliberate`, `--ease-out-quart`                                                                        | `duration-settled`                  |

Never write a hex, a px font-size, or a ms duration in a template. If a value is missing, add a token.

Fonts are self-hosted from `src/styles/fonts/` (latin subset, OFL) and declared in `fonts.css`; the
build hashes them into `media/`. No third-party font request leaves the page.

## Colour roles

The brand hue is the draft's steel blue, `#4E6E90`, anchored at step 600. The full scale is derived
from it in OKLCH by `scripts/palette.ts` — change `BRAND_HEX` there and run `bun run palette`,
never hand-edit a step. Neutrals carry a visible trace of the same hue, which is what makes the ink
read as navy rather than black.

Roles, defined in `base.css` and exposed as utilities:

| Token                | Use                                                   | Never                      |
| -------------------- | ----------------------------------------------------- | -------------------------- |
| `bg-accent`          | the primary button and the WhatsApp button (ink)      | as a section background    |
| `text-accent-ink`    | the label _on_ an accent fill                         | on the page background     |
| `text-accent-text`   | eyebrows, links, the selected chip's border           | as a large fill            |
| `border-line`        | hairline dividers                                     | to bound a control         |
| `border-line-tint`   | the decorative blue rule and border (cards, chips)    | as the only cue of a state |
| `border-line-strong` | the boundary of a control with no text to identify it | decoration                 |
| `text-wordmark`      | the wordmark                                          | anything else              |

Surfaces and ink: `bg-surface`, `bg-surface-raised`, `bg-surface-tint`, `bg-surface-sunken`,
`text-ink`, `text-ink-muted`, `text-ink-subtle` (large text only).

**Always use the semantic alias, never a raw scale step.** `bg-surface`, not `bg-brand-50`.
That is what makes dark mode two blocks in `base.css` instead of a rewrite of every template.

`bun run contrast` resolves the real token values and fails below the AA floor, on every surface
including the tint. It is part of `bun run verify`, so a retuned colour cannot quietly break
legibility. Chips convey selection by fill, border and text colour together, never by the border
alone.

## Dark mode

Three states: `light`, `dark`, and `system` (the default, which keeps following the OS).
`ThemeService` toggles `.arg-dark` on `<html>`; Tailwind's `dark:` variant keys off that class.
Design both themes at the same time — never light-first with dark patched on. In dark mode the
page is an inky navy, the panels a step lighter, the accent flips to a light button with dark text,
and the wordmark softens to a rose.

Switching themes is a reveal, not a flash: `ThemeService.toggleFrom()` wraps the change in a view
transition and grows a `clip-path` circle out of the toggle with the Web Animations API, timed by
`--duration-reveal` and `--ease-out-quart`. The `arg-theme-reveal` class on `<html>` scopes the
CSS that mutes the default cross-fade, so route transitions keep theirs. Reduced motion and
browsers without view transitions get a plain flip.

Opening a piece is a page change, and the router animates it as one (`withViewTransitions`):
the photo morphs from its shelf card into the product page (`[data-piece]`, see Motion below),
the old page fades out and the new one rises in. While it runs, `arg-page-change` on `<html>`
turns `scroll-behavior` off so the router's own scroll to the top, or back to the anchor, lands
before the new page is captured; animated, it would drag the whole live snapshot. A navigation
that only changes the fragment skips the transition altogether: that is a scroll, not a page.

## Components

There is no component library. The few shapes the site needs are ours:

- **Buttons**: `.button .button--primary` (ink) and `.button .button--secondary` (azul hairline),
  composed in `patterns.css`. Same padding, same small capitals, same 4px corners everywhere.
- **Chips**: `shared/ui/choice-group` — native radios and checkboxes inside a `fieldset`, styled
  through the label with `has-checked:`. Keyboard and screen readers work for free.
- **The shelf**: `features/landing/sections/catalog-section` — a native horizontal scroller with
  snap points (`.shelf` in `patterns.css`); the arrows only nudge it. The row starts on the
  content column's left edge, level with the rail. Cards dim, shrink and settle a little lower as
  they slide out of either end through a CSS `view(inline)` timeline, like plates on a counter. Under the shelf a hairline rail carries an ink segment that travels with the shelf's
  own scroll (`scroll-timeline` on the shelf, `timeline-scope` on the section), so position is
  visible without dots or script.
- **Cards and panels**: white, 1px `line-tint` border, `rounded-card` / `rounded-panel`,
  `shadow-raised` at rest.
- **Hover, two families, both themes.** A filled button (primary, WhatsApp) lifts 2px and shifts
  its fill to its `*-hover` token. A quiet control (chip, shelf arrow, secondary button, card
  frame) takes the accent border; chips and arrows also take the `surface-hover` fill, and the
  secondary button fills and inverts. Inside the top bar, whose colour is animated, controls tint
  themselves with `current/12` instead. No control is without a hover state.
- **Icons**: inline SVG, `stroke-width` 1.5, sized with `size-*`. No icon font.
- **The top bar**: fixed, and at rest on the landing it is not there at all — the video owns the
  top, the wordmark sits large and rose over it, the navigation is light. Over the first stretch
  of scroll (`--mark-travel`) the band frosts in, the one wordmark rises and shrinks into it and
  turns wine, the navigation turns ink. Everything inside the bar uses `text-current` so a single
  animated colour carries it. Its resting CSS is the settled state, so Firefox and reduced-motion
  visitors get the readable band from the start. The scroll animations are scoped with
  `:root:has(.hero-stage)`, so every other page gets the settled bar immediately.
- **The scrollbar**: the standard `scrollbar-width: thin` and `scrollbar-color` on `html`, a
  thin `line-tint` thumb on no track. No `::-webkit-scrollbar` rules — Chromium ignores them once
  the standard properties are set.
- **Anchors**: sections reachable from the bar carry `scroll-mt-anchor`, and the router's
  `ViewportScroller` is given the same `--spacing-anchor` as an offset, because its own scrolling
  ignores `scroll-margin`. A navigation that only changes the fragment skips the router's view
  transition: cross-fading a page while it scrolls reads as a stutter and interrupts the hero video.
- **The WhatsApp button**: the one exception to the palette — WhatsApp's own green with a white
  glyph, because that is what people recognise. It is the only WhatsApp entry point in the chrome;
  the footer carries none.

## Responsive

Mobile-first, no exceptions. Every screen works from 320px.

- Layout containers use `max-w-wide` / `max-w-content` / `max-w-prose` plus padding, never a fixed width.
- Type scales with `clamp()`, so no breakpoint-specific font sizes are needed.
- Verify at 360, 768, 1280 and 1920. Check that nothing overflows horizontally at 320.
- Tailwind breakpoints match `BREAKPOINTS` in `core/config/app.constants.ts`: 640 / 768 / 1024 / 1280.
- Touch targets are at least 44x44 CSS px (`min-h-11` on chips and text links, `size-11` on
  icon buttons, `size-14` on the WhatsApp button).
- Anything clickable shows `cursor: pointer`. Tailwind v4's preflight dropped this for `button`
  (v3 had it), so `base.css` restores it for `button`, `[role="button"]` and `summary`, excluding
  disabled controls. Do not add `cursor-pointer` in templates — it is already global.

## Accessibility floor

Not optional, and cheaper to keep than to retrofit:

- Contrast passes AA (`bun run contrast`).
- Focus is always visible — `:focus-visible` is styled in `base.css`; never remove the outline.
- `prefers-reduced-motion: reduce` removes every animation, including the scroll-driven ones and
  the shelf's smooth scrolling, and hides the hero video so its poster shows instead; do not opt
  an element out of it.
- Real semantics: one `h1` per page, headings in order, buttons for actions, links for navigation,
  the shelf is a `list`.
- Every interactive control has an accessible name, sourced from a translation key. A visible
  label is never overridden by a different `aria-label`.
- The live price is an `aria-live` region that announces the new amount.
- The skip link in `app.html` stays first in the DOM.

## Motion

Motion has to mean something: it shows causality, or reveals hierarchy, or acknowledges input.
Ambient drifting, breathing loops and entrance cascades read as filler and were explicitly
rejected for this site. Use the duration tokens — `quick` for hover and state changes, `settled`
for the rest.

Scroll-driven motion lives in `src/styles/motion.css` and is **CSS only** — `animation-timeline`,
never a scroll listener. It runs on the compositor, needs no JavaScript, and applies from the
first paint of the prerendered HTML, so nothing jumps on hydration.

| Class                                          | What it does                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.parallax-window` / `.parallax-window__image` | a photo slides inside its frame as the card crosses the viewport                                                                                                   |
| `.shelf__card`                                 | cards fade and sink as they slide out of either end of the shelf                                                                                                   |
| `[data-piece]`                                 | the piece's photo morphs between its shelf card and the product page through the router's view transition; the rest of the page fades out and the new one rises in |

Every class's un-animated state is its final, visible state, so a browser without
`animation-timeline` (Firefox, for now) and a visitor with reduced motion both get the same
static page.
