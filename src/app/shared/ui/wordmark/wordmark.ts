import { Component } from '@angular/core';
import { SITE } from '../../../core/config/app.constants';
import { BRAND_ART } from '../brand/brand-art';

/** The ArGeles logo, drawn in the current text colour at the width its host is given. */
@Component({
  selector: 'arg-wordmark',
  templateUrl: './wordmark.html',
  host: { class: 'block' },
})
export class Wordmark {
  protected readonly name = SITE.wordmark;
  protected readonly art = BRAND_ART.logo;
}
