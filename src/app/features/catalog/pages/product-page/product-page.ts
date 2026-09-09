import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CURRENCY_CODE, MIN_UNIT_QUANTITY } from '../../../../core/catalog/catalog.constants';
import type {
  ChoiceLimits,
  FlavourId,
  FruitId,
  Product,
  Selection,
} from '../../../../core/catalog/catalog.model';
import { CatalogService } from '../../../../core/catalog/catalog.service';
import { OrderService } from '../../../../core/catalog/order.service';
import { formatPrice, listedPrice, quote } from '../../../../core/catalog/pricing';
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
import { choiceIconUrl } from '../../../../shared/ui/icons/icons';
import { QuantityInput } from '../../../../shared/ui/quantity-input/quantity-input';

// Native controls need a shared name per group.
const GROUP_NAMES = {
  quantity: 'quantity',
  flavours: 'flavours',
  fruits: 'fruits',
} as const;

// A group with no options to pick from, so the template can bind before a piece resolves.
const NO_LIMITS: ChoiceLimits = { min: 0, max: null };

@Component({
  selector: 'arg-product-page',
  imports: [
    NgOptimizedImage,
    RouterLink,
    TranslocoDirective,
    ChoiceGroup,
    EmptyState,
    QuantityInput,
  ],
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

  protected readonly flavourLimits = computed<ChoiceLimits>(
    () => this.product()?.flavours ?? NO_LIMITS,
  );
  protected readonly flavourLegend = computed(() =>
    this.translate(
      this.flavourLimits().max === 1 ? T.catalog.groups.flavour : T.catalog.groups.flavours,
    ),
  );
  protected readonly flavourHint = computed(() =>
    this.limitsHint(this.flavourLimits(), this.selection()?.flavours.length ?? 0),
  );
  protected readonly flavourOptions = computed<readonly ChoiceOption<FlavourId>[]>(() =>
    (this.product()?.flavours?.options ?? []).map((id) => ({
      id,
      label: this.translate(T.catalog.flavours[id]),
      icon: choiceIconUrl(id),
    })),
  );

  protected readonly fruitLimits = computed<ChoiceLimits>(
    () => this.product()?.fruits ?? NO_LIMITS,
  );
  protected readonly fruitHint = computed(() =>
    this.limitsHint(this.fruitLimits(), this.selection()?.fruits.length ?? 0),
  );
  protected readonly fruitOptions = computed<readonly ChoiceOption<FruitId>[]>(() =>
    (this.product()?.fruits?.options ?? []).map((id) => ({
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
    this.selection.update((current) => (current === null ? current : { ...current, quantity }));
  }

  protected setFlavours(flavours: readonly FlavourId[]): void {
    this.selection.update((current) => (current === null ? current : { ...current, flavours }));
  }

  protected setFruits(fruits: readonly FruitId[]): void {
    this.selection.update((current) => (current === null ? current : { ...current, fruits }));
  }

  /** What a group asks for: one, a running tally against its maximum, or any number. */
  private limitsHint(limits: ChoiceLimits, count: number): string {
    if (limits.max === 1) return this.translate(T.catalog.hints.pickOne);
    if (limits.max === null) return this.translate(T.catalog.hints.pickAny);
    return this.translate(T.catalog.hints.tally, { count, max: limits.max });
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
        lowPrice: listedPrice(product),
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
