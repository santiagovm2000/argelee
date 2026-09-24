import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CATALOG_API_PATH } from './catalog.constants';
import type { Product, ProductId } from './catalog.model';
import { CATALOG_SNAPSHOT } from './catalog.snapshot.generated';
import { type PublicCatalog, validatePublicCatalog } from './projection';

/**
 * The menu as the site knows it. It opens on the snapshot the build was made
 * from, so the first client render matches the prerendered HTML exactly, and
 * swaps in whatever the owner has published since once the page has settled.
 */
@Service()
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<PublicCatalog>(CATALOG_SNAPSHOT);

  readonly products = computed(() => this.state().products);
  readonly version = computed(() => this.state().version);

  /**
   * The piece the visitor last opened. Its shelf card and the product page's
   * photo carry the same view-transition name, so the router morphs one into
   * the other on the way in and on the way back.
   */
  readonly focus = signal<ProductId | null>(null);

  /** Resolves a URL id to a piece; unknown ids give null so the page can show an empty state. */
  find(id: string): Product | null {
    return this.products().find((product) => product.id === id) ?? null;
  }

  /** Fetches the live catalogue and adopts it if it is newer; when the fetch fails, the snapshot stands. */
  async refresh(): Promise<void> {
    let payload: unknown;
    try {
      payload = await firstValueFrom(this.http.get<unknown>(CATALOG_API_PATH));
    } catch {
      return;
    }
    const result = validatePublicCatalog(payload);
    if (result.ok && result.value.version !== this.state().version) {
      this.state.set(result.value);
    }
  }
}
