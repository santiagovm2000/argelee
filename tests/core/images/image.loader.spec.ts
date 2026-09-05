import { describe, expect, it } from 'vitest';
import { IMAGES } from '@core/images/image-manifest.generated';
import { IMAGE_WIDTHS } from '@core/images/image.constants';
import { responsiveImageLoader, srcsetFor } from '@core/images/image.loader';

const smallest = Object.values(IMAGES).reduce((a, b) =>
  Math.max(...a.widths) <= Math.max(...b.widths) ? a : b,
);
const largestWidth = Math.max(...smallest.widths);

describe('responsiveImageLoader', () => {
  it('never asks for a width the pipeline did not emit', () => {
    const url = responsiveImageLoader({ src: smallest.path, width: 2560 });
    expect(url).toBe(`${smallest.path}-${largestWidth}w.avif`);
  });

  it('rounds a wanted width up to the next emitted one', () => {
    const [first, second] = smallest.widths;
    if (first === undefined || second === undefined) return;
    expect(responsiveImageLoader({ src: smallest.path, width: first + 1 })).toBe(
      `${smallest.path}-${second}w.avif`,
    );
  });

  it('falls back to the global scale for a path outside the manifest', () => {
    const url = responsiveImageLoader({ src: 'images/unknown', width: 500 });
    const expected = IMAGE_WIDTHS.find((width) => width >= 500);
    expect(url).toBe(`images/unknown-${expected}w.avif`);
  });
});

describe('srcsetFor', () => {
  it('lists exactly the emitted widths as candidates', () => {
    expect(srcsetFor(smallest)).toBe(smallest.widths.map((width) => `${width}w`).join(', '));
  });
});
