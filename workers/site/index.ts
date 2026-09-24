import {
  CATALOG_API_PATH,
  CATALOG_PDF_KEY,
  CATALOG_PDF_PUBLIC_PATH,
  PHOTO_KEY_PREFIX,
} from '../../src/app/core/catalog/catalog.constants';
import { toPublicCatalog } from '../../src/app/core/catalog/projection';
import { DEPLOYMENT } from '../../src/app/core/config/build-config.generated';
import {
  CACHE_CONTROL,
  CONTENT_TYPE,
  HEADER,
  HTTP_STATUS,
  NOT_FOUND_ASSET_PATH,
  SHELL_ASSET_PATH,
  SITEMAP_PATH,
} from '../shared/http.constants';
import { withSecurityHeaders } from '../shared/security-headers';
import { kvCatalogStore, r2ObjectStore } from '../shared/cloudflare-stores';
import { handleCatalogApi } from './catalog-api';
import { handlePhoto } from './photos';
import { productShellMeta } from './product-shell';
import { renderProductShell } from './shell-render';
import { renderSitemap } from './sitemap';

// The public site's Worker. Static assets answer first and for free; this runs
// only for what is not a file: the catalogue API, uploaded photos, the sitemap,
// the pages of pieces published since the last build, and the 404 page.

/** A photo is immutable by key, so each data centre keeps it after the first read from R2. */
async function servePhoto(
  request: Request,
  key: string,
  env: SiteEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached !== undefined) return cached;
  const response = withSecurityHeaders(await handlePhoto(request, key, r2ObjectStore(env.MEDIA)));
  if (response.ok && request.method === 'GET') ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

/** The price list the panel last generated; revalidated on every request by its ETag. */
async function servePdf(request: Request, env: SiteEnv): Promise<Response> {
  const object = await r2ObjectStore(env.MEDIA).get(CATALOG_PDF_KEY);
  if (object === null) return new Response(null, { status: HTTP_STATUS.notFound });
  if (request.headers.get(HEADER.ifNoneMatch) === object.etag) {
    return new Response(null, {
      status: HTTP_STATUS.notModified,
      headers: { [HEADER.etag]: object.etag },
    });
  }
  return withSecurityHeaders(
    new Response(object.body, {
      headers: {
        [HEADER.contentType]: object.contentType ?? CONTENT_TYPE.binary,
        [HEADER.etag]: object.etag,
        [HEADER.cacheControl]: CACHE_CONTROL.page,
        [HEADER.contentDisposition]: `inline; filename="${CATALOG_PDF_PUBLIC_PATH.slice(1)}"`,
      },
    }),
  );
}

async function asset(env: SiteEnv, url: URL, path: string): Promise<Response> {
  return env.ASSETS.fetch(new Request(new URL(path, url.origin)));
}

async function notFound(env: SiteEnv, url: URL): Promise<Response> {
  const page = await asset(env, url, NOT_FOUND_ASSET_PATH);
  return withSecurityHeaders(
    new Response(page.body, { status: HTTP_STATUS.notFound, headers: page.headers }),
  );
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const catalog = kvCatalogStore(env.CATALOG);

    if (url.pathname === `/${CATALOG_API_PATH}`) {
      return withSecurityHeaders(await handleCatalogApi(request, catalog));
    }

    if (url.pathname.startsWith(`/${PHOTO_KEY_PREFIX}`)) {
      return servePhoto(request, url.pathname.slice(1), env, ctx);
    }
    if (url.pathname === CATALOG_PDF_PUBLIC_PATH) return servePdf(request, env);

    const document = await catalog.document();
    const published = document === null ? null : toPublicCatalog(document);

    if (url.pathname === SITEMAP_PATH) {
      if (published === null) return notFound(env, url);
      return withSecurityHeaders(
        new Response(renderSitemap(DEPLOYMENT.origin, published, new Date()), {
          headers: {
            [HEADER.contentType]: CONTENT_TYPE.xml,
            [HEADER.cacheControl]: CACHE_CONTROL.catalog,
          },
        }),
      );
    }

    const meta =
      published === null
        ? null
        : productShellMeta(url, DEPLOYMENT.origin, published, DEPLOYMENT.imageTransforms);
    if (meta !== null) {
      const shell = await asset(env, url, SHELL_ASSET_PATH);
      return withSecurityHeaders(renderProductShell(shell, meta));
    }

    return notFound(env, url);
  },
} satisfies ExportedHandler<SiteEnv>;
