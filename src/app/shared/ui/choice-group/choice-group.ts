import { Component, computed, input, output } from '@angular/core';
import type { ChoiceLimits } from '../../../core/catalog/catalog.model';
import { toggleChoice } from '../../../core/catalog/selection';

export interface ChoiceOption<Id extends string> {
  readonly id: Id;
  readonly label: string;
  /** The URL of the option's glyph file, drawn beside the label. */
  readonly icon: string;
}

/**
 * A group of chips backed by native radios or checkboxes, so keyboard and screen
 * reader behaviour come for free. The group keeps within its limits: a click
 * that would empty it below its minimum is cancelled before the browser
 * toggles the control, a full group greys out what is left, and a group that
 * takes a single choice swaps it.
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
  readonly limits = input.required<ChoiceLimits>();
  readonly selectedChange = output<readonly Id[]>();

  protected readonly single = computed(() => this.limits().max === 1);
  protected readonly full = computed(() => {
    const max = this.limits().max;
    return max !== null && !this.single() && this.selected().length >= max;
  });

  protected isSelected(id: Id): boolean {
    return this.selected().includes(id);
  }

  protected isDisabled(id: Id): boolean {
    return this.full() && !this.isSelected(id);
  }

  protected onClick(event: Event, id: Id): void {
    const next = toggleChoice(this.selected(), id, this.limits());
    if (next === this.selected()) {
      event.preventDefault();
      return;
    }
    this.selectedChange.emit(next);
  }
}
