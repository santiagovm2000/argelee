import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { T } from '../../../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-hero-section',
  imports: [TranslocoDirective, ButtonModule],
  templateUrl: './hero-section.html',
})
export class HeroSection {
  protected readonly t = T;
}
