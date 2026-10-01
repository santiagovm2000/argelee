import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import type { Product, ProductId } from '../../../core/catalog/catalog.model';
import { localizedText } from '../../../core/catalog/localized-text';
import { LanguageService } from '../../../core/i18n/language.service';
import { T } from '../../../core/i18n/translation-keys.generated';
import { IMAGE_SIZES } from '../../../core/images/image.constants';
import { srcsetFor } from '../../../core/images/image.loader';
import { photoImage } from '../../../core/images/photo';
import { PhotoStrip } from '../../directives/photo-strip';
import { PriceSticker } from '../price-sticker/price-sticker';

/**
 * One piece of the menu: its photos, its price label, its name and a note. The
 * photos sit in a strip a swipe or a trackpad pages through, with dots for
 * where it is and, under a mouse, arrows; a tap on a photo, or anywhere else on
 * the card, opens the piece. Paging is a pointer convenience — the piece's page
 * shows the same photos to everyone — so the strip's links and arrows stay out
 * of the tab order and of what a screen reader reads, and the name is the
 * card's one link for both.
 */
@Component({
  selector: 'arg-product-card',
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, PhotoStrip, PriceSticker],
  templateUrl: './product-card.html',
  host: { class: 'block w-card shrink-0 md:w-auto' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly link = input.required<string>();
  readonly price = input.required<string>();
  /** True for the piece whose photo morphs into, or back from, the product page. */
  readonly featured = input<boolean>(false);
  readonly chosen = output<ProductId>();

  private readonly language = inject(LanguageService);

  protected readonly t = T;
  protected readonly sizes = IMAGE_SIZES.card;
  protected readonly text = computed(() =>
    localizedText(this.product().text, this.language.current()),
  );
  protected readonly slides = computed(() =>
    this.product().photos.map((photo) => {
      const image = photoImage(photo);
      return { image, srcset: srcsetFor(image) };
    }),
  );
  protected readonly keys = computed(() => this.product().photos.map((photo) => photo.key));
  protected readonly piece = computed(() => (this.featured() ? this.product().id : null));
  protected readonly byUnit = computed(() => this.product().serves === null);

  protected choose(): void {
    this.chosen.emit(this.product().id);
  }
}
