import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ThemeService } from '../../core/theme/theme.service';
import { T } from '../../core/i18n/translation-keys.generated';

const CENTRE = 0.5;

@Component({
  selector: 'arg-theme-toggle',
  imports: [TranslocoDirective],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly t = T;

  /** Flips the theme from the centre of the button, so the reveal grows out of it. */
  protected flip(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      this.theme.toggle();
      return;
    }
    const rect = target.getBoundingClientRect();
    this.theme.toggleFrom({
      x: rect.left + rect.width * CENTRE,
      y: rect.top + rect.height * CENTRE,
    });
  }
}
