/**
 * Snapshots the published catalogue from Workers KV into a generated,
 * git-ignored module the build prerenders from. Run with `bun run catalog:pull`
 * (the real account) or `--local` (the `wrangler dev` state); `bun run build`
 * and `bun start` call it. `CATALOG_SOURCE=local` in .env makes local the
 * default for a machine that develops against `wrangler dev`.
 *
 * The site opens on this snapshot and refreshes from the API once loaded, so a
 * stale snapshot only affects what crawlers see, never what visitors see. Only
 * the public projection is written: costs and margins never reach the bundle.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { CATALOG_KV_KEYS } from '../src/app/core/catalog/catalog.constants';
import { parseCatalogDocument } from '../src/app/core/catalog/catalog.document';
import { toPublicCatalog } from '../src/app/core/catalog/projection';
import {
  isAuthFailure,
  jsonFromWranglerOutput,
  KV_BINDING,
  loginHint,
  runWrangler,
  type StorageTarget,
} from './lib/wrangler';

const OUTPUT_FILE = resolve(
  import.meta.dir,
  '..',
  'src',
  'app',
  'core',
  'catalog',
  'catalog.snapshot.generated.ts',
);

const target: StorageTarget =
  process.argv.includes('--local') || process.env['CATALOG_SOURCE'] === 'local'
    ? 'local'
    : 'remote';

const result = runWrangler(
  ['kv', 'key', 'get', CATALOG_KV_KEYS.document, '--binding', KV_BINDING],
  target,
);
if (!result.ok) {
  console.error(
    isAuthFailure(result)
      ? `catalog:pull — Cloudflare rejected the wrangler login. Retry; if it fails again, ${loginHint()}.`
      : `catalog:pull — wrangler could not read the ${target} catalogue from KV.`,
  );
  console.error(result.stderr.trim());
  process.exit(1);
}
if (!result.stdout.includes('{')) {
  console.error(
    `catalog:pull — there is no ${target} catalogue in KV yet. Seed it with \`bun run catalog:seed --${target}\`.`,
  );
  process.exit(1);
}

const snapshot = toPublicCatalog(parseCatalogDocument(jsonFromWranglerOutput(result.stdout)));

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(
  OUTPUT_FILE,
  `// GENERATED FILE — do not edit, do not commit. Written by scripts/catalog-pull.ts from Workers KV.
// Refresh with \`bun run catalog:pull\`; the site swaps in the live catalogue after loading anyway.

import type { PublicCatalog } from './projection';

export const CATALOG_SNAPSHOT: PublicCatalog = ${JSON.stringify(snapshot, null, 2)};
`,
);

console.log(
  `catalog:pull — ${target}: ${snapshot.products.length} published pieces, version ${snapshot.version} -> ${join('src', 'app', 'core', 'catalog', 'catalog.snapshot.generated.ts')}.`,
);
