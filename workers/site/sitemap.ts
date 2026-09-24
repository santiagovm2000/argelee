import type { PublicCatalog } from '../../src/app/core/catalog/projection';
import { localizedUrl, productSegments, ROUTE_PATHS } from '../../src/app/core/config/routes';
import { DEFAULT_LANGUAGE } from '../../src/app/core/i18n/i18n.constants';

const STATIC_PAGES: readonly (readonly string[])[] = [[], [ROUTE_PATHS.links]];
const CHANGE_FREQUENCY = 'weekly';
const DATE_LENGTH = 'YYYY-MM-DD'.length;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Every page, the fixed ones and one per published piece, dated today. */
export function renderSitemap(origin: string, catalog: PublicCatalog, today: Date): string {
  const lastModified = today.toISOString().slice(0, DATE_LENGTH);
  const pages = [
    ...STATIC_PAGES,
    ...catalog.products.map((product) => productSegments(product.id)),
  ];
  const urls = pages.map(
    (segments) => `  <url>
    <loc>${escapeXml(`${origin}${localizedUrl(DEFAULT_LANGUAGE, segments)}`)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${CHANGE_FREQUENCY}</changefreq>
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}
