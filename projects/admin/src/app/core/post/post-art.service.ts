import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FONT_WEIGHTS, FONTS } from './post.constants';
import type { Drawing, PostArt, Shape } from './post.model';

const BRAND_DIR = 'brand';
const ART_FILES = {
  logo: `${BRAND_DIR}/logo.svg`,
  daisy: `${BRAND_DIR}/daisy.svg`,
  caustics: `${BRAND_DIR}/caustics.svg`,
  whatsapp: 'icons/whatsapp.svg',
} as const;
const SVG_TYPE = 'image/svg+xml';
const VIEW_BOX_PARTS = 4;
const FONT_PROBE_SIZE = 48;
const POST_FONTS: readonly string[] = [
  `${String(FONT_WEIGHTS.regular)} ${String(FONT_PROBE_SIZE)}px '${FONTS.script}'`,
  `${String(FONT_WEIGHTS.regular)} ${String(FONT_PROBE_SIZE)}px '${FONTS.text}'`,
  `${String(FONT_WEIGHTS.bold)} ${String(FONT_PROBE_SIZE)}px '${FONTS.text}'`,
  `${String(FONT_WEIGHTS.black)} ${String(FONT_PROBE_SIZE)}px '${FONTS.text}'`,
];

/** An SVG file's outlines as canvas paths, with the size of the grid they are drawn on. */
function toDrawing(svgText: string, file: string): Drawing {
  const svg = new DOMParser().parseFromString(svgText, SVG_TYPE).documentElement;
  const box = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  const [, , width, height] = box;
  if (box.length !== VIEW_BOX_PARTS || width === undefined || height === undefined) {
    throw new Error(`${file} has no view box`);
  }
  const shapes: Shape[] = [...svg.querySelectorAll('path')].map((path) => ({
    id: path.getAttribute('id'),
    fill: path.getAttribute('fill'),
    path: new Path2D(path.getAttribute('d') ?? ''),
  }));
  return { width, height, shapes };
}

/**
 * Loads what a publication is painted with, once per visit: the brand's drawings
 * as canvas paths, its fonts, and each photo of a piece decoded at full size.
 * Everything comes from the panel's own origin, so the canvas stays exportable.
 */
@Service()
export class PostArtService {
  private readonly http = inject(HttpClient);
  private art: Promise<PostArt> | null = null;
  private readonly photos = new Map<string, Promise<ImageBitmap>>();

  /** The logo, the sunflower, the water pattern and the WhatsApp glyph, with the fonts ready. */
  load(): Promise<PostArt> {
    this.art ??= this.read().catch((error: unknown) => {
      this.art = null;
      throw error;
    });
    return this.art;
  }

  /** A piece's photo as a bitmap; asking again for the same key reuses the first answer. */
  photo(key: string): Promise<ImageBitmap> {
    const known = this.photos.get(key);
    if (known !== undefined) return known;
    const loading = firstValueFrom(this.http.get(key, { responseType: 'blob' }))
      .then((blob) => createImageBitmap(blob))
      .catch((error: unknown) => {
        this.photos.delete(key);
        throw error;
      });
    this.photos.set(key, loading);
    return loading;
  }

  private async read(): Promise<PostArt> {
    const fonts = Promise.all(POST_FONTS.map((font) => document.fonts.load(font)));
    const [logo, daisy, caustics, whatsapp] = await Promise.all([
      this.drawing(ART_FILES.logo),
      this.drawing(ART_FILES.daisy),
      this.drawing(ART_FILES.caustics),
      this.drawing(ART_FILES.whatsapp),
    ]);
    await fonts;
    return { logo, daisy, caustics, whatsapp };
  }

  private async drawing(file: string): Promise<Drawing> {
    return toDrawing(await firstValueFrom(this.http.get(file, { responseType: 'text' })), file);
  }
}
