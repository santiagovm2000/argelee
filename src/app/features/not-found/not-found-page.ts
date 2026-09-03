import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { T } from '../../core/i18n/translation-keys.generated';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'arg-not-found-page',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  protected readonly t = T;
  protected readonly language = inject(LanguageService);
}
