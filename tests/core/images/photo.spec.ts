import { describe, expect, it } from 'vitest';
import type { ProductPhoto } from '@core/catalog/catalog.model';
import { IMAGE_TRANSFORM_PATH, IMAGE_WIDTHS } from '@core/images/image.constants';
import { isPhotoPath, photoImage, photoSocialUrl, photoUrl } from '@core/images/photo';
import { OG_IMAGE_SIZE } from '@core/seo/seo.constants';

const photo: ProductPhoto = {
  key: 'photos/abc123.jpg',
  width: 1830,
  height: 1504,
  placeholder: 'data:image/webp;base64,UklGRgA=',
};

describe('isPhotoPath', () => {
  it('tells an uploaded photo from a manifest image', () => {
    expect(isPhotoPath(photo.key)).toBe(true);
    expect(isPhotoPath('images/brand/wordmark')).toBe(false);
  });
});

describe('photoUrl', () => {
  it('asks the edge for the wanted width when transformations are on', () => {
    const url = photoUrl(photo.key, 640, true);
    expect(url.startsWith(`${IMAGE_TRANSFORM_PATH}/`)).toBe(true);
    expect(url).toContain('width=640');
    expect(url.endsWith(`/${photo.key}`)).toBe(true);
  });

  it('serves the original when transformations are off or no width is wanted', () => {
    expect(photoUrl(photo.key, 640, false)).toBe(photo.key);
    expect(photoUrl(photo.key, undefined, true)).toBe(photo.key);
  });
});

describe('photoSocialUrl', () => {
  it('is a JPEG at the Open Graph size', () => {
    const url = photoSocialUrl(photo.key, true);
    expect(url).toContain(`width=${OG_IMAGE_SIZE.width}`);
    expect(url).toContain(`height=${OG_IMAGE_SIZE.height}`);
    expect(url).toContain('format=jpeg');
  });
});

describe('photoImage', () => {
  it('offers only the widths the original can fill', () => {
    const image = photoImage(photo, true);
    expect(image.path).toBe(photo.key);
    expect(image.widths).toEqual(IMAGE_WIDTHS.filter((width) => width <= photo.width));
    expect(image.placeholder).toBe(photo.placeholder);
  });

  it('falls back to the original width for a photo smaller than every step', () => {
    const tiny = photoImage({ ...photo, width: 300, height: 200 }, true);
    expect(tiny.widths).toEqual([300]);
  });
});
