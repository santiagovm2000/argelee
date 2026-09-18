# SEO

The whole reason this project prerenders is SEO: a crawler receives complete, localized HTML with
no JavaScript execution required. Everything below exists to keep that true as the site grows.

## Localized URLs

Spanish is the default and lives at the root; every other language is path-prefixed.

```
/                            es    canonical + x-default
/en                          en
/catalog/corona-tres-leches  es    one page per piece, generated from PRODUCTS
/en/catalog/corona-tres-leches en
```

Segments after the language prefix are **the same in every language, on purpose**: the structural
words are English (`catalog`, `links`, the `#catalog` and `#orders` anchors) and the piece's slug is
the piece's own name, Spanish because that is what the brand calls it (`corona-tres-leches`). The
slug is the `slug` field in `catalog.data.ts`; the `id` next to it is English, like every identifier
in the code, and doubles as the translation key. Everything that pairs the two languages —
`SeoService` alternates, the language switcher, the sitemap — derives the twin URL by swapping the
prefix and nothing else. A localized slug would need a lookup in all three places and would break
silently in one of them. The owner wants no Spanish structural segment in the address bar, and no
redirects from old paths.

This is the part that cannot be skipped. With a single URL and runtime language switching, a
crawler only ever sees the default language and the translation is never indexed. Separate URLs
plus reciprocal `hreflang` is what makes both versions rank.

`app.routes.ts` builds one route tree per language from `SUPPORTED_LANGUAGES`; `applyRouteLanguage`
(a `CanActivateFn`) sets the language _before_ the page renders, so prerendered HTML carries the
right `<html lang>` and the right copy. `localizedUrl()`, `pathSegments()` and `productSegments()`
in `core/config/routes.ts` are the only places URL shape is decided — they are unit-tested because
hreflang correctness depends on them being exact inverses.

Never add a route that exists in only one language. It breaks the reciprocal hreflang set, and
Google silently ignores one-way annotations.

## What every page must emit

`SeoService.apply()` writes all of it from typed translation keys. It waits for the active
translation to be loaded first: on the client the locale file arrives over HTTP after the first
render, and writing the tags earlier would put a raw key into `<title>`.

| Tag                                                          | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| `<title>`, `<meta name="description">`                       | the search result itself                |
| `<link rel="canonical">`                                     | which URL is authoritative              |
| `<link rel="alternate" hreflang>` per language + `x-default` | which translation serves which audience |
| `og:*` + `twitter:*`, including `og:image`                   | how the link renders when shared        |
| `og:locale` + `og:locale:alternate`                          | language of the shared card             |
| JSON-LD `Organization` / `WebSite` / `WebPage`               | rich-result eligibility                 |
| JSON-LD `Product` with an `AggregateOffer` (piece pages)     | price-aware rich results                |

The social card is a JPEG, not AVIF: WhatsApp and Facebook do not render AVIF previews. The image
pipeline emits `<name>-social.jpg` at `OG_IMAGE_SIZE` for every source image, so any manifest entry
can be handed to `apply({ image })`.
The home page hands it the brand card, `IMAGES.brandWordmark`, drawn by `bun run social-card`;
each piece hands its own photo, so a shared piece previews as that piece.

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

`segments` is the path **without** the language prefix — the service derives the canonical and all
alternates from it. Get this wrong and the canonical points at the wrong page. Titles can take
`paramKeys` (interpolation values that are themselves translation keys); the piece page uses that
to build "ArGeles — `<name>`" from the piece's own name key. The brand always comes first in a title.

## Prerendering data-driven pages

A parameterised route cannot be prerendered without its values. `app.routes.server.ts` registers
`catalog/:slug` (and `en/catalog/:slug`) with `getPrerenderParams` reading `PRODUCTS`, so a new
piece gets its two pages without touching the routes. The bare `catalog` segment is
`RenderMode.Client`: it is not a page, and the sitemap is built from the files that exist.

## Crawler files

| File          | Source                                       | Notes                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `sitemap.xml` | generated into `dist/` by `bun run finalize` | one entry per page per language with `xhtml:link` alternates           |
| `robots.txt`  | generated into `dist/` by `bun run finalize` | points at the sitemap, or disallows everything on a preview deployment |
| `llms.txt`    | generated into `dist/` by `bun run finalize` | orientation for AI crawlers                                            |
| `404.html`    | copy of the CSR shell, by `bun run finalize` | so a deep link on a static host still boots the app                    |

`bun run finalize` runs inside `bun run build`. The sitemap is built from the routes Angular
actually prerendered, not from a hand-kept list, so a new page cannot go missing.

## Production

- **`SITE_ORIGIN` is `https://argelees.com`**, set in `.env` locally and in
  `.github/workflows/deploy.yml`. Every canonical, hreflang, `og:image` and sitemap URL derives from
  it. It defaults to `http://localhost:4200`, so a build without it is not publishable.
- **URLs carry no trailing slash.** `wrangler.jsonc` sets `html_handling: drop-trailing-slash`, so
  `/en/` redirects to `/en` and the served URL always equals the canonical one. Unknown paths get
  `404.html` with a real 404 status.
- **One hostname.** `www.argelees.com` and plain `http://` redirect (301) to
  `https://argelees.com` through Cloudflare zone rules, and the Worker has no `workers.dev` URL, so
  there is a single indexable copy of the site.
- **Headers** come from `public/_headers`: immutable caching for hashed bundles and fonts, a day for
  images and video, plus HSTS, CSP and the other security headers. Cloudflare compresses (Brotli)
  on its own.
- **Prices** in `catalog.data.ts` are the owner's list (`public/ArGeles-catalogo.pdf`), in US
  dollars. `SITE.whatsappNumber` is the real business line, in the digits-only form wa.me links take.
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
  empty id switches the whole thing off. The CSP in `public/_headers` allows the Google origins.
