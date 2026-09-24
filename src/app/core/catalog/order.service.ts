import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SITE, WHATSAPP_BASE_URL } from '../config/app.constants';
import { LanguageService } from '../i18n/language.service';
import { T } from '../i18n/translation-keys.generated';
import type { Product } from './catalog.model';
import { localizedText } from './localized-text';

@Service()
export class OrderService {
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);

  /** A bare conversation link, for the floating button, the hero and the footer. */
  chatUrl(): string {
    return this.whatsappUrl(this.transloco.translate(T.catalog.order.greeting));
  }

  /** The conversation link with the chosen piece (and how many, for a piece sold by the unit) as the first message. */
  orderUrl(product: Product, quantity: number): string {
    const t = T.catalog;
    const translate = (key: string, params?: Record<string, string | number>): string =>
      this.transloco.translate(key, params);

    const lines = [
      translate(t.order.greeting),
      translate(t.order.product, {
        product: localizedText(product.text, this.language.current()).name,
      }),
    ];
    if (product.serves === null) {
      lines.push(translate(t.order.quantity, { count: quantity }));
    }
    lines.push(translate(t.order.closing));

    return this.whatsappUrl(lines.join('\n'));
  }

  private whatsappUrl(text: string): string {
    return `${WHATSAPP_BASE_URL}${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
