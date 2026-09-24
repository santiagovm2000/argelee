import { CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import type { StoredProduct } from '@core/catalog/catalog.document';
import { CATALOG_PDF_PUBLIC_PATH } from '@core/catalog/catalog.constants';
import { localizedText } from '@core/catalog/localized-text';
import { formatPrice } from '@core/catalog/pricing';
import { DEPLOYMENT } from '@core/config/build-config.generated';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { AdminCatalogService, type SaveOutcome } from '../../../core/catalog/admin-catalog.service';
import { PdfService } from '../../../core/catalog/pdf.service';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ADMIN_ROUTES } from '../../../core/config/admin.constants';
import { T, type TranslationKey } from '../../../core/i18n/translation-keys.generated';

interface Row {
  readonly position: number;
  readonly product: StoredProduct;
  readonly name: string;
  readonly note: string;
  readonly price: string;
  readonly serves: string;
  readonly editLink: readonly string[];
}

interface SaveError {
  readonly key: TranslationKey;
  readonly details: readonly string[];
}

type BarTone = 'neutral' | 'ok' | 'warn' | 'error';
type BarAction = 'save' | 'pdf' | 'reload' | null;

/** One message and one next step at a time: the bar walks the owner from editing to a fresh PDF. */
interface BarState {
  readonly key: TranslationKey;
  readonly tone: BarTone;
  readonly details: readonly string[];
  readonly primary: BarAction;
  readonly busy: boolean;
  readonly discardable: boolean;
  readonly openable: boolean;
}

const IDLE: Pick<BarState, 'details' | 'busy' | 'discardable' | 'openable'> = {
  details: [],
  busy: false,
  discardable: false,
  openable: false,
};

/** Lower-case and accent-free, so "melocoton" finds "Melocotón". */
function searchable(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const TOUCH_DRAG_DELAY_MS = 150;

/** The shelf as a list: order, visibility and price at a glance, with the save bar under it. */
@Component({
  selector: 'arg-catalog-page',
  imports: [TranslocoDirective, RouterLink, NgOptimizedImage, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './catalog-page.html',
  host: { class: 'block' },
})
export class CatalogPage {
  protected readonly catalog = inject(AdminCatalogService);
  protected readonly pdf = inject(PdfService);
  private readonly confirm = inject(ConfirmService);
  private readonly transloco = inject(TranslocoService);

  protected readonly t = T;
  protected readonly newLink = ['/', ADMIN_ROUTES.product, ADMIN_ROUTES.newProduct];
  protected readonly pdfUrl = `${DEPLOYMENT.origin}${CATALOG_PDF_PUBLIC_PATH}`;
  private readonly saveError = signal<SaveError | null>(null);
  private readonly justSaved = signal(false);

  protected readonly rows = computed<readonly Row[]>(() =>
    this.catalog.products().map((product, index) => {
      const text = localizedText(product.text, DEFAULT_LANGUAGE);
      return {
        position: index + 1,
        product,
        name: text.name,
        note: text.note,
        price: formatPrice(product.pricing.price, DEFAULT_LANGUAGE),
        serves:
          product.serves === null
            ? this.transloco.translate(T.catalog.perUnit)
            : this.transloco.translate(T.catalog.serves, {
                from: product.serves[0],
                to: product.serves[1],
              }),
        editLink: ['/', ADMIN_ROUTES.product, product.id],
      };
    }),
  );
  protected readonly query = signal('');
  protected readonly visibleRows = computed(() => {
    const needle = searchable(this.query());
    return needle === ''
      ? this.rows()
      : this.rows().filter((row) => searchable(row.name).includes(needle));
  });
  protected readonly publishedCount = computed(
    () => this.catalog.products().filter((product) => product.published).length,
  );
  protected readonly bar = computed<BarState>(() => {
    if (this.catalog.saving()) {
      return { ...IDLE, key: T.save.saving, tone: 'neutral', primary: 'save', busy: true };
    }
    const error = this.saveError();
    if (error !== null) {
      const conflict = error.key === T.save.conflict;
      return {
        ...IDLE,
        key: error.key,
        details: error.details,
        tone: 'error',
        primary: conflict ? 'reload' : 'save',
        discardable: !conflict,
      };
    }
    if (this.catalog.dirty()) {
      return { ...IDLE, key: T.save.dirty, tone: 'neutral', primary: 'save', discardable: true };
    }
    if (this.pdf.generating()) {
      return { ...IDLE, key: T.pdf.generating, tone: 'neutral', primary: 'pdf', busy: true };
    }
    if (this.pdf.failed()) return { ...IDLE, key: T.pdf.failed, tone: 'error', primary: 'pdf' };
    switch (this.catalog.pdfState()) {
      case 'missing':
        return { ...IDLE, key: T.pdf.missing, tone: 'warn', primary: 'pdf' };
      case 'stale':
        return {
          ...IDLE,
          key: this.justSaved() ? T.pdf.staleAfterSave : T.pdf.stale,
          tone: 'warn',
          primary: 'pdf',
        };
      case 'current':
        return { ...IDLE, key: T.pdf.current, tone: 'ok', primary: null, openable: true };
    }
  });

  constructor() {
    if (!this.catalog.loaded()) void this.catalog.load();
  }

  protected search(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.query.set(event.target.value);
  }

  protected isFirst(row: Row): boolean {
    return this.rows()[0] === row;
  }

  protected isLast(row: Row): boolean {
    return this.rows().at(-1) === row;
  }

  protected togglePublished(row: Row): void {
    this.catalog.setPublished(row.product.id, !row.product.published);
  }

  protected readonly dragDelay = { touch: TOUCH_DRAG_DELAY_MS, mouse: 0 };

  protected drop(event: CdkDragDrop<readonly Row[]>): void {
    this.catalog.reorder(event.previousIndex, event.currentIndex);
  }

  /** Arrow keys on the handle move the piece one place, for anyone who cannot drag. */
  protected move(row: Row, direction: -1 | 1): void {
    this.catalog.move(row.product.id, direction);
  }

  protected async remove(row: Row): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: T.catalog.confirmDeleteTitle,
      bodyKey: T.catalog.confirmDeleteBody,
      confirmKey: T.catalog.delete,
      params: { name: row.name },
      danger: true,
    });
    if (confirmed) this.catalog.remove(row.product.id);
  }

  protected async save(): Promise<void> {
    this.saveError.set(null);
    this.justSaved.set(false);
    this.pdf.failed.set(false);
    this.show(await this.catalog.save());
  }

  protected discard(): void {
    this.catalog.discard();
    this.saveError.set(null);
  }

  protected async reload(): Promise<void> {
    await this.catalog.load();
    this.saveError.set(null);
    this.justSaved.set(false);
  }

  protected async generatePdf(): Promise<void> {
    this.justSaved.set(false);
    await this.pdf.generate();
  }

  private show(outcome: SaveOutcome): void {
    switch (outcome.kind) {
      case 'saved':
        this.justSaved.set(true);
        return;
      case 'conflict':
        this.saveError.set({ key: T.save.conflict, details: [] });
        return;
      case 'invalid':
        this.saveError.set({ key: T.save.invalid, details: outcome.errors });
        return;
      case 'offline':
        this.saveError.set({ key: T.save.offline, details: [] });
    }
  }
}
