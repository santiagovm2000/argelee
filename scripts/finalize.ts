/**
 * Emits the files that depend on both the built output and the target deployment.
 * Run with `bun run finalize`; `bun run build` calls it automatically.
 *
 *  - _headers, the static-asset response headers, from the same source the
 *    Workers set on their own responses.
 *  - robots.txt, which points at the sitemap the Worker serves on the real
 *    origin — or forbids crawling outright when the deployment is a preview.
 *  - llms.txt, the same orientation for AI crawlers.
 *  - 404.html, because a static host serves that file for an unknown path; without
 *    it a deep link returns the host's own 404 and the app never boots.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SITE } from '../src/app/core/config/app.constants';
import { localizedUrl } from '../src/app/core/config/routes';
import { DEPLOYMENT } from '../src/app/core/config/build-config.generated';
import { SUPPORTED_LANGUAGES } from '../src/app/core/i18n/i18n.constants';
import { SITEMAP_PATH } from '../workers/shared/http.constants';
import { renderHeadersFile } from '../workers/shared/security-headers';

const ROOT = resolve(import.meta.dir, '..');
const BROWSER_DIR = join(ROOT, 'dist', 'argelee', 'browser');

if (!existsSync(BROWSER_DIR)) {
  console.error('finalize: no build output found. Run `ng build` first.');
  process.exit(1);
}

const absolute = (path: string): string => `${DEPLOYMENT.origin}${path}`;

writeFileSync(join(BROWSER_DIR, '_headers'), renderHeadersFile());
writeFileSync(
  join(BROWSER_DIR, 'robots.txt'),
  DEPLOYMENT.indexable
    ? `# ${SITE.name} — ${DEPLOYMENT.origin}
# Every route is prerendered static HTML, so crawlers need no JavaScript.

User-agent: *
Allow: /

Sitemap: ${absolute(SITEMAP_PATH)}
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

> Marketing landing page. Static, prerendered, in Spanish.${DEPLOYMENT.indexable ? '' : ' This is a preview deployment and should not be indexed or cited.'}

The site is a single landing page served as static HTML, in Spanish, fully prerendered, so
the complete content is present in the initial HTML response without executing JavaScript.

## Pages

${SUPPORTED_LANGUAGES.map((language) => `- [${SITE.name} (${language})](${absolute(localizedUrl(language))})`).join('\n')}

## Notes

- Canonical URLs are published on every page.
- Structured data (Organization, WebSite, WebPage) is embedded as JSON-LD.
- The menu is read from a small public JSON endpoint; there is no user-generated content.
`,
);

const shell = join(BROWSER_DIR, 'index.csr.html');
if (!existsSync(shell)) {
  console.error('finalize: index.csr.html is missing — cannot write 404.html.');
  process.exit(1);
}
copyFileSync(shell, join(BROWSER_DIR, '404.html'));

console.log(
  `finalize: _headers, robots.txt (${DEPLOYMENT.indexable ? 'indexable' : 'disallow all'}), llms.txt, 404.html.`,
);
