import type { Routes } from '@angular/router';
import { CHROME_DATA_KEY, type PageChrome } from '../../core/config/page-chrome';
import { ROUTE_PATHS } from '../../core/config/routes';

// The link hub stands alone: its own WhatsApp button replaces the floating one,
// and the wordmark on the page replaces the footer.
const LINKS_CHROME: Partial<PageChrome> = { footer: false, whatsappWidget: false };

export const linksRoutes: Routes = [
  {
    path: ROUTE_PATHS.home,
    data: { [CHROME_DATA_KEY]: LINKS_CHROME },
    loadComponent: () => import('./pages/links-page/links-page').then((m) => m.LinksPage),
  },
];
