import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS, LEAD_EVENT, LEAD_SOURCES } from '@core/analytics/analytics.constants';
import { AnalyticsService } from '@core/analytics/analytics.service';

interface GtagWindow extends Window {
  dataLayer?: IArguments[];
  gtag?: unknown;
}

const PIECE_PRICE = 35;

const view = (): GtagWindow => window;

/** The commands queued so far, as plain arrays for easy assertions. */
const queued = (): unknown[][] =>
  (view().dataLayer ?? []).map((entry) => Array.from<unknown>(entry));

function serviceOn(platform: 'browser' | 'server'): AnalyticsService {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platform },
      { provide: DOCUMENT, useValue: document },
    ],
  });
  return TestBed.inject(AnalyticsService);
}

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete view().dataLayer;
    delete view().gtag;
    for (const script of document.head.querySelectorAll('script')) script.remove();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('ships with a measurement id', () => {
    expect(ANALYTICS.measurementId).toMatch(/^G-[A-Z0-9]+$/);
  });

  it('does nothing on the server', () => {
    serviceOn('server').init();
    vi.runAllTimers();
    expect(view().dataLayer).toBeUndefined();
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('queues the config and loads gtag.js once', () => {
    const service = serviceOn('browser');
    service.init();
    service.init();
    vi.runAllTimers();

    expect(queued()[0]?.[0]).toBe('js');
    expect(queued()[1]).toEqual(['config', ANALYTICS.measurementId]);
    const scripts = document.head.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.src).toBe(`${ANALYTICS.scriptUrl}?id=${ANALYTICS.measurementId}`);
  });

  it('records a lead with its source, and the piece when there is one', () => {
    const service = serviceOn('browser');
    service.init();
    service.lead(LEAD_SOURCES.widget);
    service.lead(LEAD_SOURCES.product, { id: 'corona-tres-leches', price: PIECE_PRICE });

    const events = queued().filter((command) => command[0] === 'event');
    expect(events[0]).toEqual(['event', LEAD_EVENT, { lead_source: LEAD_SOURCES.widget }]);
    expect(events[1]?.[2]).toMatchObject({
      lead_source: LEAD_SOURCES.product,
      value: PIECE_PRICE,
      items: [{ item_id: 'corona-tres-leches' }],
    });
  });

  it('drops a lead recorded before init, instead of throwing', () => {
    expect(() => {
      serviceOn('browser').lead(LEAD_SOURCES.hero);
    }).not.toThrow();
    expect(view().dataLayer).toBeUndefined();
  });
});
