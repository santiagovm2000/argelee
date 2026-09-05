import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import type { Product, ProductId } from '../../../core/catalog/catalog.model';
import { IMAGES } from '../../../core/images/image-manifest.generated';
import { IMAGE_SIZES } from '../../../core/images/image.constants';
import { srcsetFor } from '../../../core/images/image.loader';
import { T } from '../../../core/i18n/translation-keys.generated';

/** One piece on the shelf: the photo, its name, a note and the starting price. */
@Component({
  selector: 'arg-product-card',
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective],
  templateUrl: './product-card.html',
  host: { class: 'block w-card shrink-0' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly link = input.required<string>();
  readonly price = input.required<string>();
  /** True for the piece whose photo morphs into, or back from, the product page. */
  readonly featured = input<boolean>(false);
  readonly chosen = output<ProductId>();

  protected readonly t = T;
  protected readonly sizes = IMAGE_SIZES.card;
  protected readonly image = computed(() => IMAGES[this.product().image]);
  protected readonly srcset = computed(() => srcsetFor(this.image()));
  protected readonly piece = computed(() => (this.featured() ? this.product().id : null));
}
