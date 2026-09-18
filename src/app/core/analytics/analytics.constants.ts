// Google Analytics 4. The measurement id is public by design: it ships in every page.
// An empty id turns analytics off, which is what a fork or a preview build wants.
export const ANALYTICS: {
  readonly measurementId: string;
  readonly scriptUrl: string;
} = {
  measurementId: 'G-E75XPPJL3N',
  scriptUrl: 'https://www.googletagmanager.com/gtag/js',
};

// GA4's recommended event for a contact that may become a sale; it is what the
// property counts as a key event. Every WhatsApp opening sends one.
export const LEAD_EVENT = 'generate_lead';

// Which button opened WhatsApp, so the reports can tell the hero from the widget.
export const LEAD_SOURCES = {
  hero: 'hero',
  orders: 'orders',
  widget: 'widget',
  links: 'links',
  product: 'product',
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];
