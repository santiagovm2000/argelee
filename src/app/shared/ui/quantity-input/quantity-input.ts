import { Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { MIN_UNIT_QUANTITY, QUANTITY_STEP } from '../../../core/catalog/catalog.constants';
import { T } from '../../../core/i18n/translation-keys.generated';

/**
 * A quantity stepper: a native number field between a minus and a plus button.
 * The value never drops below the minimum, and a field left empty or invalid
 * snaps back to the last good value when it loses focus.
 */
@Component({
  selector: 'arg-quantity-input',
  imports: [TranslocoDirective],
  templateUrl: './quantity-input.html',
})
export class QuantityInput {
  readonly legend = input.required<string>();
  readonly hint = input<string>('');
  readonly name = input.required<string>();
  readonly value = input.required<number>();
  readonly valueChange = output<number>();

  protected readonly t = T;
  protected readonly min = MIN_UNIT_QUANTITY;

  protected step(direction: -1 | 1): void {
    this.set(this.value() + direction * QUANTITY_STEP);
  }

  protected onInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const typed = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(typed)) return;
    this.set(typed);
  }

  protected onBlur(event: Event): void {
    if (event.target instanceof HTMLInputElement) event.target.value = String(this.value());
  }

  private set(next: number): void {
    const clamped = Math.max(this.min, Math.round(next));
    if (clamped !== this.value()) this.valueChange.emit(clamped);
  }
}
