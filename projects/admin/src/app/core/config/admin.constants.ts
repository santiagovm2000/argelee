export const ADMIN_ROUTES = {
  login: 'login',
  product: 'pieza',
  newProduct: 'nueva',
  productIdParam: 'id',
} as const;

export const PHOTO_MAX_EDGE = 2560;
export const PHOTO_JPEG_QUALITY = 0.85;
export const PHOTO_PLACEHOLDER_WIDTH = 20;
export const PHOTO_PLACEHOLDER_QUALITY = 0.4;
export const PHOTO_EXTENSION = '.jpg';
export const PHOTO_MIME_TYPE = 'image/jpeg';
export const PLACEHOLDER_MIME_TYPE = 'image/webp';
export const ACCEPTED_PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

export const DEFAULT_SERVES: readonly [from: number, to: number] = [16, 20];
export const DEFAULT_PRICE = 30;
export const DEFAULT_MARGIN_PERCENT = 100;
