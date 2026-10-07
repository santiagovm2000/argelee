# The admin panel and the catalogue

The menu is not in the repo. It is a JSON document the owner edits at **admin.argelees.com**, stored
in Cloudflare KV, with photos in R2 and a price-list PDF rendered on demand. The public site reads
that document at build time (to prerender) and again in the browser (to show the live version).
Nothing the owner does in the panel touches git.

## Shape

```
argelees.com                Worker "argelees"        wrangler.jsonc, workers/site/
  static assets             dist/argelee/browser     prerendered pages, served before the script
  GET  /api/catalog         KV -> public projection  ETag = catalogue version, max-age 60
  GET  /photos/<sha>.jpg    R2                       immutable
  GET  /ArGeles-catalogo.pdf R2                      the PDF the panel last generated
  GET  /sitemap.xml         fixed pages + published pieces from KV
  GET  /catalog/<id>        prerendered page, or the CSR shell with meta injected if the piece
                            was published after the last build; 404 if it does not exist

admin.argelees.com          Worker "argelees-admin"  admin/wrangler.jsonc, workers/admin/
  SPA                       dist/admin/browser       the Angular app in projects/admin/
  POST /api/login, /api/logout, GET /api/me          one user, signed cookie
  GET/PUT /api/catalog      the full document, optimistic concurrency with If-Match
  PUT  /api/photos/<sha>.<ext>                       R2 put, key = content hash
  POST /api/pdf             Browser Rendering -> R2
  GET  /api/status          catalogue version vs PDF version
  GET  /api/instagram       whether a token is set, and for which account
  PUT  /api/instagram/slides/<uuid>.jpg              R2 put under posts/, for a few seconds
  POST /api/instagram/publish                        Instagram API, then the slides are removed
  GET  /posts/<uuid>.jpg    R2, no login: where Instagram fetches a parked slide
  cron, Mondays             renews the Instagram token, removes any slide left parked

shared                      KV namespace CATALOG (keys catalog, catalog:version, pdf:version,
                            instagram:token)
                            R2 bucket argelees-media (photos/*, catalog/ArGeles-catalogo.pdf,
                            posts/* while a publication is being sent)
```

Both Workers only do I/O: read KV, stream R2, call one API. Hashing, image resizing and PDF
rendering happen in the owner's browser or in Cloudflare services, which keeps every request
inside the free plan's CPU budget.

## The document

`src/app/core/catalog/catalog.document.ts` is the contract, shared by the site, the panel and both
Workers, pure TypeScript with no Angular:

```
CatalogDocument { version, updatedAt, products: StoredProduct[] }
StoredProduct {
  id          UUID, generated when the piece is created, never shown, never edited
  published   hidden pieces stay in the panel but leave the site, the sitemap and the PDF
  text.es     { name, note, description }
  photos      [{ key, width, height, placeholder }, ...]   gallery order, the first is the cover;
              at most MAX_PHOTOS_PER_PIECE (8), none twice; a piece without one cannot be published
  pricing     { mode: 'fixed', price }
            | { mode: 'calculated', cost, margin: { kind: 'percent' | 'amount', value }, price }
  serves      [from, to] | null   (null = sold by the unit)
  flavours    FlavourId[] | null   fruits  FruitId[] | null   (what it comes with, shown as information)
}
```

`parseCatalogDocument()` validates an unknown value field by field and names what is wrong
(`document.products[2].serves.to: must be at least 8`); the admin Worker runs it on every PUT and
answers 422 with the list. `projection.ts` turns the document into what the site may see:
published pieces only, `pricing` collapsed to `price`, `photos` never empty (`ProductPhotos`, the
cover first). Cost and margin never leave the admin Worker.

A document saved before pieces had galleries carries a single `photo` (or `null`) instead of
`photos`. The reader takes it as a gallery of one, so the Workers and `catalog:pull` keep working
on it, and the next save from the panel writes `photos`. Nothing has to be migrated by hand.

The site's `CatalogService` starts from `catalog.snapshot.generated.ts` (git-ignored, written by
`bun run catalog:pull` before every build and start) and, once the app is stable in the browser,
fetches `/api/catalog` and swaps in the live version. Google indexes the snapshot of the last
deploy; visitors always see the current menu.

Every save writes a new `version` (ISO time plus a short hash). The public API's `ETag` is that
version and its cache lasts a minute, so a change is visible everywhere within a minute without
purging anything. Photos are keyed by their SHA-256, so a replaced photo is a new URL and the old one
can be cached forever.

## The flow in the panel

1. **List.** Order by drag (or arrow keys on the handle), a switch per piece for published/hidden,
   the round camera glyph to make its Instagram publication, pencil to edit, bin to delete, search
   by name. Reorder, visibility and deletion are edits of the
   list and need **Guardar cambios**.
2. **Piece.** Photos, visibility, price, texts, size and the flavour and fruit groups, saved in one
   go with **Guardar pieza**. The photos are a grid with the cover first and large: **Añadir
   fotos** takes several at once (or a drop from the computer), the star in a photo's top-right
   corner makes it the cover (it moves to the front), and the bin in the other corner removes it
   after asking. The cover is what the menu card opens on, what link previews show and what the
   PDF prints. The price is either typed (fixed) or calculated from the total
   manufacturing cost plus a margin, as a percentage or a fixed amount. Everything moves together:
   the final price follows either the exact figure (cost plus margin on the half-dollar grid) or
   the rounded one (nearest step in `SALE_PRICE_STEPS`: 0,50 below 10, 5 from 10 up), chosen with
   two chips; a price typed by hand wins and the margin is worked back from it (`marginFor`);
   switching the margin between percentage and amount keeps the same figure. The line under the
   field states the real margin the chosen price leaves.
3. **PDF.** A save leaves the PDF behind; the bar says so and offers **Generar PDF**, which renders
   the price list from the saved document and stores it where `/ArGeles-catalogo.pdf` serves it.
4. **Publication.** The two Instagram slides of a piece, painted in the browser, then downloaded
   or published straight to the account; see below.

The bar under the list shows one message and one next step at a time: unsaved changes → save;
saved → generate the PDF; PDF generated → open it. A save conflict (someone saved from elsewhere, 412) offers to reload; a validation error lists the fields.

## Login

One owner, one user and password, no Cloudflare Access. Everything is Web Crypto in
`workers/admin/session.ts`, no dependencies:

- `ADMIN_USER` and `ADMIN_PASSWORD_HASH` are Worker secrets. The hash is
  `pbkdf2-sha256$<iterations>$<salt>$<digest>`; the plain password is never stored anywhere.
  `bun run admin:credentials --remote` prompts for both without echo and runs `wrangler secret put`
  itself; `--local` writes `admin/.dev.vars` (git-ignored) for development.
- A successful login sets `arg_session`, an HMAC-signed `<expiry>.<signature>` cookie
  (`SESSION_SECRET`), `HttpOnly; Secure; SameSite=Strict`, thirty days. Every `/api/*` route but
  login requires it; every mutation also requires the `X-Requested-With: admin` header.
- `LOGIN_LIMITER` (a Workers rate-limit binding, 5 attempts per minute per IP) answers 429 after
  that. The login form says only that user or password is wrong.

Changing the password is running `bun run admin:credentials --remote` again. Rotating
`SESSION_SECRET` logs every device out.

The panel's response headers are stricter than the site's: its CSP allows no inline scripts at all.
That is why the panel's production build sets `inlineCritical: false` in `angular.json`: Angular's
default inlines the critical CSS and loads the rest through an inline `onload` handler, which the
CSP blocks, and the page then renders unstyled. Keep the two in step.

## Photos

The panel resizes each picture in the browser (longest side 2560px, JPEG), computes its SHA-256,
reads its dimensions, draws a 20px WebP placeholder as a `data:` URL, and uploads it to
`PUT /api/photos/<sha>.jpg`, one after another, adding each to the piece as soon as it is stored.
The list itself only changes through `core/catalog/gallery.ts` (`withPhotos`, `withoutPhoto`,
`withCover`), which keeps it under the cap and free of repeats. The site serves it from R2 at `/photos/<sha>.jpg` and, where
`SITE_IMAGE_TRANSFORMS=true`, builds its `srcset` and social card through
`/cdn-cgi/image/...` (Cloudflare Images transformations, enabled per zone in the dashboard).
Locally, and on any deployment without transformations, the original file is served as is.

Deleting a piece or removing a photo does not delete the file; the bucket keeps orphans, which
cost nothing at this size.

## The PDF

`src/app/core/catalog/pdf/catalog-pdf.ts` renders the whole price list as one A4 HTML document
from the public projection and the site's own locale, dressed like the site: a cover laid out like
the brand's business card (the Azul Cristal water, sunflowers down the edge, the white logo, the
cover of the first published piece in a round lid with the brand's seal), pieces grouped by how
many people they serve (largest first, the unit piece last as a wide block) with a round price
label on each cover photo
and the logo and WhatsApp number heading every page, then a page of order conditions from
`ORDER_CONDITION_GROUPS` that closes on the order box. The fonts travel inside the document (the
admin Worker bundles `src/styles/fonts/` and inlines them), so a PDF never depends on what the live
site serves; photos come from the site, glyphs from `public/icons/orders/`, and the brand drawings from `public/brand/`, embedded
once as symbols. The logo in the page heads is drawn in place instead: Chrome does not repaint a
`<use>` inside a table head it repeats on the following pages. The browser does the
paginating: a card or a row of cards never splits across pages and a band heading never ends one,
so any number of pieces fits; names and descriptions are clamped to a few lines on the card
(`PDF_NAME_LINES`, `PDF_DESCRIPTION_LINES`), the site shows them whole.

In production `POST /api/pdf` sends that HTML to Cloudflare Browser Rendering (`/browser-rendering/pdf`,
REST, authenticated with the `BROWSER_RENDERING_TOKEN` secret) and stores the bytes in R2 with the
catalogue version; `/api/status` compares that with the catalogue's. Without the token the route
answers 503 and the panel says the PDF could not be generated.

Locally, `bun run catalog-pdf` prints the same HTML from the snapshot with headless Edge to
`dist/ArGeles-catalogo.pdf` and says how many pages came out; open it to check the layout.

## The Instagram publication

Each row of the list opens `/publicacion/<id>`: the two slides the brand posts for a piece, drawn
live on two `<canvas>` elements at Instagram's 1080 × 1350 (4:5). The first is the logo, the piece
in its round lid on the water with its name, sunflowers at the edges and the two ways to order
(the WhatsApp line and the site's host); the second, in the same colours, is the name in script,
the divider, the description and the piece rising from the foot. The words are the piece's own
`text.es`, never typed again, and **no price is ever drawn**: prices change in the panel and a
posted image does not.

The owner chooses three things, none of them saved:

- **Photo**: any photo of the piece's gallery; the cover is the default.
- **Framing**: a zoom slider, and the photo dragged (or moved with the arrow keys) inside the
  circle. `photoPlacement()` keeps the circle covered whatever is chosen.
- **Backdrop**: the five colours of the brand book's palette at one click, or any colour from the
  browser's own picker. Whatever would be lost on the chosen colour steps aside (`blendsInto()`):
  the coral pill turns white on a coral slide, the sunflowers' petals on a mango one.
  `inkToneOn()` gives a deep backdrop white ink and a light one navy, logo included.

**A download uploads and stores nothing.** `PostArtService` reads the brand drawings
(`brand/*.svg`, `icons/whatsapp.svg`) as `Path2D` outlines and the photo as a bitmap, all from the
panel's own origin so the canvas stays exportable; `post-painter.ts` paints; `downloadCanvas()`
turns the canvas into a PNG blob and hands it to the browser as a download (`<slug>-1.png`,
`<slug>-2.png`). No Worker route, no KV, no R2.

The layout is numbers in `post.constants.ts`; changing how a slide looks is changing them and the
painter, not a template. The pure parts (ink tone, wrapping, fitting, framing, the phone as it is
dialled, the file name) are in `post-text.ts` and tested in `tests/admin/core/post/`.

### Publishing to Instagram

Under the slides, **Publicar en Instagram** posts both as one carousel to the account the panel is
connected to, with a caption the owner can edit first. The caption starts from a suggestion built
from the piece (`post.publish.suggestion` in the panel's locale: name, description, how to order,
five hashtags); the counters show Instagram's limits, 2200 characters and five hashtags. A
confirmation comes first, because a post cannot be taken back from the panel. When it goes
through, a toast says so (`ToastService`, the app's one passing notice) and the block keeps a
quiet line saying it was published; nothing about the post is kept, not even its link.

The token never reaches the browser. The panel talks to its Worker, and the Worker to Instagram:

1. The page encodes each canvas as a JPEG (Instagram takes nothing else) and uploads it to
   `PUT /api/instagram/slides/<uuid>.jpg`, which parks it in R2 under `posts/`.
2. `POST /api/instagram/publish` names the parked slides and carries the caption. The Worker
   (`workers/admin/instagram-api.ts`) creates one image container per slide, pointing Instagram at
   `https://admin.argelees.com/posts/<uuid>.jpg`, then the carousel container, waits until Instagram
   reports it `FINISHED` and publishes it.
3. Whatever happened, the slides are removed from R2 before the Worker answers. `/posts/` is the
   one address of the panel that needs no login, because Instagram has to read it; a slide lives
   there for seconds under a random name and is served with `no-store`.

A refusal comes back with Instagram's own explanation. A failure after the Worker asked Instagram
to publish is reported apart (`instagram-uncertain`): the post may be live, so the panel says to
look at the profile before trying again.

`INSTAGRAM_ACCESS_TOKEN` is a Worker secret, a long-lived token of the Instagram API with Instagram
Login (permissions `instagram_business_basic` and `instagram_business_content_publish`), generated
in the Meta app dashboard for the account. It lasts sixty days, and a Worker cannot rewrite its
own secrets, so a cron trigger trades it for a new one every Monday and keeps the result in KV
(`instagram:token`) encrypted with a key derived from the secret (`instagram-token.ts`): what
rests in KV is useless without the secret, and a secret the owner replaces takes over at once. The
same cron removes any slide older than an hour, the safety net for a publication that was cut
short. Without the secret the page says Instagram is not connected and the button stays off.

Publishing only works on the deployed panel: Instagram must be able to fetch the slides, and it
cannot reach `localhost`. The API allows about a hundred posts a day, far above any use here.

## Setting it up once

Cloudflare resources, created with `wrangler` (ids in the two `wrangler.jsonc` files):

```bash
bun run wrangler kv namespace create CATALOG
bun run wrangler r2 bucket create argelees-media
```

Then, in this order:

1. `bun run catalog:seed --remote` — uploads the seed in `assets-src/catalog/seed/` (document,
   photos, the last hand-made PDF) to KV and R2. Needs a `wrangler login` whose token can write R2.
   `--force` overwrites an existing document.
2. `bun run admin:credentials --remote` — sets `ADMIN_USER`, `ADMIN_PASSWORD_HASH` and a random
   `SESSION_SECRET`.
3. In the dashboard: **Images → Transformations**, enable for `argelees.com`; and a token with
   **Browser Rendering: Edit**, stored with
   `bun run wrangler secret put BROWSER_RENDERING_TOKEN --config admin/wrangler.jsonc`.
4. `SITE_IMAGE_TRANSFORMS=true bun run deploy` (or push to `main`, where CI sets it) deploys both
   Workers. The admin custom domain `admin.argelees.com` is created by the deploy. The panel's
   secrets are then uploaded once, and never through the chat or a commit:

   ```bash
   printf '%s' "$user" | bun run wrangler secret put ADMIN_USER --config admin/wrangler.jsonc
   printf '%s' "$hash" | bun run wrangler secret put ADMIN_PASSWORD_HASH --config admin/wrangler.jsonc
   ```

   (`bun run admin:credentials --remote` does both from a hidden prompt.)

5. To publish to Instagram from the panel, the owner generates the account's token in the Meta app
   dashboard and stores it himself, typed into wrangler's hidden prompt:
   `bun run wrangler secret put INSTAGRAM_ACCESS_TOKEN --config admin/wrangler.jsonc`.

The CI token needs to read the `CATALOG` namespace for `catalog:pull`.

## Working locally

`bun start` runs the whole stack from `scripts/dev.ts`: the site Worker (8787) and the admin Worker
(8790) with a shared `--persist-to .wrangler/state`, and the two Angular dev servers, site (4200)
and panel (4300), each proxying `/api`, `/photos` and the PDF to its Worker.

- `bun run catalog:seed --local` fills the local KV and R2 from the seed.
- `CATALOG_SOURCE=local` in `.env` makes `catalog:pull` read that local state instead of the
  account's KV.
- `admin/.dev.vars` holds the panel's secrets for `wrangler dev`; `bun run admin:credentials
--local` writes it.
- `bun run catalog-pdf` needs the stack up for the photos.

## Limits that matter

| Free-plan limit                        | Use here                                                |
| -------------------------------------- | ------------------------------------------------------- |
| Workers: 100k requests/day, 10 ms CPU  | assets are served before the script; routes only do I/O |
| KV: 1k writes/day                      | two per save                                            |
| Image transformations: 5k unique/month | a few hundred for the whole menu                        |
| Browser Rendering: 10 min/day          | a PDF takes seconds                                     |
| Workers: 50 subrequests per request    | a publication makes under twenty                        |
| Cron triggers: 5 per account           | one, weekly                                             |
| KV propagation: up to 60 s             | the panel says "visible in less than a minute"          |

## Where things live

| What                                   | Where                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Document shape, validation, projection | `src/app/core/catalog/{catalog.document,catalog.validation,projection}.ts` |
| A piece's photo list                   | `src/app/core/catalog/gallery.ts`, cap in `catalog.constants.ts`           |
| Price calculator                       | `src/app/core/catalog/costing.ts`, steps in `catalog.constants.ts`         |
| PDF template and styles                | `src/app/core/catalog/pdf/`                                                |
| Instagram publication                  | `projects/admin/src/app/core/post/`, editor in `features/post/`            |
| Publishing it to Instagram             | `workers/admin/instagram-*.ts`, shared shapes in `workers/shared/`         |
| Site Worker                            | `workers/site/`, config `wrangler.jsonc`                                   |
| Admin Worker                           | `workers/admin/`, config `admin/wrangler.jsonc`                            |
| Shared Worker code (stores, headers)   | `workers/shared/`                                                          |
| The panel                              | `projects/admin/` (its own locale in `projects/admin/public/i18n/es.json`) |
| Seed for a fresh account               | `assets-src/catalog/seed/`                                                 |
| Scripts                                | `scripts/{catalog-seed,catalog-pull,admin-credentials,catalog-pdf,dev}.ts` |
| Tests                                  | `tests/core/catalog/`, `tests/workers/`, `tests/admin/`                    |
