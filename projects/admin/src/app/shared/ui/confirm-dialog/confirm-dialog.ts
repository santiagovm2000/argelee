import { Component, effect, type ElementRef, inject, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { T } from '../../../core/i18n/translation-keys.generated';
import { ConfirmService } from '../../../core/ui/confirm.service';

/** The app's one modal question, on a native dialog: focus stays inside, and Esc answers no. */
@Component({
  selector: 'arg-confirm-dialog',
  imports: [TranslocoDirective],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  protected readonly t = T;
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (element === undefined) return;
      if (this.confirm.request() !== null) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }

  /** The dialog closed on its own (Esc): whatever was still pending is a no. */
  protected onClose(): void {
    this.confirm.answer(false);
  }
}
