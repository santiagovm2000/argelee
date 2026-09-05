export const IMAGE_WIDTHS = [420, 640, 960, 1280, 1920, 2560] as const;

export const IMAGE_EXTENSION = '.avif';

export const FALLBACK_IMAGE_WIDTH = 1280;

// `sizes` hints per placement, so the browser picks the smallest derivative that fills it.
export const IMAGE_SIZES = {
  hero: '100vw',
  card: '(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw',
  product: '(max-width: 1024px) 92vw, 46vw',
} as const;
