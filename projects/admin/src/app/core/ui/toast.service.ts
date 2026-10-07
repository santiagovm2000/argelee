import { Service, signal } from '@angular/core';
import { TOAST_DURATION_MS } from '../config/admin.constants';
import type { TranslationKey } from '../i18n/translation-keys.generated';

export interface ToastMessage {
  readonly key: TranslationKey;
  readonly params?: Readonly<Record<string, string>>;
}

/** One passing notice at a time: anyone shows it, the toast the app mounts once lets it go on its own. */
@Service()
export class ToastService {
  readonly message = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(message: ToastMessage): void {
    this.dismiss();
    this.message.set(message);
    this.timer = setTimeout(() => {
      this.dismiss();
    }, TOAST_DURATION_MS);
  }

  dismiss(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.message.set(null);
  }
}
