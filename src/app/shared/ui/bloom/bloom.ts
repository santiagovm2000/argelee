import { Component, computed, input } from '@angular/core';
import { BRAND_ART } from '../brand/brand-art';
import { ARRANGEMENTS, type ArrangementName } from './bloom.data';

const HALF = 0.5;

/**
 * A spray of the brand's sunflowers as one drawing, so a scene can move the
 * whole spray as a single layer. Its host sets where it sits and how wide.
 */
@Component({
  selector: 'arg-bloom',
  templateUrl: './bloom.html',
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class Bloom {
  readonly arrangement = input.required<ArrangementName>();

  protected readonly daisy = BRAND_ART.daisy.href;
  protected readonly viewBox = computed(() => {
    const { width, height } = ARRANGEMENTS[this.arrangement()];
    return `0 0 ${String(width)} ${String(height)}`;
  });
  protected readonly flowers = computed(() =>
    ARRANGEMENTS[this.arrangement()].flowers.map((flower) => {
      const centre = flower.size * HALF;
      return {
        ...flower,
        transform: `rotate(${String(flower.turn)} ${String(flower.x + centre)} ${String(flower.y + centre)})`,
      };
    }),
  );
}
