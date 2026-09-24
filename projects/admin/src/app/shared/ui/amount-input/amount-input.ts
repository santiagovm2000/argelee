import {
  Component,
  computed,
  effect,
  type ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PRICE_LOCALES } from '@core/catalog/catalog.constants';
import { snapToStep } from '@core/catalog/costing';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';

export type AmountUnit = 'currency' | 'percent' | 'count';

const DECIMAL_SEPARATOR = ',';
const TYPED_SEPARATORS = /[.,]/;
const CURRENCY_SYMBOL = '$';
const PERCENT_SYMBOL = '%';
const DEFAULT_DECIMALS = 2;

interface Cleaned {
  readonly text: string;
  /** How many characters before the caret were dropped, so the caret can stay put. */
  readonly removedBeforeCaret: number;
}

/** Keeps digits and one decimal comma with at most `decimals` places; counts what was dropped before the caret. */
export function cleanAmount(raw: string, caret: number, decimals: number): Cleaned {
  let text = '';
  let removedBeforeCaret = 0;
  let separatorSeen = false;
  let fraction = 0;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index] ?? '';
    let keep = false;
    if (/\d/.test(char)) {
      if (!separatorSeen || fraction < decimals) {
        keep = true;
        if (separatorSeen) fraction += 1;
      }
    } else if (TYPED_SEPARATORS.test(char) && decimals > 0 && !separatorSeen) {
      keep = true;
      separatorSeen = true;
    }
    if (keep) text += separatorSeen && TYPED_SEPARATORS.test(char) ? DECIMAL_SEPARATOR : char;
    else if (index < caret) removedBeforeCaret += 1;
  }
  return { text, removedBeforeCaret };
}

/** "18,46" → 18.46; an empty or lone-comma field is zero. */
export function parseAmount(text: string): number {
  const normalized = text.replace(DECIMAL_SEPARATOR, '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** 18.46 → "18,46", 60 → "60", 1200 → "1.200": what the field shows while it is not being edited. */
export function formatAmount(value: number, decimals: number): string {
  return new Intl.NumberFormat(PRICE_LOCALES[DEFAULT_LANGUAGE], {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** What the field shows while it is being edited: no grouping, so every character is the person's own. */
function editableAmount(value: number, decimals: number): string {
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, '')
    .replace('.', DECIMAL_SEPARATOR);
}

/**
 * A money, percentage or count field typed as a mask: digits and a decimal
 * comma only, the unit's symbol inside the box, and a caret that stays where
 * the person left it. The number reaches the parent on every keystroke.
 */
@Component({
  selector: 'arg-amount-input',
  templateUrl: './amount-input.html',
  host: { class: 'block' },
})
export class AmountInput {
  readonly id = input.required<string>();
  readonly value = input.required<number>();
  readonly unit = input<AmountUnit>('currency');
  readonly decimals = input<number>(DEFAULT_DECIMALS);
  /** A grid the value snaps to when the field is left, such as the half-dollar prices are quoted in. */
  readonly step = input<number>(0);
  readonly valueChange = output<number>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly editing = signal(false);

  protected readonly prefix = computed(() => (this.unit() === 'currency' ? CURRENCY_SYMBOL : null));
  protected readonly suffix = computed(() => (this.unit() === 'percent' ? PERCENT_SYMBOL : null));
  protected readonly inputMode = computed(() => (this.decimals() > 0 ? 'decimal' : 'numeric'));

  constructor() {
    effect(() => {
      const value = this.value();
      const decimals = this.decimals();
      if (this.editing()) return;
      this.field().nativeElement.value = formatAmount(value, decimals);
    });
  }

  protected onFocus(): void {
    this.editing.set(true);
    const element = this.field().nativeElement;
    element.value = editableAmount(this.value(), this.decimals());
    element.select();
  }

  protected onInput(event: Event): void {
    const element = event.target;
    if (!(element instanceof HTMLInputElement)) return;
    const caret = element.selectionStart ?? element.value.length;
    const cleaned = cleanAmount(element.value, caret, this.decimals());
    if (cleaned.text !== element.value) {
      element.value = cleaned.text;
      const position = Math.max(0, caret - cleaned.removedBeforeCaret);
      element.setSelectionRange(position, position);
    }
    this.valueChange.emit(parseAmount(cleaned.text));
  }

  protected onBlur(): void {
    this.editing.set(false);
    const step = this.step();
    const value = step > 0 ? snapToStep(this.value(), step) : this.value();
    if (value !== this.value()) this.valueChange.emit(value);
    this.field().nativeElement.value = formatAmount(value, this.decimals());
  }
}
