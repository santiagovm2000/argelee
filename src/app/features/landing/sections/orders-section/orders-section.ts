import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../../../core/catalog/order.service';
import { SECTION_IDS } from '../../../../core/config/routes';
import { T } from '../../../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-orders-section',
  imports: [TranslocoDirective],
  templateUrl: './orders-section.html',
  host: { class: 'block' },
})
export class OrdersSection {
  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  protected readonly order = inject(OrderService);
  // The conditions from the price list, in its order.
  protected readonly notes = [
    T.landing.orders.notes.fruit,
    T.landing.orders.notes.flavours,
    T.landing.orders.notes.deposit,
    T.landing.orders.notes.delivery,
    T.landing.orders.notes.currency,
  ] as const;
}
