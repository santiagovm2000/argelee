import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ThemeService } from '../../core/theme/theme.service';
import { T } from '../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-theme-toggle',
  imports: [TranslocoDirective],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly t = T;
}
