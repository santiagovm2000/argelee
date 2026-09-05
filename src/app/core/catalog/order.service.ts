import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SITE, WHATSAPP_BASE_URL } from '../config/app.constants';
import { LanguageService } from '../i18n/language.service';
import { T } from '../i18n/translation-keys.generated';
import type { Product, Selection } from './catalog.model';
import { formatPrice, quote } from './pricing';

@Service()
export class OrderService {
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);

  /** A bare conversation link, for the floating button, the hero and the footer. */
  chatUrl(): string {
    return this.whatsappUrl(this.transloco.translate(T.catalog.order.greeting));
  }

  /** The conversation link with the configured piece already written out as the first message. */
  orderUrl(product: Product, selection: Selection): string {
    const t = T.catalog;
    const translate = (key: string, params?: Record<string, string | number>): string =>
      this.transloco.translate(key, params);
    const joined = (keys: readonly string[]): string =>
      keys.map((key) => translate(key)).join(', ');

    const lines = [
      translate(t.order.greeting),
      translate(t.order.product, { product: translate(t.products[product.id].name) }),
      translate(t.order.portions, { portions: selection.portions }),
    ];
    if (selection.layers.length > 0) {
      lines.push(
        translate(t.order.option, {
          group: translate(t.groups.layers),
          choice: joined(selection.layers.map((id) => t.layers[id])),
        }),
      );
    }
    if (selection.fruits.length > 0) {
      lines.push(
        translate(t.order.option, {
          group: translate(t.groups.fruit),
          choice: joined(selection.fruits.map((id) => t.fruits[id])),
        }),
      );
    }
    lines.push(
      translate(t.order.total, {
        total: formatPrice(quote(product, selection), this.language.current()),
      }),
      translate(t.order.closing),
    );

    return this.whatsappUrl(lines.join('\n'));
  }

  private whatsappUrl(text: string): string {
    return `${WHATSAPP_BASE_URL}${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
