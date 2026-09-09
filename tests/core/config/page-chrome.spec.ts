import { describe, expect, it } from 'vitest';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CHROME_DATA_KEY, FULL_CHROME, pageChrome } from '@core/config/page-chrome';

// The slice of a router state the shell reads: a chain of routes with data.
const chain = (...data: Record<string, unknown>[]): RouterStateSnapshot => {
  const leaf = { data: {}, firstChild: null };
  const root = data.reduceRight<Pick<ActivatedRouteSnapshot, 'data' | 'firstChild'>>(
    (child, routeData) => ({
      data: routeData,
      firstChild: child as ActivatedRouteSnapshot,
    }),
    leaf,
  );
  return { root } as RouterStateSnapshot;
};

describe('pageChrome', () => {
  it('shows everything when no route says otherwise', () => {
    expect(pageChrome(chain({}, { language: 'es' }))).toEqual(FULL_CHROME);
  });

  it('lets the deepest route trim the footer and the floating button', () => {
    const chrome = pageChrome(
      chain({}, { [CHROME_DATA_KEY]: { footer: false, whatsappWidget: false } }),
    );
    expect(chrome).toEqual({ footer: false, whatsappWidget: false });
  });

  it('keeps a part a route does not mention, and ignores malformed data', () => {
    expect(pageChrome(chain({ [CHROME_DATA_KEY]: { footer: false } }))).toEqual({
      footer: false,
      whatsappWidget: true,
    });
    expect(pageChrome(chain({ [CHROME_DATA_KEY]: 'no' }))).toEqual(FULL_CHROME);
    expect(pageChrome(chain({ [CHROME_DATA_KEY]: { footer: 'no' } }))).toEqual(FULL_CHROME);
  });
});
