import { describe, expect, it } from 'vitest';
import {
  effectiveMargin,
  marginFor,
  roundToPriceStep,
  roundToSaleStep,
  saleStepFor,
  snapToStep,
  suggestedPrice,
} from '@core/catalog/costing';

describe('roundToSaleStep', () => {
  it('rounds small figures to the nearest half dollar', () => {
    expect(roundToSaleStep(3.2)).toBe(3);
    expect(roundToSaleStep(1.34)).toBe(1.5);
    expect(roundToSaleStep(9.8)).toBe(10);
  });

  it('rounds figures from ten dollars to the nearest five', () => {
    expect(roundToSaleStep(12)).toBe(10);
    expect(roundToSaleStep(35.07)).toBe(35);
    expect(roundToSaleStep(28.99)).toBe(30);
    expect(roundToSaleStep(37.6)).toBe(40);
  });

  it('leaves a figure already on its step alone and names the step', () => {
    expect(roundToSaleStep(3.5)).toBe(3.5);
    expect(roundToSaleStep(35)).toBe(35);
    expect(saleStepFor(3)).toBe(0.5);
    expect(saleStepFor(35)).toBe(5);
  });
});

describe('snapToStep', () => {
  it('lands on the nearest multiple without floating-point drift', () => {
    expect(snapToStep(26.6, 0.5)).toBe(26.5);
    expect(snapToStep(26.75, 0.5)).toBe(27);
    expect(snapToStep(0.3, 0.1)).toBe(0.3);
    expect(roundToPriceStep(35.07)).toBe(35);
    expect(roundToPriceStep(3.26)).toBe(3.5);
  });
});

describe('suggestedPrice', () => {
  it('adds a percentage of the cost and offers the exact and the round figure', () => {
    const { raw, exact, suggested } = suggestedPrice(18.46, { kind: 'percent', value: 90 });
    expect(raw).toBe(35.07);
    expect(exact).toBe(35);
    expect(suggested).toBe(35);
  });

  it('adds a flat amount to the cost', () => {
    const { raw, exact, suggested } = suggestedPrice(14.78, { kind: 'amount', value: 12 });
    expect(raw).toBe(26.78);
    expect(exact).toBe(27);
    expect(suggested).toBe(25);
  });

  it('keeps cents honest in floating point', () => {
    expect(suggestedPrice(0.1, { kind: 'amount', value: 0.2 }).raw).toBe(0.3);
  });
});

describe('marginFor', () => {
  it('works the margin back from a typed price so cost plus margin lands on it', () => {
    expect(marginFor(18.46, 27, 'amount')).toBe(8.54);
    const percent = marginFor(18.46, 27, 'percent');
    expect(suggestedPrice(18.46, { kind: 'percent', value: percent }).raw).toBe(27);
    expect(marginFor(0, 10, 'percent')).toBe(0);
  });
});

describe('effectiveMargin', () => {
  it('reports what the chosen price leaves over the cost', () => {
    const margin = effectiveMargin(18.46, 35);
    expect(margin.amount).toBe(16.54);
    expect(margin.percent).toBeCloseTo(89.6, 1);
  });

  it('reports no percentage when there is no cost to compare against', () => {
    expect(effectiveMargin(0, 10)).toEqual({ amount: 10, percent: 0 });
  });
});
