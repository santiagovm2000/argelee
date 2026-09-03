import type { Routes } from '@angular/router';
import { ROUTE_PATHS } from '../../core/config/routes';

export const landingRoutes: Routes = [
  {
    path: ROUTE_PATHS.home,
    loadComponent: () => import('./pages/landing-page/landing-page').then((m) => m.LandingPage),
  },
];
