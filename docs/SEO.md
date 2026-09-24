# SEO

The whole reason this project prerenders is SEO: a crawler receives complete HTML with no
JavaScript execution required. Everything below exists to keep that true as the menu changes
without a deploy.

## URLs

The site is Spanish only and lives at the root. Path segments are English on purpose.

```
/                     home            canonical
/catalog/<id>         one page per piece; <id> is the piece's UUID from the panel
/links                the link hub
```

The structural words (`catalog`, `links`, the `#catalog` and `#orders` anchors) are English because
that is what the code, the Worker and the sitemap all build URLs from; a Spanish segment would have
to be translated in every one of them. The owner wants no Spanish structural segment in the address
bar, and no redirects from old paths: a path that changes simply changes.

`localizedUrl()`, `pathSegments()` and `productSegments()` in `core/config/routes.ts` are the only
places URL shape is decided — they are unit-tested because the canonical depends on them being
exact. The language plumbing they carry (`SUPPORTED_LANGUAGES` has one entry) is what a second
language would use; do not remove it, and do not add a route for one language only.

## What every page must emit

`SeoService.apply()` writes all of it from typed translation keys, or from strings already
resolved (`title`, `description`) when the words come from the catalogue rather than a locale
file. It waits for the active translation to be loaded first: on the client the locale file arrives
over HTTP after the first render, and writing the tags earlier would put a raw key into `<title>`.

| Tag                                                      | Purpose                          |
| -------------------------------------------------------- | -------------------------------- |
| `<title>`, `<meta name="description">`                   | the search result itself         |
| `<link rel="canonical">`                                 | which URL is authoritative       |
| `og:*` + `twitter:*`, including `og:image`               | how the link renders when shared |
| JSON-LD `Organization` / `WebSite` / `WebPage`           | rich-result eligibility          |
| JSON-LD `Product` with an `AggregateOffer` (piece pages) | price-aware rich results         |

The social card is a JPEG, not AVIF: WhatsApp and Facebook do not render AVIF previews. Brand
images get a `<name>-social.jpg` from `bun run images`; a piece's card is its photo through
Cloudflare's image transformations (`photoSocialUrl()`), 1200×630, JPEG.

Adding a page:

```ts
export class PricingPage implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      titleKey: T.meta.pricing.title,
      descriptionKey: T.meta.pricing.description,
      segments: ['pricing'],
    });
  }
}
```

`segments` is the path from the root — the service derives the canonical from it. Get this wrong
and the canonical points at the wrong page. Titles can take `params` (interpolation values); the
piece page uses that to build "ArGeles — `<name>`" from the piece's own name. The brand always
comes first in a title.

## Pages that exist between deploys

The build prerenders one page per piece in the catalogue snapshot (`getPrerenderParams` in
`app.routes.server.ts`). A piece the owner publishes after that deploy has no file yet, so the site
Worker steps in: for `/catalog/<id>` with no asset, it looks the id up in KV and, if the piece is
published, serves the CSR shell with **200** and the piece's title, description, canonical and
`og:*` tags injected by `HTMLRewriter` (`workers/site/product-shell.ts`); if not, `404.html` with a
real 404. The app then hydrates and renders the piece from the live catalogue. The next deploy
prerenders it properly. A piece that is hidden or deleted answers 404 as soon as KV propagates
(under a minute), whatever the last build contained.

`wrangler.jsonc` sets `not_found_handling: "none"` for this reason: with `404-page`, navigations to
a missing asset would never reach the Worker.

## Crawler files

| File          | Source                                       | Notes                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `sitemap.xml` | the site Worker, `workers/site/sitemap.ts`   | fixed pages plus every published piece in KV, always current           |
| `robots.txt`  | generated into `dist/` by `bun run finalize` | points at the sitemap, or disallows everything on a preview deployment |
| `llms.txt`    | generated into `dist/` by `bun run finalize` | orientation for AI crawlers                                            |
| `404.html`    | copy of the CSR shell, by `bun run finalize` | served with a 404 status by the Worker for every unknown path          |

`bun run finalize` runs inside `bun run build`. The sitemap is not a build artefact any more: it is
answered live from the catalogue, so a piece published from the panel is listed within a minute.

## Production

- **`SITE_ORIGIN` is `https://argelees.com`**, set in `.env` locally and in
  `.github/workflows/deploy.yml`. Every canonical, `og:image` and sitemap URL derives from it. It
  defaults to `http://localhost:4200`, so a build without it is not publishable.
- **URLs carry no trailing slash.** `wrangler.jsonc` sets `html_handling: drop-trailing-slash`, so
  the served URL always equals the canonical one. Unknown paths get `404.html` with a real 404.
- **One hostname.** `www.argelees.com` and plain `http://` redirect (301) to
  `https://argelees.com` through Cloudflare zone rules, and the Worker has no `workers.dev` URL, so
  there is a single indexable copy of the site. The panel lives on `admin.argelees.com`, behind a
  login and with `noindex`; it is not part of the site.
- **Headers**: the Workers set the security headers themselves (`workers/shared/security-headers.ts`)
  and `bun run finalize` writes the same ones into `public/_headers` for the static assets, plus
  immutable caching for hashed bundles and fonts. Cloudflare compresses (Brotli) on its own.
- **Prices** are the owner's, in US dollars, edited in the panel; the price-list PDF at
  `/ArGeles-catalogo.pdf` is rendered from the same data (see `docs/ADMIN.md`).
  `SITE.whatsappNumber` is the real business line, in the digits-only form wa.me links take.
- **Search Console** is verified through a DNS TXT record on the zone, not a meta tag, so a rebuild
  can never drop it. The sitemap is submitted there; Bing imports from Search Console.
- **Cloudflare Web Analytics** runs from the beacon `<script>` in `src/index.html`. Cloudflare cannot
  inject it at the edge for a Worker-served site, so the snippet lives in the page. It sets no cookies.
- **Google Analytics 4** (property "argelees.com" in the "ArGeles" account) is loaded by
  `core/analytics/analytics.service.ts` in the browser only, once the page is idle; prerendered HTML
  never contains it. Every WhatsApp link carries the `argLead` directive, which sends a
  `generate_lead` event named after the button (`hero`, `orders`, `widget`, `links`, `product`) and,
  on a piece page, the piece and its price. Page views come from GA4's enhanced measurement, which
  follows the router's history changes. The measurement id lives in `analytics.constants.ts`; an
  empty id switches the whole thing off. The CSP allows the Google origins.
