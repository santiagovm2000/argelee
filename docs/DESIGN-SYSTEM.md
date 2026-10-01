# Design system

Read the `frontend-design` skill before building or reshaping UI. This file is the token contract;
that skill is the taste.

## Identity

The look is the owner's brand book (Armao, 2026): the "ArGeles" retro hand lettering with a
sunflower for its last letter, the "AG" monogram, a flat daisy-like sunflower, and a pattern of
pool-water caustics — light through water, which is also what light does through a clear jelly.
The brand sells _esculturas comestibles_ to hosts who want the "wow" without the stress, and sets
itself against the pastel-pink, children's-party look of its competitors.

- **Type.** `Lato` for everything a person reads: 400 for text, 700 for labels, names and buttons,
  900 for headings and prices. A script for section titles and the brand's few phrases said with
  feeling (`.script`): the book names Bella Elegante, which is not licensed for the web, so
  **Great Vibes** stands in, thickened a hair with a stroke of its own colour to match the book's
  weight. The logo is a drawing (`arg-wordmark`), never type.
- **Colour.** The book's five: **Azul Cristal** `#008AFF` (the water, the logo, links),
  **Turquesa Vital** `#00C1CA` (the lagoon band, the menu's pale aqua), **Amarillo Mango**
  `#FFCA00` (the sunflowers and the round price labels), **Naranja Coral** `#FF9000` (the one call
  to action), **Verde Menta** `#00CB7E` (kept in the scale; WhatsApp's own green does its job).
  The page is white, like the brand's paper; text is a deep-water navy, never black.
- **Shape.** Poured, not cut. Buttons and chips are full pills, cards `rounded-card`, photo frames
  `rounded-photo`, and a section that slides over another has a deep `rounded-t-sheet` top. The
  brand's circles recur where they mean something: the round lid the hero jelly turns in, the
  round seal on it, the round price label on every photo.
- **Voice.** Sentence case everywhere. Labels are Lato bold, not tracked capitals. The brand's own
  phrases are used as written: "Eleva el nivel de tus celebraciones", "El arte que decora tu mesa
  y conquista tu paladar", "Hecho con amor", "Para endulzar tu día".

Spend boldness in one place: the hero is the brand's cover — the Azul Cristal water, the white
logo resting large, a jelly turning in a round lid sealed with the brand's label, sunflowers at the
water's edge — and it is where the parallax lives. The menu, the product page and the order
conditions stay calm and white so the photographs carry them.

## No AI slop

The house style is _specific_, not _safe_. Three looks read instantly as machine-generated and are
banned unless someone argues them on the merits for this brand:

- cream background (#F4F1EA-ish) + high-contrast serif display + terracotta accent
- near-black background with a single acid-green or vermilion accent
- broadsheet layout: hairline rules, zero radius, dense newspaper columns

Also avoid, unless the content genuinely calls for it: a big-number-plus-tiny-label hero,
`01 / 02 / 03` step markers where the content is not a sequence, tracked-capital eyebrows over
every heading, meta strings joined with middle dots, arrows appended to link text, gradient text,
entrance animations on every block, and decorative motion scattered across the page. Structural
devices must encode something true about the content.

## Tokens

`src/styles/tokens.css` is the only place raw values are written. Tailwind v4 turns each `@theme`
entry into both a CSS variable and a utility class. A token name must not be shared between two
namespaces that produce the same utility (`--text-x` and `--color-x` both make `text-x`).

| Group       | Tokens                                                                                                                                                         | Utility                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Type family | `--font-body` and `--font-display` (both Lato), `--font-script`, `--font-mono`                                                                                 | `font-script`                            |
| Type scale  | `eyebrow`, `label`, `caption`, `body-sm`, `body`, `body-lg`, `title`, `subtitle`, `amount`, `price`, `headline`, `display`, `script-sm`, `script`, `statement` | `text-headline`                          |
| Brand       | `--color-mango-*`, `-coral-*`, `-crystal-*`, `-turquoise-*`, `-mint-*` (50 … 950), derived from the book's hexes                                               | `bg-crystal-500`                         |
| Neutral     | `--color-neutral-0` … `950`, on the crystal hue                                                                                                                | `text-neutral-500`                       |
| Status      | `--color-danger`, `--color-danger-soft` (the panel's errors, through `critical`)                                                                               | `text-critical`                          |
| Radius      | `--radius-control`, `-photo`, `-card`, `-panel`, `-sheet`                                                                                                      | `rounded-card`                           |
| Elevation   | `--shadow-raised`, `--shadow-overlay` (tinted blue, used sparingly)                                                                                            | `shadow-overlay`                         |
| Layout      | `--container-content/wide/prose/lid`, `--spacing-card/shelf/sheet/sticker/header/anchor`                                                                       | `max-w-lid`, `-mt-sheet`, `size-sticker` |
| Motion      | `--duration-instant/quick/settled/deliberate/reveal`, `--ease-out-quart`                                                                                       | `duration-settled`                       |

Never write a hex, a px font-size, or a ms duration in a template. If a value is missing, add a token.

Fonts are self-hosted from `src/styles/fonts/` (latin subset, OFL) and declared in `fonts.css`; the
build hashes them into `media/`. The PDF embeds the same files (the admin Worker bundles them). No
third-party font request leaves the page.

## Colour roles

Every scale is derived in OKLCH by `scripts/palette.ts` from the book's five hexes, each landing
exactly on the step whose lightness it is closest to (mango 300, coral 400, crystal 500,
turquoise 400, mint 400) and the others pulled back into sRGB where they would clip. Change a hex in
`BRAND` there and run `bun run palette`; never hand-edit a step.

Roles, defined in `base.css` and exposed as utilities:

| Token                | Use                                                             | Never                            |
| -------------------- | --------------------------------------------------------------- | -------------------------------- |
| `bg-accent`          | the primary button, Naranja Coral, with `text-accent-ink` on it | as a section background          |
| `text-accent-text`   | links, legends, "Ver y encargar" — Azul Cristal, darkened to AA | as a large fill                  |
| `bg-sticker`         | the round price labels and the seal, Amarillo Mango             | for anything that is not a label |
| `border-line`        | hairline dividers                                               | to bound a control               |
| `border-line-tint`   | the decorative aqua border (chips, quantity)                    | as the only cue of a state       |
| `border-line-strong` | the boundary of a control with no text to identify it, outlines | decoration                       |
| `text-wordmark`      | the logo                                                        | anything else                    |
| `fill-caustic`       | the water pattern over a scene                                  | anything else                    |
| `text-critical`      | the panel's error messages                                      | the site                         |

Surfaces and ink: `bg-surface`, `bg-surface-raised`, `bg-surface-tint`, `bg-surface-sunken`,
`text-ink`, `text-ink-muted`, `text-ink-subtle` (large text only).

**Always use the semantic alias, never a raw scale step.** `bg-surface`, not `bg-neutral-0`.
That is what makes dark mode and the scenes a few blocks in `base.css` instead of a rewrite of
every template.

### Scenes

Two classes in `base.css` redefine the same roles for a stretch of brand world, so what is inside
keeps writing `bg-surface text-ink` and simply reads right:

- **`.water`** — the Azul Cristal field of the hero, the footer and the link hub. Text is the deep
  navy of the brand's posts (white by night, on a deeper blue); the logo is white.
- **`.lagoon`** — the Turquesa Vital band of the brand's promise.

Over a scene, `arg-caustics` draws the brand's water pattern in `--caustic`, which always moves
away from the text colour (white over the day water, navy over the night water), so the pattern can
only raise contrast. `bun run contrast` checks that too.

`bun run contrast` resolves the real token values and fails below the AA floor on every surface,
both themes and both scenes. It is part of `bun run verify`, so a retuned colour cannot quietly
break legibility.

## Dark mode

Three states: `light`, `dark`, and `system` (the default, which keeps following the OS).
`ThemeService` toggles `.arg-dark` on `<html>`; Tailwind's `dark:` variant keys off that class.
Design both themes at the same time — never light-first with dark patched on. By night the page is
a deep-water navy, the menu a step lighter, cards a step lighter again; the water deepens to a
darker Azul Cristal and the lagoon to a deep teal, both with white text; the logo turns Turquesa
Vital on the page; coral stays the call to action and mango the labels.

Switching themes is a reveal, not a flash: `ThemeService.toggleFrom()` wraps the change in a view
transition and grows a `clip-path` circle out of the toggle with the Web Animations API, timed by
`--duration-reveal` and `--ease-out-quart`. The `arg-theme-reveal` class on `<html>` scopes the
CSS that mutes the default cross-fade, so route transitions keep theirs. Reduced motion and
browsers without view transitions get a plain flip.

Opening a piece is a page change, and the router animates it as one (`withViewTransitions`):
the photo morphs from its menu card into the product page (`[data-piece]`, see Motion below),
the old page fades out and the new one rises in. While it runs, `arg-page-change` on `<html>`
turns `scroll-behavior` off so the router's own scroll to the top, or back to the anchor, lands
before the new page is captured; animated, it would drag the whole live snapshot. A navigation
that only changes the fragment skips the transition altogether: that is a scroll, not a page.

## Components

There is no component library. The few shapes the site needs are ours:

- **The logo**: `shared/ui/wordmark` draws `public/brand/logo.svg` with `<use>` in the current
  colour, at the width its host is given. The brand drawings (logo, monogram, daisy, caustics) are
  named in `shared/ui/brand/brand-art.ts` with their view boxes.
- **Buttons**: `.button .button--primary` (coral pill, ink label), `.button .button--secondary`
  (an outline in `line-strong` on the page; on a scene an outline sinks into the colour, so there
  it becomes the white pill of the brand's card, with an ink label) and `.button .button--whatsapp`
  (WhatsApp green, only ever for WhatsApp), composed in `patterns.css`.
- **The script voice**: `.script` on a heading. Section titles ("Catálogo", "Antes de encargar")
  and the brand's key message; never body text, never a label, never part of a sentence.
- **The water**: `shared/ui/caustics` — two layers of the traced pattern (its lighter shapes at 14 %,
  its bright channels at 30 %), oversized by `--overhang` so they can drift without an edge showing.
  `motion` picks how they move: `depth` (the hero), `drift` (a scene further down) or `still`.
- **Sunflowers**: `shared/ui/bloom` — a spray of the traced daisy as one SVG, from the arrangements
  in `bloom.data.ts` (`pair`, `trio`, `column`), so a scene moves the whole spray as one layer.
- **The seal**: `shared/ui/seal` — the round label the brand seals its cups with: "Hecho con amor"
  over the monogram, "Para endulzar tu día" under it, in mango and navy. Decoration only.
- **The price label**: `shared/ui/price-sticker` — "Desde", the amount, and "c/u" for a piece sold
  by the unit, on a mango circle tilted over the corner of the photo.
- **The link hub** (`features/links`, at `/links`): the page behind the QR code and the social
  bios, laid out like the brand's business card: the logo and tagline on the water, three
  full-width buttons, WhatsApp, the site and the PDF price list. Its route trims the footer and the
  floating button through `data.chrome` (see `core/config/page-chrome.ts`).
- **The footer**: the brand's business card again — the water, the white logo and tagline, a column
  of sunflowers rising at its edge, and plain links to the menu, the conditions and the PDF.
- **Quantity**: `shared/ui/quantity-input`, a native number field between our own minus and plus
  buttons in one pill, for pieces sold by the unit.
- **Chips**: `shared/ui/choice-list` — pills, each with the fruit sticker of its flavour or fruit in
  a small aqua disc.
- **Fruit stickers**: plain SVG files in `public/icons/choices/<id>.svg`, one per flavour and
  fruit, hand-drawn on a 24×24 grid. Flat and rounded, no outlines: one body colour true to the
  fruit, one darker accent, a soft white gloss top-left, and the same leaf green `#5FB37A` and stem
  brown `#8C6A4A` on every one. Templates draw one with `<use href>` through
  `shared/ui/icons/icons.ts`, so a file is fetched once and never inlined. Draw new ones in the
  same language; never pull in an icon set.
- **The menu**: `features/landing/sections/catalog-section`. On a phone it is a native horizontal
  scroller with snap points (`.shelf`); the arrows only nudge it, and a rail under it carries an
  ink segment that travels with the shelf's own scroll. From `md` the same list is a grid, two then
  three across, whose middle column drifts at its own depth (Motion). Frames never crop: each photo
  is contained over a blurred wash of its own placeholder.
- **A piece's photos**: the cover first, then the rest, always in one frame that does not change
  size. The frame holds a native strip that snaps one photo at a time (`.gallery`, driven by the
  `[argPhotoStrip]` directive, which knows the photo in view from an observer and goes back to the
  cover when the live menu brings a new one). On a **menu card** a swipe or a trackpad pages it,
  dots in a small pill at the foot of the photo say where it is, and under a mouse two round arrows
  appear on hover; they go round in a circle, past the last photo to the cover and back. A tap on a
  photo still opens the piece. On the phone shelf a swipe past the last photo carries on to the
  next piece. The paging is a pointer convenience, so the card's photo links and arrows are out of
  the tab order and hidden from screen readers; the name is the card's one link. On the **product
  page** (`shared/ui/photo-gallery`) the strip is a focusable region the arrow keys move, and round
  thumbnails under it, the brand's circles again, ring the photo in view in Azul Cristal and bring
  any other into it.
- **Cards and panels**: white on the aqua menu, `rounded-card`, no border and no resting shadow;
  under the pointer a card takes `shadow-overlay` and its photo leans in.
- **Hover, two families, both themes.** A filled button (primary, WhatsApp) lifts 2px and shifts
  its fill to its `*-hover` token. A quiet control (outline button, chip, arrow, nav link) takes the
  `surface-hover` fill. Inside the top bar controls tint themselves with `current/10`. No control is
  without a hover state.
- **Icons**: inline SVG, `stroke-width` 2 on the site, sized with `size-*`. No icon font.
- **The top bar**: fixed. At rest on the landing it is not there at all — the logo rests large and
  white on the water, the navigation is ink. Over the first stretch of scroll (`--mark-travel`) the
  white band fills in and the one logo rises and shrinks into it, turning Azul Cristal. Its resting
  CSS is the settled state, so Firefox and reduced-motion visitors get the readable bar from the
  start, and the hero only reserves room for the resting logo (`.hero-mark-room`, `--mark-room`)
  when the animation runs. Its focus ring follows its text colour, which reads on both.
- **The scrollbar**: `scrollbar-width: thin` and `scrollbar-color` on `html`, a thin aqua thumb.
- **Anchors**: sections reachable from the bar carry `scroll-mt-anchor`, and the router's
  `ViewportScroller` is given the same `--spacing-anchor` as an offset.
- **The WhatsApp button**: WhatsApp's own green with a white glyph, because that is what people
  recognise. It is the only WhatsApp entry point in the chrome.

## Responsive

Mobile-first, no exceptions. Every screen works from 320px.

- Layout containers use `max-w-wide` / `max-w-content` / `max-w-prose` plus padding, never a fixed width.
- Type scales with `clamp()`, so no breakpoint-specific font sizes are needed.
- Verify at 360, 768, 1280 and 1920. Check that nothing overflows horizontally at 320: every scene
  clips its decoration (`overflow-clip`).
- **The hero fills the first screen, whole, on every device.** It is `100svh` plus the overlap of
  the menu's curved top (`--spacing-hero`), so nothing else shows until you scroll. Until the two
  columns of `lg`, the jelly's lid takes whatever height the text leaves (`.hero-lid-area`, a size
  container) instead of a fixed size, never under 10rem; a phone on its side (wide but under 32rem
  tall) puts text and lid side by side; on a very short phone (under 38rem tall, an SE behind
  Safari's bars) the lead paragraph steps out of sight but stays for screen readers. The resting
  logo shrinks with the screen (`--mark-scale`). Check phones with their browser bars showing:
  390×664 is an iPhone in Safari, 375×553 an SE.
- Tailwind breakpoints match `BREAKPOINTS` in `core/config/app.constants.ts`: 640 / 768 / 1024 / 1280.
- Touch targets are at least 44x44 CSS px (`min-h-11` on chips and text links, `size-11` on
  icon buttons, `size-14` on the WhatsApp button).
- Anything clickable shows `cursor: pointer`, restored globally in `base.css`. Do not add
  `cursor-pointer` in templates.

## Accessibility floor

Not optional, and cheaper to keep than to retrofit:

- Contrast passes AA (`bun run contrast`), scenes included.
- Focus is always visible — `:focus-visible` is styled in `base.css`; never remove the outline.
- `prefers-reduced-motion: reduce` removes every animation, including the scroll-driven ones and
  the shelf's smooth scrolling, and hides the hero video so its poster shows instead.
- Real semantics: one `h1` per page, headings in order, buttons for actions, links for navigation,
  the menu is a `list`. Decoration (water, sunflowers, seal) is `aria-hidden`.
- Every interactive control has an accessible name, sourced from a translation key.
- The live price is an `aria-live` region that announces the new amount.
- The skip link in `app.html` stays first in the DOM.

## Motion

Motion has to mean something. The only animation is depth that answers the visitor's own
scrolling, plus quiet hover transitions and the page morph. Nothing floats, breathes or cascades in
on load.

The parallax is the brand's own picture: light through water. Over a scene the water lies far
below and lags behind the page, the sunflowers float near the surface and lead it, and the piece —
the jelly in its lid — stays still, because it is what the eye rests on. At most three layers move
at once; a far layer lags at most ~22svh per screen of scroll, a near one leads at most ~12svh and
turns at most 8°.

Scroll-driven motion lives in `src/styles/motion.css` and is **CSS only** — `animation-timeline`,
never a scroll listener. Every rule is gated twice, `@supports (animation-timeline: scroll())` and
`prefers-reduced-motion: no-preference`, and every class's un-animated state is its final, visible
state, so Firefox (until it ships timelines, planned for 159) and a visitor with reduced motion
both get the same finished, still page.

| Class                                           | What it does                                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.depth-far` / `.depth-mid` / `.depth-near`     | over the first screen of scroll (`scroll(root)`, `0 100svh`): the water lags, the sunflowers lead                                                                          |
| `.depth-turn`                                   | the seal on the hero lid turns a little, like a lid being opened                                                                                                           |
| `.scene-timeline` + `.drift-far` / `.drift-mid` | a scene further down (the lagoon, the footer) names its view timeline; its layers drift across it                                                                          |
| `.rise`                                         | the footer's sunflowers rise into place as the footer enters                                                                                                               |
| `.parallax-window` / `__backdrop`               | the blurred wash behind a photo slides as the card crosses the viewport, on a timeline the frame names so every photo in its strip follows it; the photo leans in on hover |
| `.shelf__card` (≥ lg, middle column)            | the grid's middle column drifts ±2.5rem, on the card's own view timeline, so the pieces stand at depths                                                                    |
| `.shelf__card` (< md)                           | on the phone shelf, cards sink and their photos fade as they slide out of either end                                                                                       |
| `.topbar::before` / `.topbar__mark`             | the bar fills in and the logo rises into it                                                                                                                                |
| `[data-piece]`                                  | the piece's photo morphs between its card and the product page through the router's view transition                                                                        |

Only `translate`, `rotate`, `scale` and `opacity` move. Never put a Tailwind `translate-*` or
`scale-*` utility on an element a keyframe animates — they set the same property; animate a wrapper
instead.
