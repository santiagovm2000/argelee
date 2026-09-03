/**
 * Sitemap generator. Run with `bun run sitemap`, after `ng build`.
 *
 * Reads the routes Angular actually prerendered rather than a hand-kept list, so a
 * new page cannot be missing from the sitemap. Each page is emitted once per
 * language with reciprocal hreflang annotations, which is what lets Google index
 * the translations instead of treating them as duplicates.
 *
 * Also asserts robots.txt points at the sitemap on the configured origin.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { SITE } from '../src/app/core/config/app.constants';
import { localizedUrl, pathSegments } from '../src/app/core/config/routes';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../src/app/core/i18n/i18n.constants';

const ROOT = resolve(import.meta.dir, '..');
const BROWSER_DIR = join(ROOT, 'dist', 'argelee', 'browser');
const SITEMAP_FILE = join(BROWSER_DIR, 'sitemap.xml');
const ROBOTS_FILE = join(ROOT, 'public', 'robots.txt');

function prerenderedRoutes(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return prerenderedRoutes(full);
    if (entry !== 'index.html') return [];
    const route = relative(BROWSER_DIR, full).split(sep).slice(0, -1).join('/');
    return [`/${route}`];
  });
}

const expectedSitemapUrl = `${SITE.origin}/sitemap.xml`;
if (!readFileSync(ROBOTS_FILE, 'utf8').includes(expectedSitemapUrl)) {
  console.error(`sitemap: public/robots.txt must contain "Sitemap: ${expectedSitemapUrl}"`);
  process.exit(1);
}

const routes = prerenderedRoutes(BROWSER_DIR);
const pages = [...new Set(routes.map((route) => pathSegments(route).join('/')))].sort();
const lastModified = new Date().toISOString().slice(0, 10);

const entries = SUPPORTED_LANGUAGES.flatMap((language) =>
  pages.map((page) => {
    const segments = page === '' ? [] : page.split('/');
    const alternates = [
      ...SUPPORTED_LANGUAGES.map((other) => ({
        hreflang: other,
        href: `${SITE.origin}${localizedUrl(other, segments)}`,
      })),
      {
        hreflang: 'x-default',
        href: `${SITE.origin}${localizedUrl(DEFAULT_LANGUAGE, segments)}`,
      },
    ];
    const links = alternates
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
      .join('\n');
    return `  <url>
    <loc>${SITE.origin}${localizedUrl(language, segments)}</loc>
${links}
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
  }),
);

writeFileSync(
  SITEMAP_FILE,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`,
);

console.log(
  `sitemap: ${entries.length} URL(s) from ${pages.length} page(s) x ${SUPPORTED_LANGUAGES.length} language(s).`,
);
