import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ORDER_CONDITION_GROUPS } from '../../../../core/catalog/order-conditions.data';
import { SECTION_IDS } from '../../../../core/config/routes';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { ORDER_ICON_URLS } from '../../../../shared/ui/icons/icons';

@Component({
  selector: 'arg-orders-section',
  imports: [TranslocoDirective],
  templateUrl: './orders-section.html',
  host: { class: 'block' },
})
export class OrdersSection {
  protected readonly t = T;
  protected readonly sections = SECTION_IDS;
  // The shared grouping, each group with the glyph that heads it.
  protected readonly groups = ORDER_CONDITION_GROUPS.map((group) => ({
    ...group,
    icon: ORDER_ICON_URLS[group.id],
  }));
}
