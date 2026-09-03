/**
 * Writes the PrimeNG/PrimeUI license key into a generated, git-ignored module.
 *
 * The key is read from PRIMENG_LICENSE_KEY (Bun loads .env automatically), so it
 * lives in .env locally and in the CI secret store — never in a committed file.
 * Runs automatically before `bun run start` and `bun run build`.
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
  'license.generated.ts',
);

const key = process.env['PRIMENG_LICENSE_KEY'] ?? '';

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  `// GENERATED FILE — do not edit, do not commit. Written by scripts/license.ts.
// Set PRIMENG_LICENSE_KEY in .env (local) or the CI secret store.
export const PRIMENG_LICENSE_KEY = ${JSON.stringify(key)};
`,
);

console.log(
  key === ''
    ? 'license: PRIMENG_LICENSE_KEY is not set — PrimeNG will run unlicensed. Add it to .env.'
    : 'license: key written to src/app/core/config/license.generated.ts',
);
