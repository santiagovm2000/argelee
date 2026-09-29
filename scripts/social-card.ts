/**
 * The brand card behind link previews of the home page. Run with
 * `bun run social-card`; it draws the card and then runs `bun run images` so
 * the card gets its social JPEG and manifest entry (IMAGES.brandWordmark).
 *
 * The card is the brand's own cover, drawn from the vectors in public/brand:
 * the Azul Cristal water with its pattern, sunflowers down both edges, and the
 * white logo in the middle. No words besides the logo, so one card serves
 * every language. Pieces keep their own photo as the preview.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { OG_IMAGE_SIZE } from '../src/app/core/seo/seo.constants';
import { tokenHex } from './color';

const ROOT = resolve(import.meta.dir, '..');
const BRAND_DIR = join(ROOT, 'public', 'brand');
const TOKENS_FILE = join(ROOT, 'src', 'styles', 'tokens.css');
const OUT_FILE = join(ROOT, 'assets-src', 'images', 'brand', 'wordmark.png');

const PALETTE = { water: 'crystal-500', caustic: 'neutral-0', logo: 'neutral-0' } as const;
const WATER_OPACITY = { light: 0.14, glint: 0.3 } as const;

const LOGO_WIDTH = 760;
const FLOWERS: readonly (readonly [x: number, y: number, size: number, turn: number])[] = [
  [-60, -40, 190, 14],
  [60, 120, 150, -18],
  [-50, 250, 200, 26],
  [70, 440, 160, -8],
  [1050, -30, 180, -12],
  [1110, 150, 150, 20],
  [1020, 420, 210, -24],
];

interface Drawing {
  readonly width: number;
  readonly height: number;
  readonly inner: string;
}

/** The size and the drawing inside one of the brand's SVG files. */
function drawing(file: string): Drawing {
  const svg = readFileSync(join(BRAND_DIR, file), 'utf8');
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];
  if (box === null || inner === undefined) throw new Error(`social-card: ${file} is not an SVG`);
  return { width: Number(box[1]), height: Number(box[2]), inner: inner.trim() };
}

/** One layer of the water pattern by its id, scaled to cover the card. */
function waterLayer(caustics: Drawing, id: 'light' | 'glint', fill: string): string {
  const path = new RegExp(`<path[^>]*id="${id}"[^>]*/>`).exec(caustics.inner)?.[0] ?? '';
  const scale = Math.max(
    OG_IMAGE_SIZE.width / caustics.width,
    OG_IMAGE_SIZE.height / caustics.height,
  );
  const x = (OG_IMAGE_SIZE.width - caustics.width * scale) / 2;
  const y = (OG_IMAGE_SIZE.height - caustics.height * scale) / 2;
  return (
    '<g fill="' +
    fill +
    '" opacity="' +
    String(WATER_OPACITY[id]) +
    '" transform="translate(' +
    x.toFixed(1) +
    ' ' +
    y.toFixed(1) +
    ') scale(' +
    scale.toFixed(4) +
    ')">' +
    path.replace(/\sid="[^"]*"/, '') +
    '</g>'
  );
}

const tokensCss = readFileSync(TOKENS_FILE, 'utf8');
const colors = {
  water: tokenHex(tokensCss, PALETTE.water),
  caustic: tokenHex(tokensCss, PALETTE.caustic),
  logo: tokenHex(tokensCss, PALETTE.logo),
};

const caustics = drawing('caustics.svg');
const daisy = drawing('daisy.svg');
const logo = drawing('logo.svg');

const flowers = FLOWERS.map(([x, y, size, turn]) => {
  const scale = size / Math.max(daisy.width, daisy.height);
  const centre = size / 2;
  return (
    '<g transform="rotate(' +
    String(turn) +
    ' ' +
    String(x + centre) +
    ' ' +
    String(y + centre) +
    ') translate(' +
    String(x) +
    ' ' +
    String(y) +
    ') scale(' +
    scale.toFixed(4) +
    ')">' +
    daisy.inner +
    '</g>'
  );
});

const logoScale = LOGO_WIDTH / logo.width;
const logoX = (OG_IMAGE_SIZE.width - LOGO_WIDTH) / 2;
const logoY = (OG_IMAGE_SIZE.height - logo.height * logoScale) / 2;

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    String(OG_IMAGE_SIZE.width) +
    '" height="' +
    String(OG_IMAGE_SIZE.height) +
    '" viewBox="0 0 ' +
    String(OG_IMAGE_SIZE.width) +
    ' ' +
    String(OG_IMAGE_SIZE.height) +
    '">',
  '<rect width="100%" height="100%" fill="' + colors.water + '"/>',
  waterLayer(caustics, 'light', colors.caustic),
  waterLayer(caustics, 'glint', colors.caustic),
  ...flowers,
  '<g fill="' +
    colors.logo +
    '" transform="translate(' +
    logoX.toFixed(1) +
    ' ' +
    logoY.toFixed(1) +
    ') scale(' +
    logoScale.toFixed(4) +
    ')">' +
    logo.inner +
    '</g>',
  '</svg>',
].join('\n');

mkdirSync(dirname(OUT_FILE), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(OUT_FILE);
console.log(
  'social-card: the logo on ' + colors.water + ' water -> assets-src/images/brand/wordmark.png',
);
