import { describe, expect, it } from 'vitest';
import { isRetiredPath } from '@workers/site/retired-paths';
import { PRODUCTS } from '../../fixtures/catalog.fixture';

const piece = PRODUCTS[0];
if (piece === undefined) throw new Error('fixture has no products');

describe('isRetiredPath', () => {
  it('retires the addresses of earlier versions of the site', () => {
    for (const path of [
      '/catalog/mosaico-de-fruta-fresca',
      '/catalog/corona-tres-leches/',
      '/catalogo',
      '/catalogo/corona-tres-leches',
      '/enlaces',
      '/enlaces/',
      '/en',
      '/en/catalog/corona-tres-leches',
      '/ArGeles-catalog.pdf',
    ]) {
      expect(isRetiredPath(path), path).toBe(true);
    }
  });

  it('leaves every current address alone', () => {
    for (const path of [
      '/',
      '/links',
      '/catalog',
      `/catalog/${piece.id}`,
      '/sitemap.xml',
      '/ArGeles-catalogo.pdf',
    ]) {
      expect(isRetiredPath(path), path).toBe(false);
    }
  });

  it('keeps a plain 404 for a piece id nobody publishes, since the piece may come back', () => {
    expect(isRetiredPath('/catalog/00000000-0000-4000-8000-000000000000')).toBe(false);
  });

  it('keeps a plain 404 for anything that never existed', () => {
    expect(isRetiredPath('/admin')).toBe(false);
    expect(isRetiredPath('/wp-login.php')).toBe(false);
  });
});
