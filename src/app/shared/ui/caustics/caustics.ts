import { Component, input } from '@angular/core';
import { BRAND_ART } from '../brand/brand-art';

/** How the water moves: with the first screen of scroll, across its own scene, or not at all. */
export type CausticsMotion = 'depth' | 'drift' | 'still';

/**
 * The brand's water pattern behind a scene: its lighter shapes and its bright
 * channels on two layers, drawn in the scene's --caustic colour, so each can
 * move at its own depth (motion.css).
 */
@Component({
  selector: 'arg-caustics',
  templateUrl: './caustics.html',
  host: { class: 'caustics', 'aria-hidden': 'true' },
})
export class Caustics {
  readonly motion = input<CausticsMotion>('still');
  protected readonly light = BRAND_ART.causticsLight;
  protected readonly glint = BRAND_ART.causticsGlint;
}
