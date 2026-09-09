import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/** What the shell shows around a page. A route trims it through `data[CHROME_DATA_KEY]`. */
export interface PageChrome {
  readonly footer: boolean;
  readonly whatsappWidget: boolean;
}

export const FULL_CHROME: PageChrome = { footer: true, whatsappWidget: true };

export const CHROME_DATA_KEY = 'chrome';

/** The chrome the active route asks for: every route on the way down may trim a part. */
export function pageChrome(state: RouterStateSnapshot): PageChrome {
  let chrome = FULL_CHROME;
  for (let route: ActivatedRouteSnapshot | null = state.root; route; route = route.firstChild) {
    chrome = { ...chrome, ...trimmedChrome(route.data[CHROME_DATA_KEY]) };
  }
  return chrome;
}

function trimmedChrome(value: unknown): Partial<PageChrome> {
  if (typeof value !== 'object' || value === null) return {};
  const trimmed: { -readonly [Part in keyof PageChrome]?: boolean } = {};
  if ('footer' in value && typeof value.footer === 'boolean') trimmed.footer = value.footer;
  if ('whatsappWidget' in value && typeof value.whatsappWidget === 'boolean') {
    trimmed.whatsappWidget = value.whatsappWidget;
  }
  return trimmed;
}
