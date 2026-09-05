/**
 * Favicon from the wordmark. Run with `bun run favicon` after changing the
 * wordmark font or the brand colours.
 *
 * Outlines the "A" of ArGeles straight from the bundled Parisienne file, so
 * the icon never depends on a font loading, and paints it in the wordmark's
 * wine with no background: on the tab it reads like the logo itself. The SVG
 * follows the browser's colour scheme the way the wordmark follows the
 * site's; the ICO is transparent too. Only the iOS touch icon gets a pale
 * brand tile, because iOS refuses transparency there.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import { tokenHex } from './color';

const ROOT = resolve(import.meta.dir, '..');
const FONT_FILE = join(ROOT, 'src', 'styles', 'fonts', 'parisienne-latin.woff2');
const TOKENS_FILE = join(ROOT, 'src', 'styles', 'tokens.css');
const OUT_DIR = join(ROOT, 'public');

const LETTER = 'A';
const TILE = 64;
const INSET = 2;
const ICO_SIZES = [16, 32, 48] as const;
const TOUCH_ICON_SIZE = 180;

// Token names without the --color- prefix: the wordmark's colour per scheme,
// and the tile behind the touch icon.
const PALETTE = {
  mark: { light: 'vino', dark: 'vino-soft' },
  tile: 'brand-100',
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
};

const font = fontkit.openSync(FONT_FILE);
if (!('glyphForCodePoint' in font)) throw new Error('expected a single font, got a collection');
const glyph = font.glyphForCodePoint(LETTER.codePointAt(0) ?? 0);
const { minX, minY, maxX, maxY } = glyph.bbox;

// Fit the glyph's box inside the tile, keeping its proportions, and flip the
// font's y-up coordinates into SVG's y-down.
const box = TILE - INSET * 2;
const scale = Math.min(box / (maxX - minX), box / (maxY - minY));
const offsetX = (TILE - (maxX - minX) * scale) / 2 - minX * scale;
const offsetY = (TILE - (maxY - minY) * scale) / 2 + maxY * scale;
const transform =
  'translate(' +
  offsetX.toFixed(3) +
  ' ' +
  offsetY.toFixed(3) +
  ') scale(' +
  scale.toFixed(5) +
  ' ' +
  (-scale).toFixed(5) +
  ')';
const outline = glyph.path.toSVG();

function svg(options: { tile: boolean; themed: boolean }): string {
  const dark = options.themed
    ? ' @media (prefers-color-scheme: dark) { .mark { fill: ' + colors.mark.dark + '; } }'
    : '';
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
    '<style>.mark { fill: ' + colors.mark.light + '; }' + dark + '</style>',
    tile,
    '<path class="mark" transform="' + transform + '" d="' + outline + '"/>',
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
  'favicon: ' +
    LETTER +
    ' in ' +
    colors.mark.light +
    ' -> favicon.svg, favicon.ico (' +
    ICO_SIZES.join('/') +
    '), apple-touch-icon.png',
);
