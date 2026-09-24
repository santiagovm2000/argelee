import { Component, input } from '@angular/core';

export interface ChoiceOption<Id extends string> {
  readonly id: Id;
  readonly label: string;
  /** The URL of the option's glyph file, drawn beside the label. */
  readonly icon: string;
}

/** The flavours or the fruit a piece comes with, for reading only: a titled row of glyph chips. */
@Component({
  selector: 'arg-choice-list',
  templateUrl: './choice-list.html',
})
export class ChoiceList<Id extends string> {
  readonly legend = input.required<string>();
  readonly options = input.required<readonly ChoiceOption<Id>[]>();
}
