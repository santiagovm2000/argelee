# The catalogue PDF

`public/ArGeles-catalogo.pdf` is the price list customers download from the link hub. It is not
hand-made: `bun run catalog-pdf` builds it from the same data as the site, so a change to a price,
a name, a description or an order condition reaches the page and the PDF in one edit.

## Where things live

| What                                             | Where                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Pieces, prices, people served                    | `src/app/core/catalog/catalog.data.ts` (`PRODUCTS`)                             |
| Piece names and descriptions (Spanish)           | `public/i18n/es.json` → `catalog.products.<id>.name` / `.description`           |
| Order conditions and their grouping              | `public/i18n/es.json` → `landing.orders`, grouped in `order-conditions.data.ts` |
| Page layout, headings, photo crops               | `assets-src/catalog/catalog.html` (HTML + print CSS, A4)                        |
| Photos (enhanced, resized for print)             | `assets-src/catalog/photos/`                                                    |
| Fonts                                            | `assets-src/catalog/fonts.css` → the site's own `src/styles/fonts/*.woff2`      |
| Group glyphs in the conditions panel             | `public/icons/orders/<group>.svg`, the same files the landing section uses      |
| The generator                                    | `scripts/catalog-pdf.ts`                                                        |
| Internal flavour-and-fruit sheet (not published) | `assets-src/catalog/flavours-and-fruit.html`                                    |

The PDF is Spanish only, like the printed price list it replaces.

## How it is built

1. `catalog-pdf.ts` loads `catalog.html` with jsdom and fills every `[data-product="<id>"]` slot:
   the `<h3>` gets the piece's name, `.price` its price (`$60`, `$3,50`), `[data-description]` its
   description and `[data-serves]` the "Para X a Y personas" line, all from `PRODUCTS` and `es.json`.
2. Page 4 is the conditions page: `[data-conditions-title]` gets the landing section's title and
   `[data-conditions]` is built from `ORDER_CONDITION_GROUPS`, one column per group with its glyph,
   its title and its notes, exactly the groups the landing page shows.
3. The filled HTML is printed to A4 by Edge in headless mode
   (`--headless=new --print-to-pdf`). Edge ships with Windows, so the project adds no browser
   dependency. The filled file is deleted afterwards. `bun run catalog-pdf --preview` also writes
   a PNG of the four pages stacked (path printed) so the layout can be checked without opening
   the PDF.

Every slot is mandatory: a piece in `PRODUCTS` without a `data-product` slot in the template, or a
slot missing its name, price or description element, stops the build with a message.

## Editing

**A price, a name, a description, a condition.** Edit `catalog.data.ts` or `es.json` (and `en.json`
for the site), run `bun run i18n` if a key changed, then `bun run catalog-pdf`. Nothing in the
template needs touching.

**A photo or its crop.** Replace the file in `assets-src/catalog/photos/` (keep the name) or adjust
the `object-position` classes (`.pos-frutas`, `.pos-anillo`, `.pos-fresa`, `.img-low`) in
`catalog.html`. Then `bun run catalog-pdf`.

**Adding or removing a piece.** The layout is fixed by hand: the cover, four pieces "Para 16 a 20
personas" on page 2, two medium pieces plus the individual portion on page 3, the conditions and
the WhatsApp panel on page 4. Add a piece to `PRODUCTS` and
`es.json`/`en.json` as `docs/ARCHITECTURE.md` describes, then add an `<article class="piece"
data-product="<id>">` to the right group in `catalog.html` with its photo, a `<p class="size"
data-serves>` if the group mixes sizes, and an empty `<p data-description>`. Removing a piece is
the reverse. Pages are `height: 297mm; overflow: hidden`, so check the print for clipping.

**Anything else on the page** (cover copy, group headings, the WhatsApp number and line in the
panel, the "n de 4" footers) is plain text in `catalog.html`.

## Checking the result

Run `bun run catalog-pdf --preview` and look at the PNG: every page is `height: 297mm; overflow:
hidden`, so anything that grows past the page is cut, not wrapped. Page 4 has room for a few more
conditions; past that, take a little from `.condition-list li` padding in the print CSS.

Commit the regenerated PDF together with the data change that caused it.
