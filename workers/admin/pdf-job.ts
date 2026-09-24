import { CATALOG_PDF_KEY } from '../../src/app/core/catalog/catalog.constants';
import type { PublicCatalog } from '../../src/app/core/catalog/projection';
import { toPublicCatalog } from '../../src/app/core/catalog/projection';
import { CACHE_CONTROL, HEADER, HTTP_STATUS } from '../shared/http.constants';
import { json } from '../shared/http';
import type { AdminStore, ObjectWriter } from '../shared/stores';

const PDF_CONTENT_TYPE = 'application/pdf';
const BROWSER_RENDERING_API = 'https://api.cloudflare.com/client/v4/accounts';

/** Turns an HTML document into PDF bytes; Browser Rendering in production, a fake in tests. */
export interface PdfRenderer {
  render(html: string): Promise<ArrayBuffer>;
}

/** Cloudflare's hosted browser printing the page to A4 with its backgrounds. */
export function browserRenderingRenderer(accountId: string, token: string): PdfRenderer {
  return {
    async render(html) {
      const response = await fetch(`${BROWSER_RENDERING_API}/${accountId}/browser-rendering/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          pdfOptions: { format: 'a4', printBackground: true, preferCSSPageSize: true },
          gotoOptions: { waitUntil: 'networkidle0' },
        }),
      });
      if (!response.ok) {
        throw new Error(`browser rendering answered ${String(response.status)}`);
      }
      return response.arrayBuffer();
    },
  };
}

/** POST /api/pdf: renders the price list from the saved catalogue and stores it beside the photos. */
export async function handlePdf(
  store: AdminStore,
  media: ObjectWriter,
  renderer: PdfRenderer | null,
  buildHtml: (catalog: PublicCatalog) => string,
): Promise<Response> {
  if (renderer === null) {
    return json({ error: 'pdf-unavailable' }, { status: HTTP_STATUS.serviceUnavailable });
  }
  const document = await store.document();
  if (document === null)
    return json({ error: 'catalog-missing' }, { status: HTTP_STATUS.notFound });

  let bytes: ArrayBuffer;
  try {
    bytes = await renderer.render(buildHtml(toPublicCatalog(document)));
  } catch {
    return json({ error: 'pdf-failed' }, { status: HTTP_STATUS.serviceUnavailable });
  }
  await media.put(CATALOG_PDF_KEY, bytes, PDF_CONTENT_TYPE);
  await store.setPdfVersion(document.version);
  return json(
    { version: document.version },
    { headers: { [HEADER.cacheControl]: CACHE_CONTROL.private } },
  );
}
