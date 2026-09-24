import { describe, expect, it } from 'vitest';
import {
  catalogBands,
  displayPhone,
  type PdfLocale,
  renderCatalogHtml,
} from '@core/catalog/pdf/catalog-pdf';
import type { PublicCatalog } from '@core/catalog/projection';
import locale from '@locales/es.json';
import { PUBLIC_CATALOG_FIXTURE } from '../../../fixtures/catalog.fixture';

const LOCALE: PdfLocale = locale;

function render(catalog: PublicCatalog = PUBLIC_CATALOG_FIXTURE): string {
  return renderCatalogHtml({
    catalog,
    locale: LOCALE,
    language: 'es',
    brand: 'ArGeles',
    whatsappNumber: '584241860627',
    assets: {
      fontUrl: (role) => `https://argelees.com/fonts/${role}.woff2`,
      photoUrl: (key) => `https://argelees.com/${key}`,
      coverPhotoUrl: (key) => `https://argelees.com/cover/${key}`,
      iconMarkup: (group) => `<path data-icon="${group}"/>`,
    },
  });
}

const count = (html: string, needle: string): number => html.split(needle).length - 1;

describe('catalogBands', () => {
  const bands = catalogBands(PUBLIC_CATALOG_FIXTURE, LOCALE, 'es');

  it('keeps every published piece exactly once, largest first, units last', () => {
    const ids = bands.flatMap((band) => band.pieces.map((piece) => piece.product.id));
    expect(ids).toHaveLength(PUBLIC_CATALOG_FIXTURE.products.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bands.at(-1)?.pieces.every((piece) => piece.wide)).toBe(true);
    expect(bands[0]?.title).toBe('Para 16 a 20 personas');
    expect(bands[0]?.showSize).toBe(false);
  });

  it('states each size inside a band that mixes them', () => {
    const mixed = bands.find((band) => band.showSize);
    expect(mixed?.title).toBe('Para 8 a 16 personas');
  });

  it('handles an empty catalogue and a catalogue of one wide piece', () => {
    expect(catalogBands({ version: 'v', products: [] }, LOCALE, 'es')).toEqual([]);
    const unit = PUBLIC_CATALOG_FIXTURE.products.find((product) => product.serves === null);
    if (unit === undefined) throw new Error('fixture has no unit piece');
    const single = catalogBands({ version: 'v', products: [unit] }, LOCALE, 'es');
    expect(single).toHaveLength(1);
    expect(single[0]?.volume).toBe(LOCALE.pdf.band.unitVolume);
  });
});

describe('renderCatalogHtml', () => {
  const html = render();

  it('prints every piece with its name, price and photo', () => {
    for (const product of PUBLIC_CATALOG_FIXTURE.products) {
      expect(html).toContain(product.text.es.name);
      expect(html).toContain(`https://argelees.com/${product.photo.key}`);
    }
    expect(html).toContain('<small>$</small>60');
    expect(html).toContain('<small>$</small>3,50');
  });

  it('lays whole pieces out two to a row and a unit piece across the page', () => {
    const rows = catalogBands(PUBLIC_CATALOG_FIXTURE, LOCALE, 'es')
      .filter((band) => !band.pieces.some((piece) => piece.wide))
      .reduce((total, band) => total + Math.ceil(band.pieces.length / 2), 0);
    expect(count(html, 'class="row"')).toBe(rows);
    expect(count(html, 'class="piece piece--wide"')).toBe(1);
    expect(html).toContain('<thead>');
  });

  it('carries the cover, the conditions and the WhatsApp number', () => {
    expect(html).toContain(LOCALE.pdf.cover.title);
    expect(html).toContain(LOCALE.landing.orders.title);
    expect(html).toContain('data-icon="payment"');
    expect(html).toContain('0424 186 0627');
    expect(html).toContain('https://argelees.com/fonts/display.woff2');
  });

  it('escapes what it prints', () => {
    const [first, ...rest] = PUBLIC_CATALOG_FIXTURE.products;
    if (first === undefined) throw new Error('fixture has no products');
    const spiky = render({
      version: 'v',
      products: [
        { ...first, text: { es: { ...first.text.es, name: 'Tarta <b>"Rosa"</b>' } } },
        ...rest,
      ],
    });
    expect(spiky).toContain('Tarta &lt;b&gt;&quot;Rosa&quot;&lt;/b&gt;');
  });
});

describe('displayPhone', () => {
  it('reads a Venezuelan wa.me number the local way', () => {
    expect(displayPhone('584241860627')).toBe('0424 186 0627');
  });
});
