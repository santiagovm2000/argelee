import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../core/catalog/order.service';
import { T } from '../../core/i18n/translation-keys.generated';
import { Lead } from '../../shared/directives/lead';
import { ICON_URLS } from '../../shared/ui/icons/icons';

@Component({
  selector: 'arg-whatsapp-button',
  imports: [TranslocoDirective, Lead],
  templateUrl: './whatsapp-button.html',
})
export class WhatsappButton {
  protected readonly t = T;
  protected readonly icons = ICON_URLS;
  protected readonly order = inject(OrderService);
}
