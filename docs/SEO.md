# SEO

The whole reason this project prerenders is SEO: a crawler receives complete, localized HTML with
no JavaScript execution required. Everything below exists to keep that true as the site grows.

## Localized URLs

Spanish is the default and lives at the root; every other language is path-prefixed.

```
/                            es    canonical + x-default
/en                          en
/catalogo/jardin-de-frutas   es    one page per piece, generated from PRODUCTS
/en/catalogo/jardin-de-frutas en
```

Segments after the language prefix are **language-neutral on purpose** (`catalogo`, and the
piece's slug). Everything that pairs the two languages — `SeoService` alternates, the language
switcher, the sitemap — derives the twin URL by swapping the prefix and nothing else. A localized
slug would need a lookup in all three places and would break silently in one of them.

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
to build "ArGelees — `<name>`" from the piece's own name key. The brand always comes first in a title.

## Prerendering data-driven pages

A parameterised route cannot be prerendered without its values. `app.routes.server.ts` registers
`catalogo/:slug` (and `en/catalogo/:slug`) with `getPrerenderParams` reading `PRODUCTS`, so a new
piece gets its two pages without touching the routes. The bare `catalogo` segment is
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

## Still open before launch

- **Set `SITE_ORIGIN` for production.** Every canonical, hreflang, `og:image` and sitemap URL
  derives from it, including any subpath. It defaults to `http://localhost:4200`, so a build without
  it is not publishable.
- **The WhatsApp number** in `SITE.whatsappNumber` is a placeholder, and the **prices and
  currency** in `catalog.data.ts` / `catalog.constants.ts` are the draft's provisional figures.
- **Host-level settings Lighthouse cannot see locally:** enable Brotli/gzip and long `Cache-Control`
  on hashed assets. Both are one setting on Vercel, Netlify or Cloudflare.
- **Search Console** verification tag, once the domain is live.
