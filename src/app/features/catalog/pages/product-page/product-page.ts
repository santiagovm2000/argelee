import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  CURRENCY_CODE,
  EXTRA_FRUIT_PRICE,
  EXTRA_LAYER_PRICE,
  PORTION_SIZES,
} from '../../../../core/catalog/catalog.constants';
import type { FruitId, LayerId, Product, Selection } from '../../../../core/catalog/catalog.model';
import { CatalogService } from '../../../../core/catalog/catalog.service';
import { OrderService } from '../../../../core/catalog/order.service';
import { formatPrice, quote, startingPrice } from '../../../../core/catalog/pricing';
import { defaultSelection } from '../../../../core/catalog/selection';
import { productSegments, SECTION_IDS } from '../../../../core/config/routes';
import { IMAGES } from '../../../../core/images/image-manifest.generated';
import { IMAGE_SIZES } from '../../../../core/images/image.constants';
import { srcsetFor } from '../../../../core/images/image.loader';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { SeoService } from '../../../../core/seo/seo.service';
import { ChoiceGroup, type ChoiceOption } from '../../../../shared/ui/choice-group/choice-group';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

// Native radio/checkbox groups need a shared name per group.
const GROUP_NAMES = {
  portions: 'portions',
  layers: 'layers',
  fruits: 'fruits',
} as const;

const SUMMARY_SEPARATOR = '  ·  ';
const LIST_SEPARATOR = ', ';

@Component({
  selector: 'arg-product-page',
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective, ChoiceGroup, EmptyState],
  templateUrl: './product-page.html',
})
export class ProductPage {
  readonly slug = input.required<string>();

  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly order = inject(OrderService);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(LanguageService);

  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  protected readonly sizes = IMAGE_SIZES.product;
  protected readonly names = GROUP_NAMES;

  protected readonly product = computed(() => this.catalog.find(this.slug()));
  protected readonly image = computed(() => {
    const product = this.product();
    return product === null ? null : IMAGES[product.image];
  });
  protected readonly srcset = computed(() => {
    const image = this.image();
    return image === null ? '' : srcsetFor(image);
  });

  // Resets to what the piece comes with whenever the piece changes.
  protected readonly selection = linkedSignal<Product | null, Selection | null>({
    source: this.product,
    computation: (product) => (product === null ? null : defaultSelection(product)),
  });

  protected readonly total = computed(() => {
    const product = this.product();
    const selection = this.selection();
    if (product === null || selection === null) return '';
    return formatPrice(quote(product, selection), this.language.current());
  });

  protected readonly orderUrl = computed(() => {
    const product = this.product();
    const selection = this.selection();
    return product === null || selection === null ? '' : this.order.orderUrl(product, selection);
  });

  protected readonly portionOptions = computed<readonly ChoiceOption<string>[]>(() =>
    (this.product()?.portions ?? []).map((size) => ({
      id: String(size),
      label: this.translate(T.catalog.portions[size]),
    })),
  );
  protected readonly portionSelected = computed<readonly string[]>(() => {
    const selection = this.selection();
    return selection === null ? [] : [String(selection.portions)];
  });

  protected readonly layerOptions = computed<readonly ChoiceOption<LayerId>[]>(() =>
    (this.product()?.layers?.options ?? []).map((id) => ({
      id,
      label: this.translate(T.catalog.layers[id]),
    })),
  );
  protected readonly layerHint = computed(() =>
    this.translate(T.catalog.hints.layers, { price: this.money(EXTRA_LAYER_PRICE) }),
  );

  protected readonly fruitOptions = computed<readonly ChoiceOption<FruitId>[]>(() =>
    (this.product()?.fruits?.options ?? []).map((id) => ({
      id,
      label: this.translate(T.catalog.fruits[id]),
    })),
  );
  protected readonly fruitHint = computed(() =>
    this.translate(T.catalog.hints.fruit, { price: this.money(EXTRA_FRUIT_PRICE) }),
  );

  /** "12 porciones · Fresa · Crema · con fresa, uva", the line under the price. */
  protected readonly summary = computed(() => {
    const selection = this.selection();
    if (selection === null) return '';
    const parts = [
      this.translate(T.catalog.customizer.summaryPortions, { count: selection.portions }),
      ...selection.layers.map((id) => this.translate(T.catalog.layers[id])),
    ];
    if (selection.fruits.length > 0) {
      const fruits = selection.fruits
        .map((id) => this.translate(T.catalog.fruits[id]).toLocaleLowerCase())
        .join(LIST_SEPARATOR);
      parts.push(this.translate(T.catalog.customizer.summaryFruit, { fruits }));
    }
    return parts.join(SUMMARY_SEPARATOR);
  });

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

  protected setPortions(ids: readonly string[]): void {
    const portions = PORTION_SIZES.find((size) => String(size) === ids[0]);
    if (portions === undefined) return;
    this.selection.update((current) => (current === null ? current : { ...current, portions }));
  }

  protected setLayers(layers: readonly LayerId[]): void {
    this.selection.update((current) => (current === null ? current : { ...current, layers }));
  }

  protected setFruits(fruits: readonly FruitId[]): void {
    this.selection.update((current) => (current === null ? current : { ...current, fruits }));
  }

  private applySeo(product: Product): void {
    const keys = T.catalog.products[product.id];
    this.seo.apply({
      titleKey: T.meta.product.title,
      descriptionKey: T.meta.product.description,
      paramKeys: { name: keys.name, description: keys.description },
      segments: productSegments(product.id),
      image: IMAGES[product.image].social,
      product: {
        nameKey: keys.name,
        descriptionKey: keys.description,
        lowPrice: startingPrice(product),
        currency: CURRENCY_CODE,
      },
    });
  }

  private money(amount: number): string {
    return formatPrice(amount, this.language.current());
  }

  private translate(key: string, params?: Record<string, string | number>): string {
    return this.transloco.translate(key, params);
  }
}
