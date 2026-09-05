import { Component, inject } from '@angular/core';
import { T } from '../../core/i18n/translation-keys.generated';
import { LanguageService } from '../../core/i18n/language.service';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'arg-not-found-page',
  imports: [EmptyState],
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  protected readonly t = T;
  protected readonly language = inject(LanguageService);
}
