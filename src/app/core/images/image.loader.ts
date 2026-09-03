import { IMAGE_CONFIG, IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';
import { FALLBACK_IMAGE_WIDTH, IMAGE_EXTENSION, IMAGE_WIDTHS } from './image.constants';

/** Resolves a manifest path plus a width to the AVIF derivative on disk. */
export function responsiveImageLoader(config: ImageLoaderConfig): string {
  const width = config.width ?? FALLBACK_IMAGE_WIDTH;
  const nearest: number =
    IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? FALLBACK_IMAGE_WIDTH;
  return `${config.src}-${nearest}w${IMAGE_EXTENSION}`;
}

/** Restricts NgOptimizedImage's srcset to the widths the pipeline actually emits. */
export function provideImages(): Provider[] {
  return [
    { provide: IMAGE_LOADER, useValue: responsiveImageLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: [...IMAGE_WIDTHS] } },
  ];
}
