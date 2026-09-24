import { RenderMode, type ServerRoute } from '@angular/ssr';
import { CATALOG_SNAPSHOT } from './core/catalog/catalog.snapshot.generated';
import { ROUTE_PARAMS, ROUTE_PATHS } from './core/config/routes';

const productPattern = `${ROUTE_PATHS.catalog}/:${ROUTE_PARAMS.productId}`;

/** One prerendered page per product in the snapshot the build pulled; pieces published later get the client shell. */
const productParams = (): Promise<Record<string, string>[]> =>
  Promise.resolve(
    CATALOG_SNAPSHOT.products.map((product) => ({ [ROUTE_PARAMS.productId]: product.id })),
  );

export const serverRoutes: ServerRoute[] = [
  // The bare catalogue segment is not a page. Left to the prerenderer it becomes
  // a 404 rendered into a file, which then lands in the sitemap.
  { path: ROUTE_PATHS.catalog, renderMode: RenderMode.Client },
  {
    path: productPattern,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: productParams,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
