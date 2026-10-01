import { describe, expect, it } from 'vitest';
import { MAX_PHOTOS_PER_PIECE } from '@core/catalog/catalog.constants';
import type { ProductPhoto } from '@core/catalog/catalog.model';
import { photoRoom, withCover, withoutPhoto, withPhotos } from '@core/catalog/gallery';
import { FIXTURE_PLACEHOLDER } from '../../fixtures/catalog.fixture';

const photo = (name: string): ProductPhoto => ({
  key: `photos/${name}.jpg`,
  width: 1200,
  height: 900,
  placeholder: FIXTURE_PLACEHOLDER,
});

const keysOf = (photos: readonly ProductPhoto[]): readonly string[] =>
  photos.map((item) => item.key);

const gallery = [photo('cover'), photo('side'), photo('slice')];

describe('withPhotos', () => {
  it('adds new photos after the ones already there, so the cover stays', () => {
    expect(keysOf(withPhotos(gallery, [photo('top')]))).toEqual([
      'photos/cover.jpg',
      'photos/side.jpg',
      'photos/slice.jpg',
      'photos/top.jpg',
    ]);
  });

  it('makes the first photo of an empty piece its cover', () => {
    expect(keysOf(withPhotos([], [photo('first'), photo('second')]))).toEqual([
      'photos/first.jpg',
      'photos/second.jpg',
    ]);
  });

  it('skips a photo the piece already has, or one picked twice', () => {
    expect(keysOf(withPhotos(gallery, [photo('side'), photo('top'), photo('top')]))).toEqual([
      'photos/cover.jpg',
      'photos/side.jpg',
      'photos/slice.jpg',
      'photos/top.jpg',
    ]);
  });

  it('stops at the cap', () => {
    const many = Array.from({ length: MAX_PHOTOS_PER_PIECE + 3 }, (_, index) =>
      photo(`view-${index}`),
    );
    expect(withPhotos(gallery, many)).toHaveLength(MAX_PHOTOS_PER_PIECE);
    expect(photoRoom(withPhotos(gallery, many))).toBe(0);
    expect(photoRoom(gallery)).toBe(MAX_PHOTOS_PER_PIECE - gallery.length);
  });
});

describe('withoutPhoto', () => {
  it('hands the cover to the next photo when the cover goes', () => {
    expect(keysOf(withoutPhoto(gallery, 'photos/cover.jpg'))).toEqual([
      'photos/side.jpg',
      'photos/slice.jpg',
    ]);
  });
});

describe('withCover', () => {
  it('moves the chosen photo to the front and keeps the others in order', () => {
    expect(keysOf(withCover(gallery, 'photos/slice.jpg'))).toEqual([
      'photos/slice.jpg',
      'photos/cover.jpg',
      'photos/side.jpg',
    ]);
  });

  it('leaves the gallery alone for the cover itself or a photo it does not have', () => {
    expect(withCover(gallery, 'photos/cover.jpg')).toEqual(gallery);
    expect(withCover(gallery, 'photos/missing.jpg')).toBe(gallery);
  });
});
