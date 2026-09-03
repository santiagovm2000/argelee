import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n/i18n.constants';

export const ROUTE_PATHS = {
  home: '',
  notFound: '**',
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
