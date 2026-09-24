import { Service, signal } from '@angular/core';
import type { TranslationKey } from '../i18n/translation-keys.generated';

export interface ConfirmRequest {
  readonly titleKey: TranslationKey;
  readonly bodyKey: TranslationKey;
  readonly confirmKey: TranslationKey;
  readonly params?: Readonly<Record<string, string>>;
  /** A destructive question gets the wine button, so the weight of the choice is visible. */
  readonly danger?: boolean;
}

/** One question at a time: anyone asks, the dialog the app mounts once answers. */
@Service()
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);
  private resolve: ((answer: boolean) => void) | null = null;

  ask(request: ConfirmRequest): Promise<boolean> {
    this.answer(false);
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.request.set(request);
    });
  }

  answer(answer: boolean): void {
    const resolve = this.resolve;
    this.resolve = null;
    this.request.set(null);
    resolve?.(answer);
  }
}
