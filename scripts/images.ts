/**
 * Image pipeline. Run with `bun run images`.
 *
 * Reads originals from assets-src/images/<category>/<name>.<ext>, emits
 * responsive AVIF derivatives into public/images/<category>/, and writes a typed
 * manifest so templates get real intrinsic dimensions (no layout shift) and a
 * blur placeholder without anyone hand-maintaining numbers.
 *
 * Output naming: <name>-<width>w.avif — the width is in the filename so the
 * custom NgOptimizedImage loader can build a srcset by string substitution.
 */
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dir, '..');
const SOURCE_DIR = join(ROOT, 'assets-src', 'images');
const OUTPUT_DIR = join(ROOT, 'public', 'images');
const MANIFEST_FILE = join(ROOT, 'src', 'app', 'shared', 'images', 'image-manifest.generated.ts');

const WIDTHS = [420, 640, 960, 1280, 1920, 2560];
const AVIF_QUALITY = 55;
const PLACEHOLDER_WIDTH = 20;
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tiff']);

interface ManifestEntry {
  readonly key: string;
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly widths: number[];
  readonly placeholder: string;
}

const toCamel = (value: string): string =>
  value.replace(/[-_](\w)/g, (_, char: string) => char.toUpperCase());

function sourceImages(dir: string, category = ''): { file: string; category: string }[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return sourceImages(full, category === '' ? entry : `${category}/${entry}`);
    }
    return SOURCE_EXTENSIONS.has(extname(entry).toLowerCase()) ? [{ file: full, category }] : [];
  });
}

async function process(file: string, category: string): Promise<ManifestEntry> {
  const name = basename(file, extname(file));
  const image = sharp(file);
  const metadata = await image.metadata();
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;

  const targetDir = category === '' ? OUTPUT_DIR : join(OUTPUT_DIR, category);
  mkdirSync(targetDir, { recursive: true });

  // Never upscale: a derivative wider than the original just wastes bytes.
  const widths = WIDTHS.filter((width) => width <= sourceWidth);
  if (widths.length === 0) widths.push(sourceWidth);

  for (const width of widths) {
    await sharp(file)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY, effort: 6 })
      .toFile(join(targetDir, `${name}-${width}w.avif`));
  }

  const placeholderBuffer = await sharp(file)
    .resize({ width: PLACEHOLDER_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    key: toCamel(category === '' ? name : `${category.replace(/\//g, '-')}-${name}`),
    path: category === '' ? `/images/${name}` : `/images/${category}/${name}`,
    width: sourceWidth,
    height: sourceHeight,
    widths,
    placeholder: `data:image/webp;base64,${placeholderBuffer.toString('base64')}`,
  };
}

const sources = sourceImages(SOURCE_DIR);
const entries: ManifestEntry[] = [];
for (const { file, category } of sources) {
  entries.push(await process(file, category));
  console.log(`images: ${basename(file)} -> ${category === '' ? '.' : category}`);
}

mkdirSync(join(ROOT, 'src', 'app', 'shared', 'images'), { recursive: true });
writeFileSync(
  MANIFEST_FILE,
  `// GENERATED FILE — do not edit by hand.
// Source: assets-src/images. Regenerate with \`bun run images\`.
//
// Usage:
//   <img [ngSrc]="images.heroProduct.path" [width]="..." [height]="..." priority />

export interface ResponsiveImage {
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly widths: readonly number[];
  readonly placeholder: string;
}

export const IMAGES = {
${entries
  .map(
    (entry) => `  ${entry.key}: {
    path: '${entry.path}',
    width: ${entry.width},
    height: ${entry.height},
    widths: [${entry.widths.join(', ')}],
    placeholder: '${entry.placeholder}',
  },`,
  )
  .join('\n')}
} as const satisfies Record<string, ResponsiveImage>;

export type ImageKey = keyof typeof IMAGES;
`,
);

console.log(
  entries.length === 0
    ? `images: no sources found. Drop originals into assets-src/images/<category>/ and re-run.`
    : `images: ${entries.length} image(s) processed, manifest written.`,
);
