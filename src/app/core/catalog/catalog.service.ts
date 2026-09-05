import { Service, signal } from '@angular/core';
import { PRODUCTS } from './catalog.data';
import type { Product, ProductId } from './catalog.model';

@Service()
export class CatalogService {
  readonly products = PRODUCTS;

  /**
   * The piece the visitor last opened. Its shelf card and the product page's
   * photo carry the same view-transition name, so the router morphs one into
   * the other on the way in and on the way back.
   */
  readonly focus = signal<ProductId | null>(null);

  /** Resolves a URL slug to a piece; unknown slugs give null so the page can show an empty state. */
  find(slug: string): Product | null {
    return PRODUCTS.find((product) => product.id === slug) ?? null;
  }
}
