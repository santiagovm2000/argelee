import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../core/catalog/order.service';
import { T } from '../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-whatsapp-button',
  imports: [TranslocoDirective],
  templateUrl: './whatsapp-button.html',
})
export class WhatsappButton {
  protected readonly t = T;
  protected readonly order = inject(OrderService);
}
