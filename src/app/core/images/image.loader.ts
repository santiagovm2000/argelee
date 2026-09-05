import { IMAGE_CONFIG, IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';
import { IMAGES, type ResponsiveImage } from './image-manifest.generated';
import { FALLBACK_IMAGE_WIDTH, IMAGE_EXTENSION, IMAGE_WIDTHS } from './image.constants';

// The pipeline never upscales, so a small original has fewer derivatives than
// IMAGE_WIDTHS lists. The loader must never point at a width that was not emitted.
const LARGEST_WIDTH_BY_PATH = new Map<string, number>(
  Object.values(IMAGES).map((image) => [image.path, Math.max(...image.widths)]),
);

/** Resolves a manifest path plus a width to a derivative that actually exists on disk. */
export function responsiveImageLoader(config: ImageLoaderConfig): string {
  const largest = LARGEST_WIDTH_BY_PATH.get(config.src) ?? FALLBACK_IMAGE_WIDTH;
  const wanted = Math.min(config.width ?? FALLBACK_IMAGE_WIDTH, largest);
  const width =
    IMAGE_WIDTHS.find((candidate) => candidate >= wanted && candidate <= largest) ?? largest;
  return `${config.src}-${width}w${IMAGE_EXTENSION}`;
}

/** The exact srcset candidates an image has, so the browser never asks for a missing width. */
export function srcsetFor(image: ResponsiveImage): string {
  return image.widths.map((width) => `${width}w`).join(', ');
}

/** Restricts NgOptimizedImage's srcset to the widths the pipeline actually emits. */
export function provideImages(): Provider[] {
  return [
    { provide: IMAGE_LOADER, useValue: responsiveImageLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: [...IMAGE_WIDTHS] } },
  ];
}
