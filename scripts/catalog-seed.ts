/**
 * Loads the starting catalogue into Workers KV and its photos and price list into R2. Run with
 * `bun run catalog:seed --local` (the `wrangler dev` state) or `--remote`.
 *
 * The seed is the menu as it stood when the panel took over: one JSON in
 * assets-src/catalog/seed plus the original photos beside it. It ran once
 * against the real account; after that the owner's edits in the panel are the
 * truth, so a remote seed refuses to overwrite an existing document unless
 * `--force` says so. Locally it is the quickest way to a populated dev stack.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  CATALOG_KV_KEYS,
  CATALOG_PDF_KEY,
  PHOTO_KEY_PREFIX,
} from '../src/app/core/catalog/catalog.constants';
import {
  type CatalogDocument,
  newCatalogVersion,
  parseCatalogDocument,
  type StoredProduct,
} from '../src/app/core/catalog/catalog.document';
import type { ProductPhoto } from '../src/app/core/catalog/catalog.model';
import {
  isAuthFailure,
  KV_BINDING,
  loginHint,
  R2_BUCKET,
  runWrangler,
  storageTarget,
} from './lib/wrangler';

const ROOT = resolve(import.meta.dir, '..');
const SEED_DIR = join(ROOT, 'assets-src', 'catalog', 'seed');
const SEED_FILE = join(SEED_DIR, 'catalog.json');
const PHOTOS_DIR = join(SEED_DIR, 'photos');
const PDF_FILE = join(SEED_DIR, 'ArGeles-catalogo.pdf');
const PDF_CONTENT_TYPE = 'application/pdf';
const PLACEHOLDER_WIDTH = 20;
const PLACEHOLDER_QUALITY = 40;
const PHOTO_CONTENT_TYPE = 'image/jpeg';
const USAGE = 'usage: bun run catalog:seed --local | --remote [--force]';

/** A seed product is a stored product whose photos are still file names, the cover first. */
type SeedProduct = Omit<StoredProduct, 'photos'> & { readonly photoFiles: readonly string[] };

const target = storageTarget(process.argv, USAGE);
const force = process.argv.includes('--force');

/** Content-addressed key, intrinsic size and blur placeholder, the same way the image pipeline does it. */
async function describePhoto(file: string): Promise<{ photo: ProductPhoto; path: string }> {
  const path = join(PHOTOS_DIR, file);
  const bytes = readFileSync(path);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const extension = file.slice(file.lastIndexOf('.'));
  const { width, height } = await sharp(bytes).metadata();
  if (width === undefined || height === undefined) throw new Error(`${file}: unreadable size`);
  const placeholder = await sharp(bytes)
    .resize({ width: PLACEHOLDER_WIDTH })
    .webp({ quality: PLACEHOLDER_QUALITY })
    .toBuffer();
  return {
    path,
    photo: {
      key: `${PHOTO_KEY_PREFIX}${hash}${extension}`,
      width,
      height,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    },
  };
}

/** Whether the target already holds a catalogue; a failed read aborts instead of counting as absent. */
function existingDocument(): boolean {
  const result = runWrangler(
    ['kv', 'key', 'get', CATALOG_KV_KEYS.document, '--binding', KV_BINDING],
    target,
  );
  if (!result.ok) {
    const hint = isAuthFailure(result) ? ` Cloudflare rejected the login; ${loginHint()}.` : '';
    throw new Error(`could not check for an existing catalogue.${hint}\n${result.stderr}`);
  }
  return result.stdout.includes('{');
}

function putKey(key: string, value: string | { path: string }): void {
  const valueArgs = typeof value === 'string' ? [value] : ['--path', value.path];
  const result = runWrangler(
    ['kv', 'key', 'put', key, ...valueArgs, '--binding', KV_BINDING],
    target,
  );
  if (!result.ok) throw new Error(`kv put ${key} failed:\n${result.stderr}`);
}

function putObject(key: string, path: string, contentType: string): void {
  const result = runWrangler(
    ['r2', 'object', 'put', `${R2_BUCKET}/${key}`, '--file', path, '--content-type', contentType],
    target,
  );
  if (!result.ok) throw new Error(`r2 put ${key} failed:\n${result.stderr}`);
}

const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as { products: readonly SeedProduct[] };

if (target === 'remote' && !force && existingDocument()) {
  console.error(
    'catalog:seed — the remote catalogue already exists; the panel is its source of truth now. Pass --force to replace it.',
  );
  process.exit(1);
}

const uploads: { key: string; path: string }[] = [];
const products: StoredProduct[] = [];
for (const { photoFiles, ...product } of seed.products) {
  const photos: ProductPhoto[] = [];
  for (const file of photoFiles) {
    const { photo, path } = await describePhoto(file);
    uploads.push({ key: photo.key, path });
    photos.push(photo);
  }
  products.push({ ...product, photos });
}

const document: CatalogDocument = parseCatalogDocument({
  version: newCatalogVersion(),
  updatedAt: new Date().toISOString(),
  products,
});

for (const { key, path } of uploads) {
  putObject(key, path, PHOTO_CONTENT_TYPE);
  console.log(`catalog:seed — ${target} r2 ${key}`);
}
putObject(CATALOG_PDF_KEY, PDF_FILE, PDF_CONTENT_TYPE);
console.log(`catalog:seed — ${target} r2 ${CATALOG_PDF_KEY}`);

const documentFile = join(mkdtempSync(join(tmpdir(), 'catalog-seed-')), 'catalog.json');
writeFileSync(documentFile, JSON.stringify(document));
putKey(CATALOG_KV_KEYS.document, { path: documentFile });
putKey(CATALOG_KV_KEYS.version, document.version);
putKey(CATALOG_KV_KEYS.pdfVersion, document.version);

console.log(
  `catalog:seed — ${target}: ${document.products.length} pieces, version ${document.version}.`,
);
