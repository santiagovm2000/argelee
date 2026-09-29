import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { T } from '../../../core/i18n/translation-keys.generated';
import { BRAND_ART } from '../brand/brand-art';

let sealCount = 0;

/**
 * The round label the brand seals its cups with: "Hecho con amor" over the
 * AG monogram, "Para endulzar tu día" under it, set around the edge.
 * Decoration only; its words are the brand's, not information.
 */
@Component({
  selector: 'arg-seal',
  imports: [TranslocoDirective],
  templateUrl: './seal.html',
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class Seal {
  protected readonly t = T;
  protected readonly monogram = BRAND_ART.monogram;
  private readonly id = `seal-${String(sealCount++)}`;
  protected readonly topArc = `${this.id}-top`;
  protected readonly bottomArc = `${this.id}-bottom`;
}
