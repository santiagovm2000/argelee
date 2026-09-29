import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { Bloom } from '../../../../shared/ui/bloom/bloom';
import { BRAND_ART } from '../../../../shared/ui/brand/brand-art';
import { Caustics } from '../../../../shared/ui/caustics/caustics';
import { PROMISE_VALUES } from './promise.data';

/**
 * The brand's promise on the Turquesa Vital lagoon: its key message in the
 * script voice and the three values it answers a host's worries with.
 */
@Component({
  selector: 'arg-promise-section',
  imports: [TranslocoDirective, Caustics, Bloom],
  templateUrl: './promise-section.html',
  host: { class: 'block' },
})
export class PromiseSection {
  protected readonly t = T;
  protected readonly values = PROMISE_VALUES;
  protected readonly daisy = BRAND_ART.daisy;
}
