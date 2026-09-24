import { CACHE_CONTROL, HEADER } from '../shared/http.constants';
import { json } from '../shared/http';
import type { AdminStore } from '../shared/stores';

export type PdfState = 'current' | 'stale' | 'missing';

export interface AdminStatus {
  readonly catalogVersion: string | null;
  readonly pdfVersion: string | null;
  readonly pdfState: PdfState;
}

/** Whether the stored PDF was made from the current catalogue. */
export function pdfState(catalogVersion: string | null, pdfVersion: string | null): PdfState {
  if (pdfVersion === null) return 'missing';
  return pdfVersion === catalogVersion ? 'current' : 'stale';
}

/** GET /api/status: the catalogue version and how the PDF stands against it. */
export async function handleStatus(store: AdminStore): Promise<Response> {
  const [catalogVersion, pdfVersion] = await Promise.all([store.version(), store.pdfVersion()]);
  const status: AdminStatus = {
    catalogVersion,
    pdfVersion,
    pdfState: pdfState(catalogVersion, pdfVersion),
  };
  return json(status, { headers: { [HEADER.cacheControl]: CACHE_CONTROL.private } });
}
