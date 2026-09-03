// GENERATED FILE — do not edit by hand.
// Source: public/i18n/es.json. Regenerate with `bun run i18n`.
//
// Import `T` instead of writing translation keys as string literals:
//   protected readonly t = T;                       // in the component
//   {{ t.landing.hero.headline | transloco }}       // in the template
//
// A renamed or deleted key becomes a compile error here rather than a blank
// string in production.

export const T = {
  meta: {
    home: {
      title: 'meta.home.title',
      description: 'meta.home.description',
    },
  },
  a11y: {
    skipToContent: 'a11y.skipToContent',
    mainNavigation: 'a11y.mainNavigation',
    openMenu: 'a11y.openMenu',
    closeMenu: 'a11y.closeMenu',
    changeLanguage: 'a11y.changeLanguage',
    switchToDarkTheme: 'a11y.switchToDarkTheme',
    switchToLightTheme: 'a11y.switchToLightTheme',
  },
  common: {
    actions: {
      back: 'common.actions.back',
      retry: 'common.actions.retry',
      close: 'common.actions.close',
    },
    language: {
      es: 'common.language.es',
      en: 'common.language.en',
    },
  },
  navigation: {
    home: 'navigation.home',
  },
  landing: {
    hero: {
      headline: 'landing.hero.headline',
      subheadline: 'landing.hero.subheadline',
      primaryAction: 'landing.hero.primaryAction',
      secondaryAction: 'landing.hero.secondaryAction',
    },
  },
  errors: {
    notFound: {
      title: 'errors.notFound.title',
      body: 'errors.notFound.body',
      action: 'errors.notFound.action',
    },
  },
} as const;

/** Every valid translation key, as a union of literal strings. */
export type TranslationKey = 'meta.home.title' | 'meta.home.description' | 'a11y.skipToContent' | 'a11y.mainNavigation' | 'a11y.openMenu' | 'a11y.closeMenu' | 'a11y.changeLanguage' | 'a11y.switchToDarkTheme' | 'a11y.switchToLightTheme' | 'common.actions.back' | 'common.actions.retry' | 'common.actions.close' | 'common.language.es' | 'common.language.en' | 'navigation.home' | 'landing.hero.headline' | 'landing.hero.subheadline' | 'landing.hero.primaryAction' | 'landing.hero.secondaryAction' | 'errors.notFound.title' | 'errors.notFound.body' | 'errors.notFound.action';
