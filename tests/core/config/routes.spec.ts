import { describe, expect, it } from 'vitest';
import { localizedUrl, pathSegments, productSegments, ROUTE_PATHS } from '@core/config/routes';

describe('localizedUrl', () => {
  it('keeps the only language at the root', () => {
    expect(localizedUrl('es')).toBe('/');
    expect(localizedUrl('es', ['pricing'])).toBe('/pricing');
  });
});

describe('pathSegments', () => {
  it('strips a leading language segment', () => {
    expect(pathSegments('/es/pricing')).toEqual(['pricing']);
    expect(pathSegments('/es')).toEqual([]);
  });

  it('leaves a path that carries no language untouched', () => {
    expect(pathSegments('/pricing')).toEqual(['pricing']);
    expect(pathSegments('/')).toEqual([]);
  });

  it('ignores the query string and fragment', () => {
    expect(pathSegments('/pricing?utm=x#plans')).toEqual(['pricing']);
  });
});

describe('productSegments', () => {
  it('nests the slug under the catalogue segment', () => {
    const segments = productSegments('0f3a1c2e-1234-4abc-9def-0123456789ab');
    expect(localizedUrl('es', segments)).toBe(
      `/${ROUTE_PATHS.catalog}/0f3a1c2e-1234-4abc-9def-0123456789ab`,
    );
    expect(pathSegments(localizedUrl('es', segments))).toEqual(segments);
  });
});
