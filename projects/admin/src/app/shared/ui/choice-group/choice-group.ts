import { Component, input, output } from '@angular/core';
import type { ChoiceOption } from '@shared/ui/choice-list/choice-list';

/** Chips backed by native checkboxes, so keyboard and screen reader behaviour come for free; any number may be ticked. */
@Component({
  selector: 'arg-choice-group',
  templateUrl: './choice-group.html',
})
export class ChoiceGroup<Id extends string> {
  readonly legend = input.required<string>();
  readonly name = input.required<string>();
  readonly options = input.required<readonly ChoiceOption<Id>[]>();
  readonly selected = input.required<readonly Id[]>();
  readonly selectedChange = output<readonly Id[]>();

  protected isSelected(id: Id): boolean {
    return this.selected().includes(id);
  }

  protected toggle(id: Id): void {
    const selected = this.selected();
    this.selectedChange.emit(
      selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id],
    );
  }
}
