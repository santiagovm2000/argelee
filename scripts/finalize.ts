/**
 * Emits the files that depend on both the built output and the target deployment.
 * Run with `bun run finalize`; `bun run build` calls it automatically.
 *
 *  - sitemap.xml, built from the routes Angular actually prerendered so a new page
 *    cannot go missing, one entry per language with reciprocal hreflang.
 *  - robots.txt, which points at that sitemap on the real origin — or forbids
 *    crawling outright when the deployment is a preview.
 *  - llms.txt, the same orientation for AI crawlers.
 *  - 404.html, because a static host serves that file for an unknown path; without
 *    it a deep link returns the host's own 404 and the app never boots.
 */
import { copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { SITE } from '../src/app/core/config/app.constants';
import { localizedUrl, pathSegments } from '../src/app/core/config/routes';
import { DEPLOYMENT } from '../src/app/core/config/build-config.generated';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../src/app/core/i18n/i18n.constants';

const ROOT = resolve(import.meta.dir, '..');
const BROWSER_DIR = join(ROOT, 'dist', 'argelee', 'browser');

function prerenderedRoutes(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return prerenderedRoutes(full);
    if (entry !== 'index.html') return [];
    return [`/${relative(BROWSER_DIR, full).split(sep).slice(0, -1).join('/')}`];
  });
}

if (!existsSync(BROWSER_DIR)) {
  console.error('finalize: no build output found. Run `ng build` first.');
  process.exit(1);
}

const absolute = (path: string): string => `${DEPLOYMENT.origin}${path}`;
const pages = [
  ...new Set(prerenderedRoutes(BROWSER_DIR).map((r) => pathSegments(r).join('/'))),
].sort();
const lastModified = new Date().toISOString().slice(0, 10);

const urls = SUPPORTED_LANGUAGES.flatMap((language) =>
  pages.map((page) => {
    const segments = page === '' ? [] : page.split('/');
    const alternates = [
      ...SUPPORTED_LANGUAGES.map((other) => [other, absolute(localizedUrl(other, segments))]),
      ['x-default', absolute(localizedUrl(DEFAULT_LANGUAGE, segments))],
    ];
    const links = alternates
      .map(
        ([hreflang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`,
      )
      .join('\n');
    return `  <url>
    <loc>${absolute(localizedUrl(language, segments))}</loc>
${links}
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
  }),
);

writeFileSync(
  join(BROWSER_DIR, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
);

writeFileSync(
  join(BROWSER_DIR, 'robots.txt'),
  DEPLOYMENT.indexable
    ? `# ${SITE.name} — ${DEPLOYMENT.origin}
# Every route is prerendered static HTML, so crawlers need no JavaScript.

User-agent: *
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`
    : `# ${SITE.name} — preview deployment, not for indexing.
# The pages also carry <meta name="robots" content="noindex, nofollow">.

User-agent: *
Disallow: /
`,
);

writeFileSync(
  join(BROWSER_DIR, 'llms.txt'),
  `# ${SITE.name}

> Marketing landing page. Static, prerendered, available in Spanish and English.${DEPLOYMENT.indexable ? '' : ' This is a preview deployment and should not be indexed or cited.'}

The site is a single landing page served as static HTML. Spanish is the default language
and lives at the root; English lives under /en. Both are fully prerendered, so the complete
content is present in the initial HTML response without executing JavaScript.

## Pages

${SUPPORTED_LANGUAGES.map((language) => `- [${SITE.name} (${language})](${absolute(localizedUrl(language))})`).join('\n')}

## Notes

- Canonical URLs and reciprocal hreflang annotations are published on every page.
- Structured data (Organization, WebSite, WebPage) is embedded as JSON-LD.
- There is no API and no user-generated content.
`,
);

const shell = join(BROWSER_DIR, 'index.csr.html');
if (!existsSync(shell)) {
  console.error('finalize: index.csr.html is missing — cannot write 404.html.');
  process.exit(1);
}
copyFileSync(shell, join(BROWSER_DIR, '404.html'));

console.log(
  `finalize: sitemap (${urls.length} URLs), robots.txt (${DEPLOYMENT.indexable ? 'indexable' : 'disallow all'}), llms.txt, 404.html.`,
);
