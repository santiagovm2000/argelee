import type { Routes } from '@angular/router';
import { ROUTE_PATHS } from './core/config/routes';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.home,
    loadChildren: () => import('./features/landing/landing.routes').then((m) => m.landingRoutes),
  },
  {
    path: ROUTE_PATHS.notFound,
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
