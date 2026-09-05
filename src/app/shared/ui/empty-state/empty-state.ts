import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import type { TranslationKey } from '../../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-empty-state',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly titleKey = input.required<TranslationKey>();
  readonly bodyKey = input.required<TranslationKey>();
  readonly actionKey = input.required<TranslationKey>();
  readonly link = input.required<string>();
  readonly fragment = input<string | undefined>(undefined);
}
