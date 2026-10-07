import {
  ABOUT,
  ABOUT_BAND,
  ABOUT_FLOWERS,
  BOTH,
  DIVIDER,
  FONT_WEIGHTS,
  FONTS,
  FULL_CIRCLE,
  GLOBE,
  HALF,
  HALF_TURN_DEGREES,
  HEAD_BAND,
  HEAD_LOGO,
  LID,
  NAME_PILL,
  PIECE_FLOWERS,
  POST_COLOURS,
  POST_SIZE,
  RING,
  SCRIPT_STROKE_EM,
  SEAM_FLOWERS,
  WATER,
  WATER_LAYERS,
  WAYS,
} from './post.constants';
import type { Band, Drawing, Flower, PostScene } from './post.model';
import { blendsInto, fittingSize, inkToneOn, photoPlacement, wrapLines } from './post-text';

type Context = CanvasRenderingContext2D;

const EVEN_ODD: CanvasFillRule = 'evenodd';
const OPAQUE = 'rgb(0 0 0)';
const WAY_LABEL_LIFT_EM = 0.03;

const font = (weight: number, size: number, family: string): string =>
  `${String(weight)} ${String(size)}px '${family}'`;

/** Where a line's baseline falls when its box starts at `top`, the way CSS centres a line. */
function baseline(ctx: Context, top: number, lineHeight: number): number {
  const { fontBoundingBoxAscent: ascent, fontBoundingBoxDescent: descent } = ctx.measureText('');
  return top + (lineHeight - (ascent + descent)) * HALF + ascent;
}

/** How a brand drawing is filled: in one colour or its own, turned, and kept apart from a backdrop. */
interface Look {
  readonly fill?: string;
  readonly turn?: number;
  readonly backdrop?: string;
}

/** A shape's own colour, or white when that colour would be lost on the backdrop. */
function standingOut(fill: string | null, backdrop: string | undefined): string | null {
  if (fill === null || backdrop === undefined) return fill;
  return blendsInto(fill, backdrop) ? POST_COLOURS.paper : fill;
}

/** Fills a brand drawing at a place and width, the way its look says. */
function paintDrawing(
  ctx: Context,
  drawing: Drawing,
  x: number,
  y: number,
  width: number,
  look: Look = {},
): void {
  const scale = width / drawing.width;
  ctx.save();
  ctx.translate(x + width * HALF, y + drawing.height * scale * HALF);
  ctx.rotate(((look.turn ?? 0) * Math.PI) / HALF_TURN_DEGREES);
  ctx.scale(scale, scale);
  ctx.translate(-drawing.width * HALF, -drawing.height * HALF);
  for (const shape of drawing.shapes) {
    ctx.fillStyle = look.fill ?? standingOut(shape.fill, look.backdrop) ?? POST_COLOURS.ink;
    ctx.fill(shape.path, EVEN_ODD);
  }
  ctx.restore();
}

/** The mask that quiets the water pattern inside the bands and feathers back out of them. */
function calmGradient(ctx: Context, bands: readonly Band[]): CanvasGradient {
  const { height } = POST_SIZE;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  const quiet = `rgb(0 0 0 / ${String(WATER.calm)})`;
  for (const [top, bottom] of [...bands].sort((a, b) => a[0] - b[0])) {
    gradient.addColorStop(Math.max(0, top - WATER.feather) / height, OPAQUE);
    gradient.addColorStop(Math.max(0, top) / height, quiet);
    gradient.addColorStop(bottom / height, quiet);
    gradient.addColorStop(Math.min(height, bottom + WATER.feather) / height, OPAQUE);
  }
  return gradient;
}

/** Pours the backdrop and lays the brand's water pattern over it, quiet where things are read. */
function paintWater(
  ctx: Context,
  caustics: Drawing,
  backdrop: string,
  mirrored: boolean,
  calm: readonly Band[],
): void {
  const { width, height } = POST_SIZE;
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const pattern = layer.getContext('2d');
  if (pattern === null) return;

  const scale = Math.max(width / caustics.width, height / caustics.height);
  pattern.save();
  if (mirrored) {
    pattern.translate(width, 0);
    pattern.scale(-1, 1);
  }
  pattern.translate(
    (width - caustics.width * scale) * HALF,
    (height - caustics.height * scale) * HALF,
  );
  pattern.scale(scale, scale);
  pattern.fillStyle = POST_COLOURS.paper;
  for (const shape of caustics.shapes) {
    const strength = shape.id === null ? undefined : WATER_LAYERS[shape.id];
    if (strength === undefined) continue;
    pattern.globalAlpha = strength;
    pattern.fill(shape.path, EVEN_ODD);
  }
  pattern.restore();

  if (calm.length > 0) {
    pattern.globalCompositeOperation = 'destination-in';
    pattern.fillStyle = calmGradient(pattern, calm);
    pattern.fillRect(0, 0, width, height);
  }
  ctx.drawImage(layer, 0, 0);
}

/** A spray of sunflowers; `shift` slides them left, for the slide that continues the first. */
function paintFlowers(
  ctx: Context,
  daisy: Drawing,
  flowers: readonly Flower[],
  backdrop: string,
  shift = 0,
): void {
  for (const [left, top, width, turn] of flowers) {
    paintDrawing(ctx, daisy, left - shift, top, width, { turn, backdrop });
  }
}

/** The logo every slide carries in the same place, top centre. */
function paintHead(ctx: Context, logo: Drawing, ink: string): void {
  paintDrawing(
    ctx,
    logo,
    (POST_SIZE.width - HEAD_LOGO.width) * HALF,
    HEAD_LOGO.top,
    HEAD_LOGO.width,
    { fill: ink },
  );
}

/**
 * The piece in its round lid: a white ring with its shadow, and the photo framed
 * inside on plain aqua, which shows only where a zoomed-out photo does not reach.
 */
function paintLid(ctx: Context, scene: PostScene, top: number, diameter: number): void {
  const radius = diameter * HALF;
  const left = (POST_SIZE.width - diameter) * HALF;
  const centreX = left + radius;
  const centreY = top + radius;

  ctx.save();
  ctx.shadowColor = POST_COLOURS.shade;
  ctx.shadowBlur = RING.shadowBlur;
  ctx.shadowOffsetY = RING.shadowDrop;
  ctx.fillStyle = POST_COLOURS.paper;
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius + RING.width, 0, FULL_CIRCLE);
  ctx.fill();
  ctx.restore();

  const place = photoPlacement(scene.photo, diameter, scene.framing);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius, 0, FULL_CIRCLE);
  ctx.clip();
  ctx.fillStyle = POST_COLOURS.frame;
  ctx.fillRect(left, top, diameter, diameter);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(scene.photo, left + place.x, top + place.y, place.width, place.height);
  ctx.restore();
}

/** A pill of one colour with a soft shadow under it. */
function paintPill(
  ctx: Context,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  shadowBlur: number,
  shadowDrop: number,
): void {
  ctx.save();
  ctx.shadowColor = POST_COLOURS.shade;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetY = shadowDrop;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height * HALF);
  ctx.fill();
  ctx.restore();
}

/** The piece's name on a white pill over the foot of the lid, shrunk if it would not fit. */
function paintName(ctx: Context, name: string): void {
  ctx.save();
  ctx.font = font(FONT_WEIGHTS.black, NAME_PILL.fontSize, FONTS.text);
  const size = fittingSize(
    ctx.measureText(name).width,
    NAME_PILL.fontSize,
    NAME_PILL.maxWidth - NAME_PILL.paddingX * BOTH,
  );
  ctx.font = font(FONT_WEIGHTS.black, size, FONTS.text);
  const width = ctx.measureText(name).width + NAME_PILL.paddingX * BOTH;
  const height = NAME_PILL.paddingTop + size + NAME_PILL.paddingBottom;
  const top = LID.top + LID.diameter - NAME_PILL.overlap;
  paintPill(
    ctx,
    (POST_SIZE.width - width) * HALF,
    top,
    width,
    height,
    POST_COLOURS.paper,
    NAME_PILL.shadowBlur,
    NAME_PILL.shadowDrop,
  );
  ctx.fillStyle = POST_COLOURS.ink;
  ctx.textAlign = 'center';
  ctx.fillText(name, POST_SIZE.width * HALF, baseline(ctx, top + NAME_PILL.paddingTop, size));
  ctx.restore();
}

/** One way to order: a pill, the disc that carries its icon, and its label; answers the disc's centre. */
function paintWay(
  ctx: Context,
  top: number,
  pill: string,
  disc: string,
  ring: string,
  label: string,
): readonly [x: number, y: number] {
  const { height, width } = WAYS;
  const left = POST_SIZE.width - WAYS.right - width;
  paintPill(
    ctx,
    left,
    top,
    width,
    height,
    pill,
    height * WAYS.shadowBlur,
    height * WAYS.shadowDrop,
  );

  const radius = height * WAYS.disc * HALF;
  const centreX = left + height * WAYS.inset + radius;
  const centreY = top + height * HALF;
  ctx.save();
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius + height * WAYS.discRing, 0, FULL_CIRCLE);
  ctx.fill();
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius, 0, FULL_CIRCLE);
  ctx.fill();

  const size = height * WAYS.fontSize;
  ctx.font = font(FONT_WEIGHTS.black, size, FONTS.text);
  ctx.fillStyle = POST_COLOURS.ink;
  ctx.textAlign = 'center';
  const labelTop = top + (height - size) * HALF - size * WAY_LABEL_LIFT_EM;
  ctx.fillText(label, left + width * HALF, baseline(ctx, labelTop, size));
  ctx.restore();
  return [centreX, centreY];
}

/**
 * The two ways to order, small, at the foot of the slide: the WhatsApp line and the
 * website. The first pill is coral, unless the slide itself is: then it goes white.
 */
function paintWays(ctx: Context, scene: PostScene): void {
  const { height } = WAYS;
  const gap = height * WAYS.gap;
  const top = POST_SIZE.height - WAYS.bottom - height * BOTH - gap;

  const [phoneX, phoneY] = paintWay(
    ctx,
    top,
    blendsInto(POST_COLOURS.coral, scene.backdrop) ? POST_COLOURS.paper : POST_COLOURS.coral,
    POST_COLOURS.whatsapp,
    POST_COLOURS.paper,
    scene.content.phone,
  );
  const glyph = height * WAYS.glyph;
  paintDrawing(ctx, scene.art.whatsapp, phoneX - glyph * HALF, phoneY - glyph * HALF, glyph, {
    fill: POST_COLOURS.paper,
  });

  const [siteX, siteY] = paintWay(
    ctx,
    top + height + gap,
    POST_COLOURS.paper,
    POST_COLOURS.crystal,
    POST_COLOURS.crystal,
    scene.content.site,
  );
  const globe = height * WAYS.globe;
  ctx.save();
  ctx.translate(siteX - globe * HALF, siteY - globe * HALF);
  ctx.scale(globe / GLOBE.size, globe / GLOBE.size);
  ctx.strokeStyle = POST_COLOURS.paper;
  ctx.lineWidth = GLOBE.stroke;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(GLOBE.size * HALF, GLOBE.size * HALF, GLOBE.radius, 0, FULL_CIRCLE);
  ctx.stroke();
  ctx.stroke(new Path2D(GLOBE.lines));
  ctx.restore();
}

/** Gives light ink a soft shadow, so it holds over the brighter parts of the water. */
function lift(ctx: Context, light: boolean, blur: number, drop: number): void {
  if (!light) return;
  ctx.shadowColor = POST_COLOURS.lift;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = drop;
}

/** The divider under a title; answers its height. */
function paintDivider(
  ctx: Context,
  daisy: Drawing,
  top: number,
  ink: string,
  light: boolean,
  backdrop: string,
): number {
  const scale = DIVIDER.width / DIVIDER.grid.width;
  const left = (POST_SIZE.width - DIVIDER.width) * HALF;
  const middle = DIVIDER.grid.height * HALF;
  ctx.save();
  lift(ctx, light, DIVIDER.shadowBlur, DIVIDER.shadowDrop);
  ctx.translate(left, top);
  ctx.scale(scale, scale);
  ctx.fillStyle = ink;
  for (const blade of DIVIDER.blades) ctx.fill(new Path2D(blade));
  for (const dot of DIVIDER.dots) {
    ctx.beginPath();
    ctx.arc(dot, middle, DIVIDER.dotRadius, 0, FULL_CIRCLE);
    ctx.fill();
  }
  ctx.restore();
  paintDrawing(
    ctx,
    daisy,
    left + DIVIDER.flower.x * scale,
    top + DIVIDER.flower.y * scale,
    DIVIDER.flower.width * scale,
    { backdrop },
  );
  return DIVIDER.grid.height * scale;
}

/** The piece's name in the brand's script on one line; answers the height of its line. */
function paintTitle(ctx: Context, name: string, top: number, ink: string, light: boolean): number {
  ctx.save();
  ctx.font = font(FONT_WEIGHTS.regular, ABOUT.nameMaxSize, FONTS.script);
  const size = fittingSize(ctx.measureText(name).width, ABOUT.nameMaxSize, ABOUT.nameMaxWidth);
  const lineHeight = size * ABOUT.nameLineHeight;
  ctx.font = font(FONT_WEIGHTS.regular, size, FONTS.script);
  lift(ctx, light, ABOUT.liftBlur, ABOUT.liftDrop);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = size * SCRIPT_STROKE_EM;
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  const y = baseline(ctx, top, lineHeight);
  ctx.strokeText(name, POST_SIZE.width * HALF, y);
  ctx.fillText(name, POST_SIZE.width * HALF, y);
  ctx.restore();
  return lineHeight;
}

/** The description, centred and wrapped to the slide's measure; answers the height it took. */
function paintBody(ctx: Context, text: string, top: number, ink: string, light: boolean): number {
  const lineHeight = ABOUT.bodySize * ABOUT.bodyLineHeight;
  ctx.save();
  ctx.font = font(light ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular, ABOUT.bodySize, FONTS.text);
  lift(ctx, light, ABOUT.liftBlur, ABOUT.liftDrop);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  const lines = wrapLines(text, ABOUT.bodyWidth, (line) => ctx.measureText(line).width);
  lines.forEach((line, index) => {
    ctx.fillText(line, POST_SIZE.width * HALF, baseline(ctx, top + index * lineHeight, lineHeight));
  });
  ctx.restore();
  return lines.length * lineHeight;
}

/** Wipes whatever state a previous painting left on the canvas. */
function reset(ctx: Context): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Paints the first slide: the logo on top, the piece in its round lid on the
 * water with its name, sunflowers at the edges and the two ways to order.
 */
export function paintPieceSlide(ctx: Context, scene: PostScene): void {
  const light = inkToneOn(scene.backdrop) === 'light';
  reset(ctx);
  paintWater(ctx, scene.art.caustics, scene.backdrop, false, [HEAD_BAND]);
  paintFlowers(ctx, scene.art.daisy, PIECE_FLOWERS, scene.backdrop);
  paintFlowers(ctx, scene.art.daisy, SEAM_FLOWERS, scene.backdrop);
  paintHead(ctx, scene.art.logo, light ? POST_COLOURS.paper : POST_COLOURS.ink);
  paintLid(ctx, scene, LID.top, LID.diameter);
  paintName(ctx, scene.content.name);
  paintWays(ctx, scene);
}

/**
 * Paints the second slide, in the first one's colours: the logo, the piece's
 * name in script, the divider, its description, and the piece rising from the foot.
 */
export function paintAboutSlide(ctx: Context, scene: PostScene): void {
  const light = inkToneOn(scene.backdrop) === 'light';
  const ink = light ? POST_COLOURS.paper : POST_COLOURS.ink;
  reset(ctx);
  paintWater(ctx, scene.art.caustics, scene.backdrop, true, [ABOUT_BAND]);
  paintFlowers(ctx, scene.art.daisy, ABOUT_FLOWERS, scene.backdrop);
  paintFlowers(ctx, scene.art.daisy, SEAM_FLOWERS, scene.backdrop, POST_SIZE.width);
  paintHead(ctx, scene.art.logo, ink);

  let top = ABOUT.top;
  top += paintTitle(ctx, scene.content.name, top, ink, light) + ABOUT.dividerGap;
  top += paintDivider(ctx, scene.art.daisy, top, ink, light, scene.backdrop) + ABOUT.bodyGap;
  top += paintBody(ctx, scene.content.description, top, ink, light) + ABOUT.domeGap;
  paintLid(ctx, scene, top, ABOUT.dome);
}
