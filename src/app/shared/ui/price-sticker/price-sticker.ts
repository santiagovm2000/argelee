import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { T } from '../../../core/i18n/translation-keys.generated';

/** The listed price as one of the brand's round labels: "Desde", the amount, and "c/u" when sold by the unit. */
@Component({
  selector: 'arg-price-sticker',
  imports: [TranslocoDirective],
  templateUrl: './price-sticker.html',
  host: { class: 'block' },
})
export class PriceSticker {
  readonly price = input.required<string>();
  readonly byUnit = input<boolean>(false);
  protected readonly t = T;
}
