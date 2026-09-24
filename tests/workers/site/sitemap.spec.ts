import { describe, expect, it } from 'vitest';
import { renderSitemap } from '@workers/site/sitemap';
import { PUBLIC_CATALOG_FIXTURE } from '../../fixtures/catalog.fixture';

const ORIGIN = 'https://argelees.com';
const TODAY = new Date('2026-09-21T15:00:00.000Z');

describe('renderSitemap', () => {
  const xml = renderSitemap(ORIGIN, PUBLIC_CATALOG_FIXTURE, TODAY);
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  it('lists the home, the link hub and every published piece', () => {
    expect(locations).toHaveLength(2 + PUBLIC_CATALOG_FIXTURE.products.length);
    expect(locations).toContain(`${ORIGIN}/`);
    expect(locations).toContain(`${ORIGIN}/links`);
    for (const product of PUBLIC_CATALOG_FIXTURE.products) {
      expect(locations).toContain(`${ORIGIN}/catalog/${product.id}`);
    }
  });

  it('dates entries by the day and leaves out what is not published', () => {
    expect(xml).toContain('<lastmod>2026-09-21</lastmod>');
    const empty = renderSitemap(ORIGIN, { version: 'v', products: [] }, TODAY);
    expect(empty).not.toContain('/catalog/');
  });
});
