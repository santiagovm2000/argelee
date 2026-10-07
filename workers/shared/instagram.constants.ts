// What the panel and the admin Worker agree on about a publication sent to
// Instagram: the only image format it takes and the limits it sets on a
// carousel and its caption.
export const SLIDE_MIME_TYPE = 'image/jpeg';
export const SLIDE_EXTENSION = '.jpg';
export const CAROUSEL_SLIDES = { min: 2, max: 10 } as const;
export const CAPTION_MAX_LENGTH = 2200;
export const CAPTION_MAX_HASHTAGS = 5;
