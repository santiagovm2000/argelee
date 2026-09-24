/**
 * Writes build-time configuration into a generated, git-ignored module.
 *
 * The origin, the indexability and whether Cloudflare's image transformations
 * are available differ per deployment (a local run, a preview, the real
 * domain), so none of them can be a committed constant.
 *
 * Reads SITE_ORIGIN, SITE_INDEXABLE and SITE_IMAGE_TRANSFORMS from the
 * environment (Bun loads .env locally; CI supplies them from its own settings).
 *
 * Also regenerates the Workers' types (worker-configuration.d.ts files,
 * git-ignored) from both wrangler configs, quietly: lint and the type-aware
 * checks need them before anything else runs.
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
const imageTransforms = process.env['SITE_IMAGE_TRANSFORMS'] === 'true';

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  `// GENERATED FILE — do not edit, do not commit. Written by scripts/config.ts.
// Set SITE_ORIGIN, SITE_INDEXABLE and SITE_IMAGE_TRANSFORMS in .env or the CI environment.

export const DEPLOYMENT = {
  origin: ${JSON.stringify(origin)},
  indexable: ${String(indexable)},
  imageTransforms: ${String(imageTransforms)},
} as const;
`,
);

const TYPE_COMMANDS: readonly (readonly string[])[] = [
  ['types', '--env-interface', 'SiteEnv'],
  [
    'types',
    '--config',
    'admin/wrangler.jsonc',
    '--env-interface',
    'AdminEnv',
    '--include-runtime=false',
    'admin/worker-configuration.d.ts',
  ],
];
for (const args of TYPE_COMMANDS) {
  const types = Bun.spawnSync(['bun', 'x', 'wrangler', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (types.exitCode !== 0) {
    console.error(types.stderr.toString());
    console.error(`config: wrangler ${args.join(' ')} failed; see above.`);
    process.exit(1);
  }
}

console.log(
  `config: origin ${origin}, ${indexable ? 'indexable' : 'NOINDEX'}, image transformations ${imageTransforms ? 'on' : 'off'}; Worker types written.`,
);
