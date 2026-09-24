import { Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import type { ChoiceOption } from '@shared/ui/choice-list/choice-list';
import type { OptionDraft } from '../../../core/catalog/product-draft';
import { T } from '../../../core/i18n/translation-keys.generated';
import { ChoiceGroup } from '../../../shared/ui/choice-group/choice-group';

/** Whether a piece states its flavours (or fruit) on the site, and which ones it comes with. */
@Component({
  selector: 'arg-option-group-editor',
  imports: [TranslocoDirective, ChoiceGroup],
  templateUrl: './option-group-editor.html',
  host: { class: 'block' },
})
export class OptionGroupEditor<Id extends string> {
  readonly titleKey = input.required<string>();
  readonly enabledKey = input.required<string>();
  readonly name = input.required<string>();
  readonly choices = input.required<readonly ChoiceOption<Id>[]>();
  readonly draft = input.required<OptionDraft<Id>>();
  readonly draftChange = output<OptionDraft<Id>>();

  protected readonly t = T;

  protected setEnabled(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.draftChange.emit({ ...this.draft(), enabled: event.target.checked });
  }

  protected setOptions(options: readonly Id[]): void {
    this.draftChange.emit({ ...this.draft(), options });
  }
}
