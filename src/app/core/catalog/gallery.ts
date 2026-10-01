import { MAX_PHOTOS_PER_PIECE } from './catalog.constants';
import type { ProductPhoto } from './catalog.model';

// A piece's photos in gallery order, the first being its cover. The panel edits
// the list only through these, so it never passes the cap, never holds the same
// photo twice, and the cover is always simply the first.

/** How many more photos the piece can take. */
export function photoRoom(photos: readonly ProductPhoto[]): number {
  return Math.max(0, MAX_PHOTOS_PER_PIECE - photos.length);
}

/** Appends new photos after the ones already there, skipping repeats and whatever passes the cap. */
export function withPhotos(
  photos: readonly ProductPhoto[],
  added: readonly ProductPhoto[],
): readonly ProductPhoto[] {
  const keys = new Set(photos.map((photo) => photo.key));
  const fresh = added.filter((photo) => {
    if (keys.has(photo.key)) return false;
    keys.add(photo.key);
    return true;
  });
  return [...photos, ...fresh].slice(0, MAX_PHOTOS_PER_PIECE);
}

/** Drops a photo; when it was the cover, the next one becomes the cover. */
export function withoutPhoto(
  photos: readonly ProductPhoto[],
  key: string,
): readonly ProductPhoto[] {
  return photos.filter((photo) => photo.key !== key);
}

/** Moves a photo to the front, which makes it the cover; the rest keep their order. */
export function withCover(photos: readonly ProductPhoto[], key: string): readonly ProductPhoto[] {
  const cover = photos.find((photo) => photo.key === key);
  return cover === undefined ? photos : [cover, ...withoutPhoto(photos, key)];
}
