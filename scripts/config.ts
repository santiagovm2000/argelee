/**
 * Writes build-time configuration into a generated, git-ignored module.
 *
 * Everything here differs per deployment, so none of it can be a committed
 * constant: the licence key is a secret, and the origin and base href change
 * between the GitHub Pages preview and the real domain.
 *
 * Reads PRIMENG_LICENSE_KEY, SITE_ORIGIN and SITE_INDEXABLE from the environment
 * (Bun loads .env locally; CI supplies them from its own settings).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUTPUT_FILE = resolve(
  import.meta.dir,
  '..',
  'src',
  'app',
  'core',
  'config',
  'build-config.generated.ts',
);

const DEFAULT_ORIGIN = 'http://localhost:4200';

const licenseKey = process.env['PRIMENG_LICENSE_KEY'] ?? '';
const origin = (process.env['SITE_ORIGIN'] ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
const indexable = process.env['SITE_INDEXABLE'] !== 'false';

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  `// GENERATED FILE — do not edit, do not commit. Written by scripts/config.ts.
// Set PRIMENG_LICENSE_KEY, SITE_ORIGIN and SITE_INDEXABLE in .env or the CI environment.

export const PRIMENG_LICENSE_KEY = ${JSON.stringify(licenseKey)};

export const DEPLOYMENT = {
  origin: ${JSON.stringify(origin)},
  indexable: ${String(indexable)},
} as const;
`,
);

console.log(
  `config: origin ${origin}, ${indexable ? 'indexable' : 'NOINDEX'}, licence ${licenseKey === '' ? 'MISSING' : 'set'}.`,
);
