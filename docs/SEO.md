# SEO

The whole reason this project prerenders is SEO: a crawler receives complete, localized HTML with
no JavaScript execution required. Everything below exists to keep that true as the site grows.

Verified on the production build (Lighthouse, mobile): **SEO 100, Accessibility 100,
Best Practices 100, Agentic Browsing 100, 0 failed audits. LCP 45 ms, CLS 0.00.**

## Localized URLs

Spanish is the default and lives at the root; every other language is path-prefixed.

```
/            es    canonical + x-default
/en          en
/pricing     es    (when that page exists)
/en/pricing  en
```

This is the part that cannot be skipped. With a single URL and runtime language switching, a
crawler only ever sees the default language and the translation is never indexed. Separate URLs
plus reciprocal `hreflang` is what makes both versions rank.

`app.routes.ts` builds one route tree per language from `SUPPORTED_LANGUAGES`; `applyRouteLanguage`
(a `CanActivateFn`) sets the language _before_ the page renders, so prerendered HTML carries the
right `<html lang>` and the right copy. `localizedUrl()` and `pathSegments()` in
`core/config/routes.ts` are the only places URL shape is decided — they are unit-tested because
hreflang correctness depends on them being exact inverses.

Never add a route that exists in only one language. It breaks the reciprocal hreflang set, and
Google silently ignores one-way annotations.

## What every page must emit

`SeoService.apply()` writes all of it from typed translation keys:

| Tag                                                          | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| `<title>`, `<meta name="description">`                       | the search result itself                |
| `<link rel="canonical">`                                     | which URL is authoritative              |
| `<link rel="alternate" hreflang>` per language + `x-default` | which translation serves which audience |
| `og:*` + `twitter:*`                                         | how the link renders when shared        |
| `og:locale` + `og:locale:alternate`                          | language of the shared card             |
| JSON-LD `Organization` / `WebSite` / `WebPage`               | rich-result eligibility                 |

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
alternates from it. Get this wrong and the canonical points at the wrong page.

## Crawler files

| File                | Source                                      | Notes                                                                          |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `public/robots.txt` | hand-written                                | must name `${SITE.origin}/sitemap.xml`; `bun run sitemap` fails if it does not |
| `public/llms.txt`   | hand-written                                | how AI crawlers should read the site                                           |
| `sitemap.xml`       | generated into `dist/` by `bun run sitemap` | runs automatically as part of `bun run build`                                  |

The sitemap is built from the routes Angular actually prerendered, not from a hand-kept list, so a
new page cannot go missing. Each page is emitted once per language with `xhtml:link` alternates.

## Still open before launch

- **Set `SITE_ORIGIN` for production.** Every canonical, hreflang and sitemap URL derives from it,
  including any subpath. It defaults to `http://localhost:4200`, so a build without it is not
  publishable.
- **No `og:image`.** `SeoService` supports one (`image`, sized by `OG_IMAGE_SIZE`, 1200x630), but no
  card exists yet. Shared links currently render without a preview image. Add
  `public/images/og/<page>.png` when the visual identity is decided.
- **Host-level settings Lighthouse cannot see locally:** enable Brotli/gzip (~50 kB saving measured)
  and long `Cache-Control` on hashed assets. Both are one setting on Vercel, Netlify or Cloudflare.
- **Analytics/Search Console** verification tag, once the domain is live.
