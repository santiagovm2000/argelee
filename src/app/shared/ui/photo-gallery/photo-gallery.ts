import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import type { ProductPhotos } from '../../../core/catalog/catalog.model';
import { T } from '../../../core/i18n/translation-keys.generated';
import { IMAGE_SIZES } from '../../../core/images/image.constants';
import { srcsetFor } from '../../../core/images/image.loader';
import { photoImage } from '../../../core/images/photo';
import { PhotoStrip } from '../../directives/photo-strip';

/**
 * A piece's photos in one frame: a strip that snaps from photo to photo under
 * a swipe, a trackpad or the arrow keys, with round thumbnails under it that
 * show which one is in view and bring any other into it. One photo is just
 * the frame.
 */
@Component({
  selector: 'arg-photo-gallery',
  imports: [NgOptimizedImage, TranslocoDirective, PhotoStrip],
  templateUrl: './photo-gallery.html',
  host: { class: 'block' },
})
export class PhotoGallery {
  readonly photos = input.required<ProductPhotos>();
  /** The piece's name, which every photo's alternative text starts with. */
  readonly name = input.required<string>();
  /** The piece id when this frame is the one the menu card morphs into. */
  readonly piece = input<string | null>(null);

  protected readonly t = T;
  protected readonly sizes = IMAGE_SIZES.product;
  protected readonly thumbnailSizes = IMAGE_SIZES.thumbnail;
  protected readonly slides = computed(() =>
    this.photos().map((photo) => {
      const image = photoImage(photo);
      return { image, srcset: srcsetFor(image) };
    }),
  );
  protected readonly keys = computed(() => this.photos().map((photo) => photo.key));
  protected readonly count = computed(() => this.slides().length);
}
