import { Component } from '@angular/core';
import { SITE } from '../../core/config/app.constants';

@Component({
  selector: 'arg-site-footer',
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
}
