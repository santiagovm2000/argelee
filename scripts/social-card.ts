/**
 * The brand card behind link previews of the home page. Run with
 * `bun run social-card`; it draws the card and then runs `bun run images` so
 * the card gets its social JPEG and manifest entry (IMAGES.brandWordmark).
 *
 * The wordmark is outlined from the bundled Parisienne file, like the favicon,
 * and set in the wordmark wine over the page surface with the ornament under
 * it. No words besides the wordmark, so one card serves every language.
 * Pieces keep their own photo as the preview.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import { OG_IMAGE_SIZE } from '../src/app/core/seo/seo.constants';
import { SITE } from '../src/app/core/config/app.constants';
import { tokenHex } from './color';

const ROOT = resolve(import.meta.dir, '..');
const FONT_FILE = join(ROOT, 'src', 'styles', 'fonts', 'parisienne-latin.woff2');
const TOKENS_FILE = join(ROOT, 'src', 'styles', 'tokens.css');
const OUT_FILE = join(ROOT, 'assets-src', 'images', 'brand', 'wordmark.png');

// Token names without the --color- prefix.
const PALETTE = { surface: 'brand-50', mark: 'vino', rule: 'brand-200', dot: 'brand-600' } as const;

// Composition, in card pixels: the wordmark's width and its vertical centre,
// then the ornament (rule, dot, rule) below it.
const MARK_WIDTH = 720;
const MARK_CENTRE_Y = 285;
const ORNAMENT_Y = 462;
const RULE_LENGTH = 56;
const RULE_GAP = 14;
const RULE_STROKE = 1.5;
const DOT_RADIUS = 3;

const tokensCss = readFileSync(TOKENS_FILE, 'utf8');
const colors = {
  surface: tokenHex(tokensCss, PALETTE.surface),
  mark: tokenHex(tokensCss, PALETTE.mark),
  rule: tokenHex(tokensCss, PALETTE.rule),
  dot: tokenHex(tokensCss, PALETTE.dot),
};

const font = fontkit.openSync(FONT_FILE);
if (!('layout' in font)) throw new Error('expected a single font, got a collection');
const run = font.layout(SITE.wordmark);
const { minX, minY, maxX, maxY } = run.bbox;

// Fit the shaped run to MARK_WIDTH, centre it, and flip font units (y up)
// into SVG pixels (y down).
const scale = MARK_WIDTH / (maxX - minX);
const originX = (OG_IMAGE_SIZE.width - MARK_WIDTH) / 2 - minX * scale;
const baselineY = MARK_CENTRE_Y + ((minY + maxY) / 2) * scale;

let penX = 0;
const glyphs = run.glyphs.map((glyph, index) => {
  const position = run.positions[index];
  const x = penX + (position?.xOffset ?? 0);
  const y = position?.yOffset ?? 0;
  penX += position?.xAdvance ?? glyph.advanceWidth;
  return (
    '<path transform="translate(' +
    x.toFixed(1) +
    ' ' +
    y.toFixed(1) +
    ')" d="' +
    glyph.path.toSVG() +
    '"/>'
  );
});

const centreX = OG_IMAGE_SIZE.width / 2;
const leftRuleStart = centreX - RULE_GAP - RULE_LENGTH;
const rightRuleStart = centreX + RULE_GAP;
const px = (value: number): string => value.toFixed(1);

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
  '<rect width="100%" height="100%" fill="' + colors.surface + '"/>',
  '<g fill="' +
    colors.mark +
    '" transform="translate(' +
    px(originX) +
    ' ' +
    px(baselineY) +
    ') scale(' +
    scale.toFixed(5) +
    ' ' +
    (-scale).toFixed(5) +
    ')">',
  ...glyphs,
  '</g>',
  '<g stroke="' +
    colors.rule +
    '" stroke-width="' +
    String(RULE_STROKE) +
    '" stroke-linecap="round">',
  '<path d="M' + px(leftRuleStart) + ' ' + px(ORNAMENT_Y) + 'h' + String(RULE_LENGTH) + '"/>',
  '<path d="M' + px(rightRuleStart) + ' ' + px(ORNAMENT_Y) + 'h' + String(RULE_LENGTH) + '"/>',
  '</g>',
  '<circle cx="' +
    px(centreX) +
    '" cy="' +
    px(ORNAMENT_Y) +
    '" r="' +
    String(DOT_RADIUS) +
    '" fill="' +
    colors.dot +
    '"/>',
  '</svg>',
].join('\n');

mkdirSync(dirname(OUT_FILE), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(OUT_FILE);
console.log(
  'social-card: ' +
    SITE.wordmark +
    ' in ' +
    colors.mark +
    ' on ' +
    colors.surface +
    ' -> assets-src/images/brand/wordmark.png',
);
