import type { Band, Flower, PhotoFraming, Size } from './post.model';

// The Instagram publication of one piece: two slides, 4:5, drawn in the owner's
// browser and downloaded. The layout mirrors the brand's own posts: the logo on
// top, the piece in a round lid on the water, and the two ways to order.
export const POST_SIZE: Size = { width: 1080, height: 1350 };
export const POST_IMAGE_TYPE = 'image/png';
export const POST_FILE_EXTENSION = '.png';

export const HALF = 0.5;
export const BOTH = 2;
export const FULL_CIRCLE = Math.PI * 2;
export const HALF_TURN_DEGREES = 180;

// The brand book's palette, in the order its slide shows it.
const BRAND = {
  mango: '#ffca00',
  coral: '#ff9000',
  crystal: '#008aff',
  turquoise: '#00c1ca',
  mint: '#00cb7e',
} as const;

// The colours a slide can be poured in at one click; the swatch is the token's utility.
export const POST_BACKDROPS = [
  { id: 'mango', colour: BRAND.mango, swatch: 'bg-mango-300' },
  { id: 'coral', colour: BRAND.coral, swatch: 'bg-coral-400' },
  { id: 'crystal', colour: BRAND.crystal, swatch: 'bg-crystal-500' },
  { id: 'turquoise', colour: BRAND.turquoise, swatch: 'bg-turquoise-400' },
  { id: 'mint', colour: BRAND.mint, swatch: 'bg-mint-400' },
] as const;
export type PostBackdropId = (typeof POST_BACKDROPS)[number]['id'];
export const DEFAULT_BACKDROP: string = BRAND.crystal;
// What the colour picker shows before the owner has picked a colour of his own: deep water.
export const DEFAULT_CUSTOM_BACKDROP = '#0e223a';

// Fixed colours of a slide, the same values tokens.css gives the site.
export const POST_COLOURS = {
  paper: '#ffffff',
  ink: 'oklch(0.2 0.044 253.5)',
  coral: BRAND.coral,
  crystal: BRAND.crystal,
  whatsapp: 'oklch(0.77 0.187 151.5)',
  shade: 'oklch(0.39 0.123 253.5 / 0.45)',
  lift: 'oklch(0.47 0.148 253.5 / 0.5)',
} as const;

// The share of each channel in a colour's luminance, as WCAG weighs them.
export const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;
// Linear sRGB to the cone response OKLab starts from, and that response, cube-rooted, to OKLab.
export const OKLAB_CONES = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
] as const;
export const OKLAB_AXES = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
] as const;
// Two colours closer than this in OKLab read as one: a coral pill on a coral slide.
export const MIN_SEPARATION = 0.08;
// A backdrop darker than this takes white ink; a lighter one takes navy.
export const LIGHT_INK_MAX_LUMINANCE = 0.3;

export const ZOOM = { min: 1, max: 3, step: 0.01 } as const;
export const NUDGE_STEP = 0.08;
export const DEFAULT_FRAMING: PhotoFraming = { zoom: 1, x: 0, y: 0 };

export const FONTS = { text: 'Lato', script: 'Great Vibes' } as const;
export const FONT_WEIGHTS = { regular: 400, bold: 700, black: 900 } as const;
// Great Vibes runs lighter than the brand book's script, so it is drawn with a hair of stroke.
export const SCRIPT_STROKE_EM = 0.014;

// The water pattern: how strong its two layers are, and how far it is quieted
// behind the logo and the text, feathering back out over a short distance.
export const WATER = { calm: 0.3, feather: 90 } as const;
export const WATER_LAYERS: Readonly<Record<string, number>> = { light: 0.13, glint: 0.26 };
export const HEAD_BAND: Band = [0, 236];
export const ABOUT_BAND: Band = [0, 790];

export const HEAD_LOGO = { top: 60, width: 440 } as const;

export const LID = { diameter: 770, top: 276 } as const;
export const RING = { width: 18, shadowBlur: 54, shadowDrop: 30 } as const;

export const NAME_PILL = {
  overlap: 44,
  maxWidth: 940,
  fontSize: 44,
  paddingX: 46,
  paddingTop: 20,
  paddingBottom: 22,
  shadowBlur: 26,
  shadowDrop: 12,
} as const;

// The two ways to order, small, at the foot of the first slide. Every measure of
// a pill is a share of its height, so the pair scales as one.
export const WAYS = {
  right: 64,
  bottom: 60,
  width: 384,
  height: 64,
  gap: 0.2,
  inset: 0.12,
  disc: 0.76,
  discRing: 0.04,
  glyph: 0.44,
  globe: 0.5,
  fontSize: 0.44,
  shadowBlur: 0.42,
  shadowDrop: 0.22,
} as const;
export const GLOBE = {
  size: 24,
  radius: 9,
  stroke: 2.1,
  lines: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
} as const;

export const ABOUT = {
  top: 258,
  nameMaxSize: 124,
  nameMaxWidth: 930,
  nameLineHeight: 1.04,
  dividerGap: 14,
  bodyGap: 24,
  bodyWidth: 860,
  bodySize: 45,
  bodyLineHeight: 1.38,
  domeGap: 62,
  dome: 940,
  liftBlur: 20,
  liftDrop: 3,
} as const;

// The divider under a title, on its own 620 x 70 grid: two blades that swell
// towards the middle, a dot each, and the sunflower between them.
export const DIVIDER = {
  width: 600,
  grid: { width: 620, height: 70 },
  blades: [
    'M 14 35 Q 150 34 226 30.4 L 252 35 L 226 39.6 Q 150 36 14 35 Z',
    'M 606 35 Q 470 34 394 30.4 L 368 35 L 394 39.6 Q 470 36 606 35 Z',
  ],
  dots: [264, 356],
  dotRadius: 5.2,
  flower: { x: 279, y: 1.7, width: 62 },
  shadowBlur: 8,
  shadowDrop: 2,
} as const;

export const PIECE_FLOWERS: readonly Flower[] = [
  [-96, 560, 250, 14],
  [-70, 790, 190, -20],
  [-70, 1090, 260, -10],
  [150, 1232, 170, 18],
];
export const ABOUT_FLOWERS: readonly Flower[] = [[936, 1000, 250, 18]];
// The sunflower that runs across the seam, so the two slides read as one when swiped.
export const SEAM_FLOWERS: readonly Flower[] = [[944, 850, 236, -16]];
