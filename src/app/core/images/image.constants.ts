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
  hero: '100vw',
  card: '(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw',
  product: '(max-width: 1024px) 92vw, 46vw',
} as const;
