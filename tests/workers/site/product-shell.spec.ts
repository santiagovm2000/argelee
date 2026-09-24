import { describe, expect, it } from 'vitest';
import { productShellMeta, shellHeadTags } from '@workers/site/product-shell';
import { PUBLIC_CATALOG_FIXTURE } from '../../fixtures/catalog.fixture';

const ORIGIN = 'https://argelees.com';

const first = PUBLIC_CATALOG_FIXTURE.products[0];
if (first === undefined) throw new Error('fixture has no products');

describe('productShellMeta', () => {
  it('describes a published piece from its URL', () => {
    const meta = productShellMeta(
      new URL(`${ORIGIN}/catalog/${first.id}`),
      ORIGIN,
      PUBLIC_CATALOG_FIXTURE,
      true,
    );
    expect(meta?.language).toBe('es');
    expect(meta?.title).toContain(first.text.es.name);
    expect(meta?.canonical).toBe(`${ORIGIN}/catalog/${first.id}`);
    expect(meta?.image).toContain(first.photo.key);
    expect(meta?.image).toContain('format=jpeg');
  });

  it('is null for anything that is not a published piece', () => {
    const cases = [
      '/',
      '/links',
      '/catalog',
      `/catalog/${first.id}/extra`,
      '/catalog/no-such-piece',
    ];
    for (const path of cases) {
      expect(
        productShellMeta(new URL(`${ORIGIN}${path}`), ORIGIN, PUBLIC_CATALOG_FIXTURE, true),
      ).toBeNull();
    }
  });
});

describe('shellHeadTags', () => {
  it('writes the description, canonical and social tags with escaped values', () => {
    const meta = productShellMeta(
      new URL(`${ORIGIN}/catalog/${first.id}`),
      ORIGIN,
      PUBLIC_CATALOG_FIXTURE,
      false,
    );
    if (meta === null) throw new Error('expected a product page');
    const head = shellHeadTags({ ...meta, title: 'Tarta "Rosa" & <fina>' });
    expect(head).toContain(`<link rel="canonical" href="${meta.canonical}">`);
    expect(head).toContain('property="og:image"');
    expect(head).toContain('content="Tarta &quot;Rosa&quot; &amp; &lt;fina>"');
  });
});
