import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n/i18n.constants';

// Path segments are English on purpose, whatever language the page is in: the site
// and the Worker build the same URLs from these, so a Spanish segment would have to
// be translated in both.
export const ROUTE_PATHS = {
  home: '',
  catalog: 'catalog',
  links: 'links',
  notFound: '**',
} as const;

export const ROUTE_PARAMS = {
  productId: 'id',
} as const;

// In-page anchors on the landing page.
export const SECTION_IDS = {
  catalog: 'catalog',
  orders: 'orders',
} as const;

/** Builds the URL a page lives at in a given language: '/' for the default, '/<lang>/...' otherwise. */
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

/** The segments of a product page, ready for localizedUrl(). */
export function productSegments(id: string): string[] {
  return [ROUTE_PATHS.catalog, id];
}

/** The router pattern a product page is registered under, inside the catalog feature. */
export function productRoutePattern(): string {
  return `:${ROUTE_PARAMS.productId}`;
}
