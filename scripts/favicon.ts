/**
 * Favicon from the brand's monogram. Run with `bun run favicon` after changing
 * the monogram drawing or the brand colours.
 *
 * Draws the "AG" monogram straight from public/brand/monogram.svg, so the icon
 * never depends on anything loading, and paints it in the logo's Azul Cristal
 * with no background: on the tab it reads like the logo itself. The SVG follows
 * the browser's colour scheme the way the logo follows the site's; the ICO is
 * transparent too. Only the iOS touch icon gets a tile, the brand's blue with
 * the monogram in white, because iOS refuses transparency there.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { tokenHex } from './color';

const ROOT = resolve(import.meta.dir, '..');
const ART_FILE = join(ROOT, 'public', 'brand', 'monogram.svg');
const TOKENS_FILE = join(ROOT, 'src', 'styles', 'tokens.css');
const OUT_DIR = join(ROOT, 'public');

const TILE = 64;
const INSET = 2;
const TILE_INSET = 12;
const ICO_SIZES = [16, 32, 48] as const;
const TOUCH_ICON_SIZE = 180;

// Token names without the --color- prefix: the monogram's colour per scheme,
// and the tile and mark of the touch icon.
const PALETTE = {
  mark: { light: 'crystal-500', dark: 'turquoise-400' },
  tile: 'crystal-500',
  tileMark: 'neutral-0',
} as const;

const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;
const ICO_TYPE_ICON = 1;
const ICO_BITS_PER_PIXEL = 32;

const tokensCss = readFileSync(TOKENS_FILE, 'utf8');

const colors = {
  mark: {
    light: tokenHex(tokensCss, PALETTE.mark.light),
    dark: tokenHex(tokensCss, PALETTE.mark.dark),
  },
  tile: tokenHex(tokensCss, PALETTE.tile),
  tileMark: tokenHex(tokensCss, PALETTE.tileMark),
};

const art = readFileSync(ART_FILE, 'utf8');
const viewBox = /viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/.exec(art);
const drawn = /\sd="([^"]+)"/.exec(art)?.[1];
if (viewBox === null || drawn === undefined)
  throw new Error('favicon: monogram.svg has no drawing');
const outline: string = drawn;
const [artWidth, artHeight] = [Number(viewBox[3]), Number(viewBox[4])];

/** The transform that fits the monogram, centred, inside the tile less an inset. */
function fit(inset: number): string {
  const box = TILE - inset * 2;
  const scale = Math.min(box / artWidth, box / artHeight);
  const x = (TILE - artWidth * scale) / 2;
  const y = (TILE - artHeight * scale) / 2;
  return 'translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ') scale(' + scale.toFixed(5) + ')';
}

function svg(options: { tile: boolean; themed: boolean }): string {
  const dark = options.themed
    ? ' @media (prefers-color-scheme: dark) { .mark { fill: ' + colors.mark.dark + '; } }'
    : '';
  const fill = options.tile ? colors.tileMark : colors.mark.light;
  const tile = options.tile
    ? '<rect fill="' +
      colors.tile +
      '" width="' +
      String(TILE) +
      '" height="' +
      String(TILE) +
      '"/>'
    : '';
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      String(TILE) +
      ' ' +
      String(TILE) +
      '">',
    '<style>.mark { fill: ' + fill + '; }' + dark + '</style>',
    tile,
    '<path class="mark" fill-rule="evenodd" transform="' +
      fit(options.tile ? TILE_INSET : INSET) +
      '" d="' +
      outline +
      '"/>',
    '</svg>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

async function png(markup: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(markup)).resize(size, size).png().toBuffer();
}

/** Wraps PNG frames in an ICO container; every current browser reads PNG entries. */
function ico(frames: readonly { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(ICO_HEADER_BYTES);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(ICO_TYPE_ICON, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * frames.length;
  const entries = frames.map(({ size, data }) => {
    const entry = Buffer.alloc(ICO_ENTRY_BYTES);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(ICO_BITS_PER_PIXEL, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...frames.map((frame) => frame.data)]);
}

writeFileSync(join(OUT_DIR, 'favicon.svg'), svg({ tile: false, themed: true }) + '\n');

const plain = svg({ tile: false, themed: false });
const frames = await Promise.all(
  ICO_SIZES.map(async (size) => ({ size, data: await png(plain, size) })),
);
writeFileSync(join(OUT_DIR, 'favicon.ico'), ico(frames));

writeFileSync(
  join(OUT_DIR, 'apple-touch-icon.png'),
  await png(svg({ tile: true, themed: false }), TOUCH_ICON_SIZE),
);

console.log(
  'favicon: the AG monogram in ' +
    colors.mark.light +
    ' -> favicon.svg, favicon.ico (' +
    ICO_SIZES.join('/') +
    '), apple-touch-icon.png',
);
