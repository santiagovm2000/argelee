export const IMAGE_WIDTHS = [420, 640, 960, 1280, 1920, 2560] as const;

export const IMAGE_EXTENSION = '.avif';

export const FALLBACK_IMAGE_WIDTH = 1280;

// Uploaded photos are resized at the edge by Cloudflare's image transformations,
// addressed through this path on the site's own origin. Off (local development,
// a zone without the feature) the original is served as is.
export const IMAGE_TRANSFORM_PATH = 'cdn-cgi/image';
export const PHOTO_QUALITY = 80;
export const PHOTO_SOCIAL_QUALITY = 82;

// `sizes` hints per placement, so the browser picks the smallest derivative that fills it.
export const IMAGE_SIZES = {
  hero: '(min-width: 1024px) 30rem, 80vw',
  card: '(max-width: 767px) 15rem, (max-width: 1023px) 45vw, 20rem',
  product: '(max-width: 1023px) 92vw, 32rem',
  thumbnail: '4rem',
} as const;
