import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ADMIN_API,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '@workers/shared/admin-api.constants';
import { AdminCatalogService } from './admin-catalog.service';

/** Asks the Worker to render the price list from the saved catalogue. */
@Service()
export class PdfService {
  private readonly http = inject(HttpClient);
  private readonly catalog = inject(AdminCatalogService);

  readonly generating = signal(false);
  readonly failed = signal(false);

  async generate(): Promise<void> {
    this.generating.set(true);
    this.failed.set(false);
    try {
      await firstValueFrom(
        this.http.post(ADMIN_API.pdf, null, {
          headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
        }),
      );
      await this.catalog.refreshStatus();
    } catch {
      this.failed.set(true);
    } finally {
      this.generating.set(false);
    }
  }
}
