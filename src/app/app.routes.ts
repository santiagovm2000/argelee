import type { Routes } from '@angular/router';
import { ROUTE_PATHS } from './core/config/routes';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './core/i18n/i18n.constants';
import { applyRouteLanguage } from './core/i18n/language.guard';

// Every feature is mounted once per language, so a page cannot exist in one
// language only. See docs/SEO.md.
const languageChildren: Routes = [
  {
    path: ROUTE_PATHS.home,
    loadChildren: () => import('./features/landing/landing.routes').then((m) => m.landingRoutes),
  },
  {
    path: ROUTE_PATHS.catalog,
    loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.catalogRoutes),
  },
];

const prefixedLanguages = SUPPORTED_LANGUAGES.filter((language) => language !== DEFAULT_LANGUAGE);

export const routes: Routes = [
  ...prefixedLanguages.map((language) => ({
    path: language,
    data: { language },
    canActivate: [applyRouteLanguage],
    children: languageChildren,
  })),
  {
    path: ROUTE_PATHS.home,
    data: { language: DEFAULT_LANGUAGE },
    canActivate: [applyRouteLanguage],
    children: languageChildren,
  },
  {
    path: ROUTE_PATHS.notFound,
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
