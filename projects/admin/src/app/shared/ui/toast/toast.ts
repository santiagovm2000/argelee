import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { BRAND_ART } from '@shared/ui/brand/brand-art';
import { Caustics } from '@shared/ui/caustics/caustics';
import { ToastService } from '../../../core/ui/toast.service';

/**
 * The app's passing notice that something went well: a drop of the brand's
 * water with a sunflower at its edge, read out politely and gone on its own.
 */
@Component({
  selector: 'arg-toast',
  imports: [TranslocoDirective, Caustics],
  templateUrl: './toast.html',
})
export class Toast {
  protected readonly toast = inject(ToastService);
  protected readonly daisy = BRAND_ART.daisy;
}
