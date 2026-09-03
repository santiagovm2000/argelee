// GENERATED FILE — do not edit by hand.
// Source: assets-src/images. Regenerate with `bun run images`.
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

export const IMAGES = {} as const satisfies Record<string, ResponsiveImage>;

export type ImageKey = keyof typeof IMAGES;
