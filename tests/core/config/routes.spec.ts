import { describe, expect, it } from 'vitest';
import { localizedUrl, pathSegments } from '@core/config/routes';

describe('localizedUrl', () => {
  it('keeps the default language at the root', () => {
    expect(localizedUrl('es')).toBe('/');
    expect(localizedUrl('es', ['pricing'])).toBe('/pricing');
  });

  it('prefixes every other language', () => {
    expect(localizedUrl('en')).toBe('/en');
    expect(localizedUrl('en', ['pricing'])).toBe('/en/pricing');
  });
});

describe('pathSegments', () => {
  it('strips a leading language segment', () => {
    expect(pathSegments('/en/pricing')).toEqual(['pricing']);
    expect(pathSegments('/en')).toEqual([]);
  });

  it('leaves a path that carries no language untouched', () => {
    expect(pathSegments('/pricing')).toEqual(['pricing']);
    expect(pathSegments('/')).toEqual([]);
  });

  it('ignores the query string and fragment', () => {
    expect(pathSegments('/en/pricing?utm=x#plans')).toEqual(['pricing']);
  });

  it('round-trips with localizedUrl so hreflang pairs stay reciprocal', () => {
    for (const url of ['/', '/en', '/pricing', '/en/pricing']) {
      const segments = pathSegments(url);
      expect(localizedUrl('es', segments)).toBe(pathSegments(url).length ? '/pricing' : '/');
      expect(pathSegments(localizedUrl('en', segments))).toEqual(segments);
    }
  });
});
