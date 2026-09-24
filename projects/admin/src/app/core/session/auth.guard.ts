import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ADMIN_ROUTES } from '../config/admin.constants';
import { SessionService } from './session.service';

/** Lets a request through with a live session; otherwise sends it to the login page. */
export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const signedIn = session.resolved() ? session.user() !== null : await session.restore();
  return signedIn ? true : router.createUrlTree([ADMIN_ROUTES.login]);
};
