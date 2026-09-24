import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { DEPLOYMENT } from '@core/config/build-config.generated';
import { ThemeService } from '@core/theme/theme.service';
import { ADMIN_ROUTES } from '../../core/config/admin.constants';
import { T } from '../../core/i18n/translation-keys.generated';
import { SessionService } from '../../core/session/session.service';

const CENTRE = 0.5;

/** One button in the corner: the site, the way out, and the theme switch, in a menu that closes on its own. */
@Component({
  selector: 'arg-admin-menu',
  imports: [TranslocoDirective],
  templateUrl: './admin-menu.html',
  host: {
    class: 'relative block',
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class AdminMenu {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly switchEl = viewChild<ElementRef<HTMLElement>>('themeSwitch');

  protected readonly theme = inject(ThemeService);
  protected readonly t = T;
  protected readonly siteUrl = DEPLOYMENT.origin;
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected closeIfOutside(event: Event): void {
    if (!(event.target instanceof Node) || this.host.nativeElement.contains(event.target)) return;
    this.close();
  }

  /** Flips the theme from the switch itself, so the reveal grows out of it. */
  protected flipTheme(): void {
    const element = this.switchEl()?.nativeElement;
    if (element === undefined) {
      this.theme.toggle();
      return;
    }
    const rect = element.getBoundingClientRect();
    this.theme.toggleFrom({
      x: rect.left + rect.width * CENTRE,
      y: rect.top + rect.height * CENTRE,
    });
  }

  protected async logout(): Promise<void> {
    this.close();
    await this.session.logout();
    await this.router.navigate([ADMIN_ROUTES.login]);
  }
}
