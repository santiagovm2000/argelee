import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { DEPLOYMENT } from '@core/config/build-config.generated';
import { IMAGES } from '@core/images/image-manifest.generated';
import { srcsetFor } from '@core/images/image.loader';
import { Wordmark } from '@shared/ui/wordmark/wordmark';
import { T } from '../../core/i18n/translation-keys.generated';
import { type LoginOutcome, SessionService } from '../../core/session/session.service';
import { ThemeToggle } from '../../layout/theme-toggle/theme-toggle';

interface LoginModel {
  user: string;
  password: string;
}

const FAILURE_KEYS: Readonly<Record<Exclude<LoginOutcome, 'ok'>, string>> = {
  rejected: T.login.failed,
  'too-many': T.login.tooMany,
  offline: T.login.offline,
};

/** The door to the panel: the site's own still on one side, the form on the other. */
@Component({
  selector: 'arg-login-page',
  imports: [TranslocoDirective, FormField, NgOptimizedImage, Wordmark, ThemeToggle],
  templateUrl: './login-page.html',
  host: { class: 'block' },
})
export class LoginPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly t = T;
  protected readonly poster = IMAGES.heroPoster;
  protected readonly posterSrcset = srcsetFor(IMAGES.heroPoster);
  protected readonly siteUrl = DEPLOYMENT.origin;
  protected readonly model = signal<LoginModel>({ user: '', password: '' });
  protected readonly f = form(this.model, (path) => {
    required(path.user);
    required(path.password);
  });
  protected readonly busy = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy() || !this.f().valid()) return;
    this.busy.set(true);
    this.failure.set(null);
    const { user, password } = this.model();
    const outcome = await this.session.login(user.trim(), password);
    this.busy.set(false);
    if (outcome === 'ok') {
      await this.router.navigate(['/']);
      return;
    }
    this.failure.set(FAILURE_KEYS[outcome]);
    this.model.update((current) => ({ ...current, password: '' }));
  }
}
