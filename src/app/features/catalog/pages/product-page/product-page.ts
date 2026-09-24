import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  CURRENCY_CODE,
  MIN_UNIT_QUANTITY,
  SINGLE_UNIT,
} from '../../../../core/catalog/catalog.constants';
import type {
  FlavourId,
  FruitId,
  Product,
  ProductText,
} from '../../../../core/catalog/catalog.model';
import type { LeadItem } from '../../../../core/analytics/analytics.service';
import { CatalogService } from '../../../../core/catalog/catalog.service';
import { localizedText } from '../../../../core/catalog/localized-text';
import { OrderService } from '../../../../core/catalog/order.service';
import { defaultQuantity, formatPrice, listedPrice, quote } from '../../../../core/catalog/pricing';
import { productSegments, SECTION_IDS } from '../../../../core/config/routes';
import { IMAGE_SIZES } from '../../../../core/images/image.constants';
import { srcsetFor } from '../../../../core/images/image.loader';
import { photoImage } from '../../../../core/images/photo';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { SeoService } from '../../../../core/seo/seo.service';
import { Lead } from '../../../../shared/directives/lead';
import { ChoiceList, type ChoiceOption } from '../../../../shared/ui/choice-list/choice-list';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { choiceIconUrl } from '../../../../shared/ui/icons/icons';
import { QuantityInput } from '../../../../shared/ui/quantity-input/quantity-input';

const QUANTITY_FIELD_NAME = 'quantity';

// What the template reads while no piece matches the id; the empty state shows instead.
const NO_TEXT: ProductText = { name: '', note: '', description: '' };

@Component({
  selector: 'arg-product-page',
  imports: [
    NgOptimizedImage,
    RouterLink,
    TranslocoDirective,
    ChoiceList,
    EmptyState,
    QuantityInput,
    Lead,
  ],
  templateUrl: './product-page.html',
})
export class ProductPage {
  readonly id = input.required<string>();

  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly order = inject(OrderService);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(LanguageService);

  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  protected readonly sizes = IMAGE_SIZES.product;
  protected readonly quantityName = QUANTITY_FIELD_NAME;

  protected readonly product = computed(() => this.catalog.find(this.id()));
  protected readonly text = computed(() => {
    const product = this.product();
    return product === null ? NO_TEXT : localizedText(product.text, this.language.current());
  });
  protected readonly image = computed(() => {
    const product = this.product();
    return product === null ? null : photoImage(product.photo);
  });
  protected readonly srcset = computed(() => {
    const image = this.image();
    return image === null ? '' : srcsetFor(image);
  });

  // Resets to what the piece opens at whenever the piece changes: one whole piece, or the usual number of units.
  protected readonly quantity = linkedSignal<Product | null, number>({
    source: this.product,
    computation: (product) => (product === null ? SINGLE_UNIT : defaultQuantity(product)),
  });

  protected readonly total = computed(() => {
    const product = this.product();
    if (product === null) return '';
    return formatPrice(quote(product, this.quantity()), this.language.current());
  });

  protected readonly orderUrl = computed(() => {
    const product = this.product();
    return product === null ? '' : this.order.orderUrl(product, this.quantity());
  });

  /** What the order button reports to analytics: the piece and the price it shows. */
  protected readonly leadItem = computed((): LeadItem | null => {
    const product = this.product();
    if (product === null) return null;
    return { id: product.id, price: quote(product, this.quantity()) };
  });

  /** "Para 16 a 20 personas" for a whole piece; empty for a piece sold by the unit. */
  protected readonly servesText = computed(() => {
    const serves = this.product()?.serves ?? null;
    if (serves === null) return '';
    return this.translate(T.catalog.customizer.serves, { from: serves[0], to: serves[1] });
  });

  /** "Precio por unidad: $3,50 · mínimo 5", beside the quantity field. */
  protected readonly unitHint = computed(() => {
    const product = this.product();
    return product === null
      ? ''
      : this.translate(T.catalog.hints.quantity, {
          price: this.money(product.price),
          min: MIN_UNIT_QUANTITY,
        });
  });

  protected readonly flavourOptions = computed<readonly ChoiceOption<FlavourId>[]>(() =>
    (this.product()?.flavours ?? []).map((id) => ({
      id,
      label: this.translate(T.catalog.flavours[id]),
      icon: choiceIconUrl(id),
    })),
  );

  protected readonly fruitOptions = computed<readonly ChoiceOption<FruitId>[]>(() =>
    (this.product()?.fruits ?? []).map((id) => ({
      id,
      label: this.translate(T.catalog.fruits[id]),
      icon: choiceIconUrl(id),
    })),
  );

  constructor() {
    effect(() => {
      const product = this.product();
      if (product === null) return;
      untracked(() => {
        this.catalog.focus.set(product.id);
        this.applySeo(product);
      });
    });
  }

  protected setQuantity(quantity: number): void {
    this.quantity.set(quantity);
  }

  private applySeo(product: Product): void {
    const { name, description } = localizedText(product.text, this.language.current());
    this.seo.apply({
      titleKey: T.meta.product.title,
      descriptionKey: T.meta.product.description,
      params: { name, description },
      segments: productSegments(product.id),
      image: photoImage(product.photo).social,
      product: { name, description, lowPrice: listedPrice(product), currency: CURRENCY_CODE },
    });
  }

  private money(amount: number): string {
    return formatPrice(amount, this.language.current());
  }

  private translate(key: string, params?: Record<string, string | number>): string {
    return this.transloco.translate(key, params);
  }
}
