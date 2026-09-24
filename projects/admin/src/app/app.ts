import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ThemeService } from '@core/theme/theme.service';
import { T } from './core/i18n/translation-keys.generated';
import { SessionService } from './core/session/session.service';
import { AdminHeader } from './layout/admin-header/admin-header';
import { ConfirmDialog } from './shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'arg-root',
  imports: [ConfirmDialog, RouterOutlet, RouterLink, TranslocoDirective, AdminHeader],
  templateUrl: './app.html',
})
export class App {
  protected readonly session = inject(SessionService);
  protected readonly t = T;

  constructor() {
    this.applyStoredTheme();
  }

  /** Creates the theme service at boot so the stored preference applies before the first paint. */
  private applyStoredTheme(): void {
    inject(ThemeService);
  }
}
