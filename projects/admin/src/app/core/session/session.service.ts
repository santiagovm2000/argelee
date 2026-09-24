import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ADMIN_API,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '@workers/shared/admin-api.constants';

export type LoginOutcome = 'ok' | 'rejected' | 'too-many' | 'offline';

interface SessionInfo {
  readonly user: string;
  readonly expiresAt: number;
}

const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY = 429;

/** Who is signed in, as far as the browser knows; the cookie itself is out of reach of scripts. */
@Service()
export class SessionService {
  private readonly http = inject(HttpClient);

  readonly user = signal<string | null>(null);
  /** True once the server has been asked at least once, so guards do not redirect prematurely. */
  readonly resolved = signal(false);

  /** Asks the server whether the cookie still stands. */
  async restore(): Promise<boolean> {
    try {
      const info = await firstValueFrom(this.http.get<SessionInfo>(ADMIN_API.me));
      this.user.set(info.user);
    } catch {
      this.user.set(null);
    } finally {
      this.resolved.set(true);
    }
    return this.user() !== null;
  }

  async login(user: string, password: string): Promise<LoginOutcome> {
    try {
      const info = await firstValueFrom(
        this.http.post<SessionInfo>(ADMIN_API.login, { user, password }),
      );
      this.user.set(info.user);
      this.resolved.set(true);
      return 'ok';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === HTTP_UNAUTHORIZED) return 'rejected';
        if (error.status === HTTP_TOO_MANY) return 'too-many';
      }
      return 'offline';
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(ADMIN_API.logout, null, {
          headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
        }),
      );
    } finally {
      this.user.set(null);
    }
  }
}
