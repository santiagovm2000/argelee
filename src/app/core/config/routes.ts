import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n/i18n.constants';

// Path segments are language-neutral on purpose: `/catalogo/x` and `/en/catalogo/x`
// share every segment after the prefix, which is what keeps hreflang pairs, the
// language switcher and the sitemap exact inverses of each other.
export const ROUTE_PATHS = {
  home: '',
  catalog: 'catalogo',
  notFound: '**',
} as const;

export const ROUTE_PARAMS = {
  productSlug: 'slug',
} as const;

// In-page anchors on the landing page.
export const SECTION_IDS = {
  catalog: 'carta',
  orders: 'encargos',
} as const;

/** Builds the URL a page lives at in a given language: '/' for the default, '/en/...' otherwise. */
export function localizedUrl(
  language: SupportedLanguage,
  segments: readonly string[] = [],
): string {
  const prefix = language === DEFAULT_LANGUAGE ? [] : [language];
  return `/${[...prefix, ...segments].join('/')}`;
}

/** Drops a leading language segment from a URL and returns what remains. */
export function pathSegments(url: string): string[] {
  const pathname = url.split(/[?#]/)[0] ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  return first !== undefined && isSupportedLanguage(first) ? segments.slice(1) : segments;
}

/** The language-neutral segments of a product page, ready for localizedUrl(). */
export function productSegments(slug: string): string[] {
  return [ROUTE_PATHS.catalog, slug];
}

/** The router pattern a product page is registered under, inside the catalog feature. */
export function productRoutePattern(): string {
  return `:${ROUTE_PARAMS.productSlug}`;
}
