import { PHOTO_KEY_PREFIX } from '../catalog/catalog.constants';
import type { ProductPhoto } from '../catalog/catalog.model';
import { DEPLOYMENT } from '../config/build-config.generated';
import { OG_IMAGE_SIZE } from '../seo/seo.constants';
import type { ResponsiveImage } from './image-manifest.generated';
import {
  IMAGE_TRANSFORM_PATH,
  IMAGE_WIDTHS,
  PHOTO_QUALITY,
  PHOTO_SOCIAL_QUALITY,
} from './image.constants';

// Photos uploaded through the admin panel are not in the build-time manifest:
// they are R2 objects the Worker serves at their key, and Cloudflare derives
// the sizes on the fly. These helpers make one look like a manifest image so
// cards and pages render both the same way.

export function isPhotoPath(path: string): boolean {
  return path.startsWith(PHOTO_KEY_PREFIX);
}

/** The derivative URL for a width, or the original when transformations are off. */
export function photoUrl(key: string, width: number | undefined, transforms: boolean): string {
  if (!transforms || width === undefined) return key;
  const options = `width=${width},quality=${PHOTO_QUALITY},format=auto,fit=scale-down`;
  return `${IMAGE_TRANSFORM_PATH}/${options}/${key}`;
}

/** The JPEG at Open Graph size link previews expect; WhatsApp and Facebook render no AVIF. */
export function photoSocialUrl(key: string, transforms: boolean): string {
  if (!transforms) return key;
  const options = `width=${OG_IMAGE_SIZE.width},height=${OG_IMAGE_SIZE.height},quality=${PHOTO_SOCIAL_QUALITY},format=jpeg,fit=cover`;
  return `${IMAGE_TRANSFORM_PATH}/${options}/${key}`;
}

/** Presents an uploaded photo as a responsive image: only the widths the original can fill. */
export function photoImage(
  photo: ProductPhoto,
  transforms: boolean = DEPLOYMENT.imageTransforms,
): ResponsiveImage {
  const widths = IMAGE_WIDTHS.filter((width) => width <= photo.width);
  return {
    path: photo.key,
    social: photoSocialUrl(photo.key, transforms),
    width: photo.width,
    height: photo.height,
    widths: widths.length > 0 ? widths : [photo.width],
    placeholder: photo.placeholder,
  };
}
