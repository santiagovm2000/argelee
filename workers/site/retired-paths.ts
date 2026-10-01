import { PRODUCT_ID_PATTERN } from '../../src/app/core/catalog/catalog.constants';
import { ROUTE_PATHS } from '../../src/app/core/config/routes';
import { isSupportedLanguage } from '../../src/app/core/i18n/i18n.constants';

// Addresses earlier versions of the site had and this one never will: the
// Spanish segments, the English edition, pieces by their old names, the PDF's
// old name. They answer 410 Gone instead of 404, so search engines drop them
// for good rather than retrying. Nothing redirects anywhere (docs/SEO.md).
const RETIRED_SEGMENTS: readonly string[] = ['catalogo', 'enlaces'];
const RETIRED_LANGUAGES: readonly string[] = ['en'];
const RETIRED_FILES: readonly string[] = ['/ArGeles-catalog.pdf'];
const PIECE_SEGMENT_COUNT = 2;

/**
 * True for a path that belonged to an earlier version of the site. A piece is
 * addressed by its UUID, so any other name under the catalogue is an old slug;
 * a UUID nobody publishes answers 404, because the piece may come back.
 */
export function isRetiredPath(pathname: string): boolean {
  if (RETIRED_FILES.includes(pathname)) return true;
  const segments = pathname.split('/').filter(Boolean);
  const [first, second] = segments;
  if (first === undefined) return false;
  if (RETIRED_SEGMENTS.includes(first)) return true;
  if (RETIRED_LANGUAGES.includes(first) && !isSupportedLanguage(first)) return true;
  return (
    first === ROUTE_PATHS.catalog &&
    segments.length === PIECE_SEGMENT_COUNT &&
    second !== undefined &&
    !PRODUCT_ID_PATTERN.test(second)
  );
}
