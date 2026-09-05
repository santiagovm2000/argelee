import { Component, input } from '@angular/core';
import { SITE } from '../../../core/config/app.constants';

export type WordmarkSize = 'compact' | 'display';

@Component({
  selector: 'arg-wordmark',
  templateUrl: './wordmark.html',
  host: { class: 'inline-block' },
})
export class Wordmark {
  readonly size = input<WordmarkSize>('compact');
  protected readonly wordmark = SITE.wordmark;
}
