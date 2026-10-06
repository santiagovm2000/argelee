/** Where a photo sits inside its circle: how far it is zoomed in and which way it is nudged. */
export interface PhotoFraming {
  readonly zoom: number;
  /** From -1 to 1 across the room the zoomed photo leaves; 0 is centred. */
  readonly x: number;
  readonly y: number;
}

/** What a publication says: the piece's own words and where to order it. */
export interface PostContent {
  readonly name: string;
  readonly description: string;
  readonly phone: string;
  readonly site: string;
}

/** The ink a backdrop takes: white on a deep colour, navy on a light one. */
export type InkTone = 'light' | 'dark';

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect extends Size {
  readonly x: number;
  readonly y: number;
}

/** A horizontal band of a slide, from its top to its bottom, in pixels. */
export type Band = readonly [top: number, bottom: number];

/** A sunflower on a slide: where it sits, how wide it is and how far it is turned, in degrees. */
export type Flower = readonly [left: number, top: number, width: number, turn: number];

/** One filled outline of a brand drawing. */
export interface Shape {
  readonly id: string | null;
  readonly fill: string | null;
  readonly path: Path2D;
}

/** A brand drawing read from its SVG file, ready to be filled on a canvas. */
export interface Drawing extends Size {
  readonly shapes: readonly Shape[];
}

/** Everything a slide is painted with besides the piece itself. */
export interface PostArt {
  readonly logo: Drawing;
  readonly daisy: Drawing;
  readonly caustics: Drawing;
  readonly whatsapp: Drawing;
}

/** One publication to paint: the art, the piece's photo and words, and the owner's choices. */
export interface PostScene {
  readonly art: PostArt;
  readonly photo: ImageBitmap;
  readonly content: PostContent;
  readonly backdrop: string;
  readonly framing: PhotoFraming;
}
