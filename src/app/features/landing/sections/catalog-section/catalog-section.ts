import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { CatalogService } from '../../../../core/catalog/catalog.service';
import { formatPrice, startingPrice } from '../../../../core/catalog/pricing';
import { localizedUrl, productSegments, SECTION_IDS } from '../../../../core/config/routes';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { REDUCED_MOTION_MEDIA_QUERY } from '../../../../core/theme/theme.constants';
import { ProductCard } from '../../../../shared/ui/product-card/product-card';

@Component({
  selector: 'arg-catalog-section',
  imports: [TranslocoDirective, ProductCard],
  templateUrl: './catalog-section.html',
  host: { class: 'block' },
})
export class CatalogSection {
  private readonly catalog = inject(CatalogService);
  private readonly language = inject(LanguageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly shelf = viewChild.required<ElementRef<HTMLElement>>('shelf');

  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  protected readonly focus = this.catalog.focus;

  protected readonly cards = computed(() => {
    const language = this.language.current();
    return this.catalog.products.map((product) => ({
      product,
      link: localizedUrl(language, productSegments(product.id)),
      price: formatPrice(startingPrice(product), language),
    }));
  });

  constructor() {
    // Back from a piece, centre its card so the returning photo has somewhere to land.
    afterNextRender(() => {
      const id = this.catalog.focus();
      if (id === null) return;
      const frame = this.shelf().nativeElement.querySelector('[data-piece="' + id + '"]');
      frame
        ?.closest('.shelf__card')
        ?.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' });
    });
  }

  /** Moves the shelf one card in either direction; scroll snapping settles it on a piece. */
  protected nudge(direction: -1 | 1): void {
    if (!this.isBrowser) return;
    const shelf = this.shelf().nativeElement;
    const card = shelf.firstElementChild;
    if (!(card instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(shelf).columnGap) || 0;
    const reduced = shelf.ownerDocument.defaultView?.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;
    shelf.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: reduced === true ? 'instant' : 'smooth',
    });
  }
}
