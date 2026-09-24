import { CENTS_PER_UNIT, PERCENT, PRICE_STEP, SALE_PRICE_STEPS } from './catalog.constants';
import type { Margin, MarginKind } from './catalog.document';

// The owner's price calculator: cost plus a margin gives a raw figure, and the
// figure actually quoted is the next round number up. The final price stays
// the owner's call; these functions only propose and describe.

export interface PriceSuggestion {
  /** Cost plus margin, exactly. */
  readonly raw: number;
  /** The raw figure on the price grid: the closest figure that can be quoted as is. */
  readonly exact: number;
  /** The raw figure rounded to the sale step of its price band. */
  readonly suggested: number;
}

/** What a chosen price leaves over the cost, as money and as a share of the cost. */
export interface EffectiveMargin {
  readonly amount: number;
  readonly percent: number;
}

function toCents(value: number): number {
  return Math.round(value * CENTS_PER_UNIT);
}

function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

/** The sale step for a figure: half dollars while small, fives from ten up. */
export function saleStepFor(value: number): number {
  const band =
    SALE_PRICE_STEPS.find((candidate) => value < candidate.below) ?? SALE_PRICE_STEPS.at(-1);
  return band?.step ?? PRICE_STEP;
}

/** Rounds a figure to the nearest multiple of a step, in cents so floating point cannot drift. */
export function snapToStep(value: number, step: number): number {
  const stepCents = toCents(step);
  return fromCents(Math.round(toCents(value) / stepCents) * stepCents);
}

/** Rounds a raw figure to the nearest step of its band; a figure already on the step stays. */
export function roundToSaleStep(value: number): number {
  return snapToStep(value, saleStepFor(value));
}

/** Rounds a figure to the price grid every quoted price sits on. */
export function roundToPriceStep(value: number): number {
  return snapToStep(value, PRICE_STEP);
}

export function suggestedPrice(cost: number, margin: Margin): PriceSuggestion {
  const raw =
    margin.kind === 'percent'
      ? fromCents(toCents(cost * (1 + margin.value / PERCENT)))
      : fromCents(toCents(cost + margin.value));
  return { raw, exact: roundToPriceStep(raw), suggested: roundToSaleStep(raw) };
}

/** The margin that makes cost plus margin land exactly on a price the owner typed. */
export function marginFor(cost: number, price: number, kind: MarginKind): number {
  const amount = fromCents(toCents(price) - toCents(cost));
  if (kind === 'amount') return amount;
  return cost === 0 ? 0 : (amount / cost) * PERCENT;
}

export function effectiveMargin(cost: number, price: number): EffectiveMargin {
  const amount = fromCents(toCents(price) - toCents(cost));
  return { amount, percent: cost === 0 ? 0 : (amount / cost) * PERCENT };
}
