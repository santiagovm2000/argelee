import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { type CatalogDocument, type StoredProduct } from '@core/catalog/catalog.document';
import {
  ADMIN_API,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '@workers/shared/admin-api.constants';

export type SaveOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'conflict' }
  | { readonly kind: 'invalid'; readonly errors: readonly string[] }
  | { readonly kind: 'offline' };

export type PdfState = 'current' | 'stale' | 'missing';

interface StatusInfo {
  readonly catalogVersion: string | null;
  readonly pdfVersion: string | null;
  readonly pdfState: PdfState;
}

interface SaveReply {
  readonly version: string;
  readonly updatedAt: string;
}

const HTTP_CONFLICT = 412;
const HTTP_INVALID = 422;

/** The validation messages in a 422 body, if it carries any. */
function errorsIn(body: unknown): readonly string[] {
  if (typeof body !== 'object' || body === null) return [];
  const errors = (body as { errors?: unknown }).errors;
  return Array.isArray(errors)
    ? errors.filter((item): item is string => typeof item === 'string')
    : [];
}

function mutationHeaders(version: string | null): HttpHeaders {
  let headers = new HttpHeaders({ [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE });
  if (version !== null) headers = headers.set('If-Match', `"${version}"`);
  return headers;
}

/** The catalogue as the owner edits it: a working copy, the version it came from, and the saves in between. */
@Service()
export class AdminCatalogService {
  private readonly http = inject(HttpClient);

  private readonly working = signal<CatalogDocument | null>(null);
  private readonly savedSnapshot = signal<string | null>(null);

  readonly document = this.working.asReadonly();
  readonly products = computed(() => this.working()?.products ?? []);
  readonly version = computed(() => this.working()?.version ?? null);
  readonly loaded = computed(() => this.working() !== null);
  readonly dirty = computed(() => {
    const document = this.working();
    return document !== null && JSON.stringify(document.products) !== this.savedSnapshot();
  });
  readonly saving = signal(false);
  readonly pdfState = signal<PdfState>('missing');
  readonly loadFailed = signal(false);

  async load(): Promise<void> {
    this.loadFailed.set(false);
    try {
      const document = await firstValueFrom(this.http.get<CatalogDocument>(ADMIN_API.catalog));
      this.adopt(document);
      await this.refreshStatus();
    } catch {
      this.loadFailed.set(true);
    }
  }

  find(id: string): StoredProduct | null {
    return this.products().find((product) => product.id === id) ?? null;
  }

  /** Replaces the piece with the same id, or appends a new one at the end of the shelf. */
  upsert(product: StoredProduct): void {
    this.update((products) => {
      const index = products.findIndex((candidate) => candidate.id === product.id);
      if (index === -1) return [...products, product];
      return products.map((candidate) => (candidate.id === product.id ? product : candidate));
    });
  }

  remove(id: string): void {
    this.update((products) => products.filter((product) => product.id !== id));
  }

  setPublished(id: string, published: boolean): void {
    this.update((products) =>
      products.map((product) => (product.id === id ? { ...product, published } : product)),
    );
  }

  /** Moves a piece one place along the shelf; the ends stay put. */
  move(id: string, direction: -1 | 1): void {
    this.update((products) => {
      const from = products.findIndex((product) => product.id === id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= products.length) return products;
      const reordered = [...products];
      const [moved] = reordered.splice(from, 1);
      if (moved !== undefined) reordered.splice(to, 0, moved);
      return reordered;
    });
  }

  /** Drops the piece at `from` into the place `to`, shifting the rest along. */
  reorder(from: number, to: number): void {
    this.update((products) => {
      if (from === to || from < 0 || to < 0 || from >= products.length || to >= products.length) {
        return products;
      }
      const reordered = [...products];
      const [moved] = reordered.splice(from, 1);
      if (moved !== undefined) reordered.splice(to, 0, moved);
      return reordered;
    });
  }

  discard(): void {
    const snapshot = this.savedSnapshot();
    const document = this.working();
    if (snapshot === null || document === null) return;
    this.working.set({ ...document, products: JSON.parse(snapshot) as StoredProduct[] });
  }

  /** Sends the working copy; the server assigns the version and rejects a stale one. */
  async save(): Promise<SaveOutcome> {
    const document = this.working();
    if (document === null) return { kind: 'offline' };
    this.saving.set(true);
    try {
      const reply = await firstValueFrom(
        this.http.put<SaveReply>(ADMIN_API.catalog, document, {
          headers: mutationHeaders(document.version),
        }),
      );
      this.adopt({ ...document, version: reply.version, updatedAt: reply.updatedAt });
      await this.refreshStatus();
      return { kind: 'saved' };
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === HTTP_CONFLICT) return { kind: 'conflict' };
        if (error.status === HTTP_INVALID)
          return { kind: 'invalid', errors: errorsIn(error.error) };
      }
      return { kind: 'offline' };
    } finally {
      this.saving.set(false);
    }
  }

  async refreshStatus(): Promise<void> {
    try {
      const status = await firstValueFrom(this.http.get<StatusInfo>(ADMIN_API.status));
      this.pdfState.set(status.pdfState);
    } catch {
      this.pdfState.set('missing');
    }
  }

  private adopt(document: CatalogDocument): void {
    this.working.set(document);
    this.savedSnapshot.set(JSON.stringify(document.products));
  }

  private update(change: (products: readonly StoredProduct[]) => readonly StoredProduct[]): void {
    const document = this.working();
    if (document === null) return;
    this.working.set({ ...document, products: change(document.products) });
  }
}
