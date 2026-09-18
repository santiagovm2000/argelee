import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../../../core/catalog/order.service';
import { SECTION_IDS } from '../../../../core/config/routes';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { Lead } from '../../../../shared/directives/lead';
import { ORDER_ICON_URLS } from '../../../../shared/ui/icons/icons';

const notes = T.landing.orders.notes;
const groups = T.landing.orders.groups;

@Component({
  selector: 'arg-orders-section',
  imports: [TranslocoDirective, Lead],
  templateUrl: './orders-section.html',
  host: { class: 'block' },
})
export class OrdersSection {
  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  protected readonly order = inject(OrderService);
  // The conditions from the price list, grouped the way a customer meets them:
  // the piece itself, reserving and paying for it, then receiving it.
  protected readonly groups = [
    {
      id: 'piece',
      icon: ORDER_ICON_URLS.piece,
      titleKey: groups.piece,
      notes: [notes.fruit, notes.flavours, notes.availability],
    },
    {
      id: 'payment',
      icon: ORDER_ICON_URLS.payment,
      titleKey: groups.payment,
      notes: [notes.notice, notes.deposit, notes.receipt, notes.currency],
    },
    {
      id: 'delivery',
      icon: ORDER_ICON_URLS.delivery,
      titleKey: groups.delivery,
      notes: [notes.delivery, notes.deliveryFee, notes.deliveryArea],
    },
  ] as const;
}
