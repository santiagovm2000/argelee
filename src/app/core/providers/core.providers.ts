import { DOCUMENT, isPlatformBrowser, ViewportScroller } from '@angular/common';
import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  PreloadAllModules,
  Router,
  type UrlTree,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
  type ViewTransitionInfo,
} from '@angular/router';
import { routes } from '../../app.routes';
import { provideI18n } from '../i18n/i18n.providers';
import { provideImages } from '../images/image.loader';

// The token the anchored sections use for scroll-margin-top. The router scrolls
// with window.scrollTo, which ignores scroll-margin, so it gets the same value.
const ANCHOR_OFFSET_TOKEN = '--spacing-anchor';
const ROOT_FONT_SIZE_PX = 16;

// On the root element while a page change animates; base.css makes the
// router's own scroll instant under it.
const PAGE_CHANGE_CLASS = 'arg-page-change';

/** Reads the anchor offset from the live stylesheet, so the CSS token stays the single source. */
function anchorOffset(document: Document): [number, number] {
  const style = getComputedStyle(document.documentElement);
  const rem = Number.parseFloat(style.getPropertyValue(ANCHOR_OFFSET_TOKEN));
  const fontSize = Number.parseFloat(style.fontSize) || ROOT_FONT_SIZE_PX;
  return [0, Number.isNaN(rem) ? 0 : rem * fontSize];
}

/** True when the navigation only changes the fragment: a scroll, not a page change. */
function staysOnPage(router: Router): boolean {
  const previous = router.lastSuccessfulNavigation()?.finalUrl;
  const current = router.currentNavigation();
  const next = current?.finalUrl ?? current?.extractedUrl;
  if (previous === undefined || next === undefined) return false;
  const path = (tree: UrlTree): string => router.serializeUrl(tree).split('#')[0] ?? '';
  return path(previous) === path(next);
}

/**
 * Cross-fading the whole document while it scrolls to an anchor reads as a
 * stutter and interrupts the hero video, so a fragment-only navigation skips
 * the view transition. A real page change keeps it, and marks the root so the
 * router's scroll to the top (or to the anchor on the way back) lands before
 * the new page is captured instead of animating inside the live snapshot.
 */
function onPageChange({ transition }: ViewTransitionInfo): void {
  if (staysOnPage(inject(Router))) {
    transition.skipTransition();
    return;
  }
  const root = inject(DOCUMENT).documentElement;
  root.classList.add(PAGE_CHANGE_CLASS);
  const settle = (): void => {
    root.classList.remove(PAGE_CHANGE_CLASS);
  };
  transition.finished.then(settle, settle);
}

/** Everything the app needs to boot, in one place. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({ onViewTransitionCreated: onPageChange }),
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
    provideI18n(),
    provideImages(),
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
      const document = inject(DOCUMENT);
      inject(ViewportScroller).setOffset(() => anchorOffset(document));
    }),
  ]);
}
