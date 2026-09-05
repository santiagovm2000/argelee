import { RenderMode, type ServerRoute } from '@angular/ssr';
import { PRODUCTS } from './core/catalog/catalog.data';
import { ROUTE_PARAMS, ROUTE_PATHS } from './core/config/routes';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './core/i18n/i18n.constants';

const productPattern = `${ROUTE_PATHS.catalog}/:${ROUTE_PARAMS.productSlug}`;

/** One prerendered page per product; the catalogue data is the only source of slugs. */
const productParams = (): Promise<Record<string, string>[]> =>
  Promise.resolve(PRODUCTS.map((product) => ({ [ROUTE_PARAMS.productSlug]: product.id })));

const withLanguage = (language: SupportedLanguage, path: string): string =>
  language === DEFAULT_LANGUAGE ? path : `${language}/${path}`;

export const serverRoutes: ServerRoute[] = [
  ...SUPPORTED_LANGUAGES.flatMap((language): ServerRoute[] => [
    // The bare catalogue segment is not a page. Left to the prerenderer it becomes
    // a 404 rendered into a file, which then lands in the sitemap.
    { path: withLanguage(language, ROUTE_PATHS.catalog), renderMode: RenderMode.Client },
    {
      path: withLanguage(language, productPattern),
      renderMode: RenderMode.Prerender,
      getPrerenderParams: productParams,
    },
  ]),
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
