import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { MAX_PHOTOS_PER_PIECE, PRICE_STEP } from '@core/catalog/catalog.constants';
import { type MarginKind, validateCatalogDocument } from '@core/catalog/catalog.document';
import type { FlavourId, FruitId, ProductPhoto } from '@core/catalog/catalog.model';
import { effectiveMargin, marginFor, suggestedPrice } from '@core/catalog/costing';
import { photoRoom, withCover, withoutPhoto, withPhotos } from '@core/catalog/gallery';
import { formatPrice } from '@core/catalog/pricing';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { AdminCatalogService } from '../../../core/catalog/admin-catalog.service';
import { FLAVOUR_CHOICES, FRUIT_CHOICES } from '../../../core/catalog/choice-labels';
import { PhotoUploadService } from '../../../core/catalog/photo-upload.service';
import {
  emptyDraft,
  type OptionDraft,
  type ProductDraft,
  toDraft,
  toStoredProduct,
} from '../../../core/catalog/product-draft';
import { ACCEPTED_PHOTO_TYPES } from '../../../core/config/admin.constants';
import { T } from '../../../core/i18n/translation-keys.generated';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { AmountInput } from '../../../shared/ui/amount-input/amount-input';
import { OptionGroupEditor } from '../option-group-editor/option-group-editor';

/** Which of the two figures the final price follows while cost and margin change. */
type PriceChoice = 'exact' | 'suggested';

/** How far a batch of photos has got: the one on its way, out of how many. */
interface UploadProgress {
  readonly current: number;
  readonly total: number;
}

/** Why some of the photos picked did not make it into the gallery. */
type UploadProblem = 'failed' | 'full';

const ACCEPTED_TYPES: readonly string[] = ACCEPTED_PHOTO_TYPES.split(',');

/** One piece, edited whole: texts, photo, size, choices, price and visibility, saved in one go. */
@Component({
  selector: 'arg-product-page',
  imports: [
    TranslocoDirective,
    RouterLink,
    FormField,
    NgOptimizedImage,
    OptionGroupEditor,
    AmountInput,
  ],
  templateUrl: './product-page.html',
  host: { class: 'block' },
})
export class ProductPage {
  readonly id = input<string>();

  private readonly catalog = inject(AdminCatalogService);
  private readonly uploads = inject(PhotoUploadService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly coverButtons = viewChildren<ElementRef<HTMLButtonElement>>('coverButton');
  private readonly removeButtons = viewChildren<ElementRef<HTMLButtonElement>>('removeButton');
  private readonly addInput = viewChild<ElementRef<HTMLInputElement>>('addInput');

  protected readonly t = T;
  protected readonly flavourChoices = FLAVOUR_CHOICES;
  protected readonly fruitChoices = FRUIT_CHOICES;
  protected readonly acceptedPhotoTypes = ACCEPTED_PHOTO_TYPES;
  protected readonly maxPhotos = MAX_PHOTOS_PER_PIECE;

  protected readonly model = signal<ProductDraft>(emptyDraft());
  protected readonly f = form(this.model, (path) => {
    required(path.es.name);
    required(path.es.note);
    required(path.es.description);
    min(path.cost, 0);
    min(path.marginValue, 0);
    min(path.price, PRICE_STEP);
    min(path.servesFrom, 1);
    min(path.servesTo, 1);
  });

  protected readonly isNew = computed(() => this.id() === undefined);
  protected readonly missing = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploading = signal<UploadProgress | null>(null);
  protected readonly uploadProblem = signal<UploadProblem | null>(null);
  protected readonly dragging = signal(false);
  protected readonly room = computed(() => photoRoom(this.model().photos));
  protected readonly errors = signal<readonly string[]>([]);

  protected readonly priceStep = PRICE_STEP;
  private readonly priceFollows = signal<PriceChoice>('suggested');
  protected readonly suggestion = computed(() => {
    const draft = this.model();
    return suggestedPrice(draft.cost, { kind: draft.marginKind, value: draft.marginValue });
  });
  protected readonly priceChoice = computed<PriceChoice | null>(() => {
    const { exact, suggested } = this.suggestion();
    const price = this.model().price;
    if (price === suggested) return 'suggested';
    if (price === exact) return 'exact';
    return null;
  });
  protected readonly exactText = computed(() => this.money(this.suggestion().exact));
  protected readonly suggestedText = computed(() => this.money(this.suggestion().suggested));
  protected readonly effectiveText = computed(() => {
    const draft = this.model();
    return this.transloco.translate(T.product.pricing.effective, {
      amount: this.money(effectiveMargin(draft.cost, draft.price).amount),
    });
  });

  private populated = false;

  constructor() {
    effect(() => {
      const id = this.id();
      const loaded = this.catalog.loaded();
      untracked(() => {
        if (!loaded) {
          void this.catalog.load();
          return;
        }
        this.populate(id);
      });
    });
  }

  protected setFlavours(flavours: OptionDraft<FlavourId>): void {
    this.model.update((draft) => ({ ...draft, flavours }));
  }

  protected setFruits(fruits: OptionDraft<FruitId>): void {
    this.model.update((draft) => ({ ...draft, fruits }));
  }

  protected setCost(cost: number): void {
    this.recalculate((draft) => ({ ...draft, cost }));
  }

  protected setMarginValue(marginValue: number): void {
    this.recalculate((draft) => ({ ...draft, marginValue }));
  }

  /** Switching between a share and a flat amount keeps the same figure, only expressed the other way. */
  protected setMarginKind(marginKind: MarginKind): void {
    this.recalculate((draft) => {
      const { raw } = suggestedPrice(draft.cost, {
        kind: draft.marginKind,
        value: draft.marginValue,
      });
      return { ...draft, marginKind, marginValue: marginFor(draft.cost, raw, marginKind) };
    });
  }

  protected choosePrice(choice: PriceChoice): void {
    this.priceFollows.set(choice);
    this.recalculate((draft) => draft);
  }

  /** A price typed by hand wins: the margin is worked back from it so the figures stay consistent. */
  protected setPrice(price: number): void {
    if (this.model().pricingMode !== 'calculated') {
      this.model.update((draft) => ({ ...draft, price }));
      return;
    }
    this.priceFollows.set('exact');
    this.model.update((draft) => ({
      ...draft,
      price,
      marginValue: marginFor(draft.cost, price, draft.marginKind),
    }));
  }

  protected setServes(field: 'servesFrom' | 'servesTo', value: number): void {
    this.model.update((draft) => ({ ...draft, [field]: value }));
  }

  protected pickPhotos(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    void this.addPhotos(files);
  }

  /** Lets photos dragged from the computer land on the add tile. */
  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected dropPhotos(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.addPhotos([...(event.dataTransfer?.files ?? [])]);
  }

  /** The star: the photo moves to the front of the gallery, which makes it the cover. */
  protected makeCover(photo: ProductPhoto): void {
    this.model.update((draft) => ({ ...draft, photos: withCover(draft.photos, photo.key) }));
    afterNextRender(() => this.coverButtons()[0]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  /** Asks first, because a photo taken out has to be uploaded again to come back. */
  protected async removePhoto(photo: ProductPhoto, index: number): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: T.product.photo.confirmRemoveTitle,
      bodyKey: T.product.photo.confirmRemoveBody,
      confirmKey: T.product.photo.confirmRemove,
      danger: true,
    });
    if (!confirmed) return;
    this.model.update((draft) => ({ ...draft, photos: withoutPhoto(draft.photos, photo.key) }));
    afterNextRender(
      () => {
        const buttons = this.removeButtons();
        const next = buttons[Math.min(index, buttons.length - 1)];
        (next ?? this.addInput())?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) return;
    this.f().markAsTouched();
    if (!this.f().valid()) {
      this.errors.set([this.transloco.translate(T.product.errors.required)]);
      return;
    }
    const document = this.catalog.document();
    if (document === null) return;

    const draft = this.model();
    const id = draft.id;
    const product = toStoredProduct(draft);
    const products = document.products.some((candidate) => candidate.id === id)
      ? document.products.map((candidate) => (candidate.id === id ? product : candidate))
      : [...document.products, product];
    const check = validateCatalogDocument({ ...document, products });
    if (!check.ok) {
      this.errors.set(check.errors);
      return;
    }

    this.errors.set([]);
    this.saving.set(true);
    this.catalog.upsert(product);
    const outcome = await this.catalog.save();
    this.saving.set(false);
    if (outcome.kind === 'saved') {
      await this.router.navigate(['/']);
      return;
    }
    this.errors.set(
      outcome.kind === 'invalid'
        ? outcome.errors
        : [
            this.transloco.translate(
              outcome.kind === 'conflict' ? T.save.conflict : T.save.offline,
            ),
          ],
    );
  }

  /**
   * Prepares and uploads the photos one after another, adding each to the
   * gallery as soon as it is stored; whatever does not fit or fails is reported
   * without losing the ones that made it.
   */
  private async addPhotos(files: readonly File[]): Promise<void> {
    if (this.uploading() !== null) return;
    const photos = files.filter((file) => ACCEPTED_TYPES.includes(file.type));
    const picked = photos.slice(0, this.room());
    this.uploadProblem.set(picked.length < photos.length ? 'full' : null);
    let failed = false;
    for (const [index, file] of picked.entries()) {
      this.uploading.set({ current: index + 1, total: picked.length });
      try {
        const photo = await this.uploads.upload(await this.uploads.prepare(file));
        this.model.update((draft) => ({ ...draft, photos: withPhotos(draft.photos, [photo]) }));
      } catch {
        failed = true;
      }
    }
    this.uploading.set(null);
    if (failed) this.uploadProblem.set('failed');
  }

  private populate(id: string | undefined): void {
    if (this.populated) return;
    if (id === undefined) {
      this.populated = true;
      return;
    }
    const product = this.catalog.find(id);
    if (product === null) {
      this.missing.set(true);
      return;
    }
    this.model.set(toDraft(product));
    this.priceFollows.set(this.priceChoice() ?? 'exact');
    this.populated = true;
  }

  /** Applies a change to the figures and moves the price with them, to whichever figure the owner chose. */
  private recalculate(change: (draft: ProductDraft) => ProductDraft): void {
    this.model.update((draft) => {
      const next = change(draft);
      const { exact, suggested } = suggestedPrice(next.cost, {
        kind: next.marginKind,
        value: next.marginValue,
      });
      return { ...next, price: this.priceFollows() === 'suggested' ? suggested : exact };
    });
  }

  private money(amount: number): string {
    return formatPrice(amount, DEFAULT_LANGUAGE);
  }
}
