import type { Routes } from '@angular/router';
import { ADMIN_ROUTES } from './core/config/admin.constants';
import { authGuard } from './core/session/auth.guard';

export const routes: Routes = [
  {
    path: ADMIN_ROUTES.login,
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/catalog/catalog-page/catalog-page').then((m) => m.CatalogPage),
      },
      {
        path: `${ADMIN_ROUTES.product}/${ADMIN_ROUTES.newProduct}`,
        loadComponent: () =>
          import('./features/product/product-page/product-page').then((m) => m.ProductPage),
      },
      {
        path: `${ADMIN_ROUTES.product}/:${ADMIN_ROUTES.productIdParam}`,
        loadComponent: () =>
          import('./features/product/product-page/product-page').then((m) => m.ProductPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
