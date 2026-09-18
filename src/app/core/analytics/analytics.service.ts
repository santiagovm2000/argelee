import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { CURRENCY_CODE } from '../catalog/catalog.constants';
import { ANALYTICS, LEAD_EVENT, type LeadSource } from './analytics.constants';

/** The piece a lead is about, for the value GA4 attaches to the event. */
export interface LeadItem {
  readonly id: string;
  readonly price: number;
}

interface GtagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

@Service()
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private ready = false;

  /**
   * Queues the GA4 config and loads gtag.js once, in the browser only, when the
   * page is idle so the script never competes with the hero for bandwidth.
   * Prerendering and a build without a measurement id never see any of it.
   */
  init(): void {
    const view = this.document.defaultView as GtagWindow | null;
    if (!this.browser || this.ready || ANALYTICS.measurementId === '' || view === null) return;
    this.ready = true;

    const dataLayer = (view.dataLayer ??= []);
    // gtag.js only reads Arguments objects from the data layer, so the shim
    // forwards `arguments` as is, exactly like Google's own snippet.
    view.gtag = function gtag(): void {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    view.gtag('js', new Date());
    view.gtag('config', ANALYTICS.measurementId);

    const load = (): void => {
      const script = this.document.createElement('script');
      script.async = true;
      script.src = `${ANALYTICS.scriptUrl}?id=${ANALYTICS.measurementId}`;
      this.document.head.appendChild(script);
    };
    if (typeof view.requestIdleCallback === 'function') view.requestIdleCallback(load);
    else view.setTimeout(load);
  }

  /** Records a WhatsApp opening as a lead, with the piece and its price when there is one. */
  lead(source: LeadSource, item?: LeadItem): void {
    const view = this.document.defaultView as GtagWindow | null;
    if (!this.ready || view?.gtag === undefined) return;
    view.gtag('event', LEAD_EVENT, {
      lead_source: source,
      ...(item === undefined
        ? {}
        : { currency: CURRENCY_CODE, value: item.price, items: [{ item_id: item.id }] }),
    });
  }
}
