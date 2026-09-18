import { Directive, inject, input } from '@angular/core';
import type { LeadSource } from '../../core/analytics/analytics.constants';
import { AnalyticsService, type LeadItem } from '../../core/analytics/analytics.service';

/**
 * Counts a click on a WhatsApp link as a lead, named after the button that was
 * used. The link itself keeps working exactly as before: this only observes.
 */
@Directive({
  selector: 'a[argLead]',
  host: { '(click)': 'track()' },
})
export class Lead {
  readonly argLead = input.required<LeadSource>();
  /** The piece being ordered, so the lead carries a value; absent on plain chat links. */
  readonly argLeadItem = input<LeadItem | null>(null);

  private readonly analytics = inject(AnalyticsService);

  track(): void {
    this.analytics.lead(this.argLead(), this.argLeadItem() ?? undefined);
  }
}
