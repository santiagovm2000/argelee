import type { Routes } from '@angular/router';
import { productRoutePattern } from '../../core/config/routes';

export const catalogRoutes: Routes = [
  {
    path: productRoutePattern(),
    loadComponent: () => import('./pages/product-page/product-page').then((m) => m.ProductPage),
  },
];
