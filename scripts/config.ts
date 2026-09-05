/**
 * Writes build-time configuration into a generated, git-ignored module.
 *
 * The origin and the indexability differ per deployment (the GitHub Pages
 * preview versus the real domain), so neither can be a committed constant.
 *
 * Reads SITE_ORIGIN and SITE_INDEXABLE from the environment (Bun loads .env
 * locally; CI supplies them from its own settings).
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

const origin = (process.env['SITE_ORIGIN'] ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
const indexable = process.env['SITE_INDEXABLE'] !== 'false';

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  `// GENERATED FILE — do not edit, do not commit. Written by scripts/config.ts.
// Set SITE_ORIGIN and SITE_INDEXABLE in .env or the CI environment.

export const DEPLOYMENT = {
  origin: ${JSON.stringify(origin)},
  indexable: ${String(indexable)},
} as const;
`,
);

console.log(`config: origin ${origin}, ${indexable ? 'indexable' : 'NOINDEX'}.`);
