import { Component, input, output } from '@angular/core';
import { toggleChoice } from '../../../core/catalog/selection';

export interface ChoiceOption<Id extends string> {
  readonly id: Id;
  readonly label: string;
}

/**
 * A group of chips backed by native radios or checkboxes, so keyboard and screen
 * reader behaviour come for free. A group never goes empty: a click that would
 * uncheck the last choice is cancelled before the browser toggles the control.
 */
@Component({
  selector: 'arg-choice-group',
  templateUrl: './choice-group.html',
})
export class ChoiceGroup<Id extends string> {
  readonly legend = input.required<string>();
  readonly hint = input<string>('');
  readonly name = input.required<string>();
  readonly options = input.required<readonly ChoiceOption<Id>[]>();
  readonly selected = input.required<readonly Id[]>();
  readonly single = input<boolean>(false);
  readonly selectedChange = output<readonly Id[]>();

  protected isSelected(id: Id): boolean {
    return this.selected().includes(id);
  }

  protected onClick(event: Event, id: Id): void {
    const next = this.single()
      ? this.isSelected(id)
        ? this.selected()
        : [id]
      : toggleChoice(this.selected(), id);
    if (next === this.selected()) {
      event.preventDefault();
      return;
    }
    this.selectedChange.emit(next);
  }
}
