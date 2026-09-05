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
    product: {
      title: 'meta.product.title',
      description: 'meta.product.description',
    },
  },
  a11y: {
    skipToContent: 'a11y.skipToContent',
    mainNavigation: 'a11y.mainNavigation',
    changeLanguage: 'a11y.changeLanguage',
    switchToDarkTheme: 'a11y.switchToDarkTheme',
    switchToLightTheme: 'a11y.switchToLightTheme',
    openWhatsapp: 'a11y.openWhatsapp',
    priceUpdated: 'a11y.priceUpdated',
    previousPiece: 'a11y.previousPiece',
    nextPiece: 'a11y.nextPiece',
    pieces: 'a11y.pieces',
  },
  common: {
    language: {
      es: 'common.language.es',
      en: 'common.language.en',
    },
  },
  navigation: {
    catalog: 'navigation.catalog',
    orders: 'navigation.orders',
  },
  landing: {
    hero: {
      eyebrow: 'landing.hero.eyebrow',
      headline: 'landing.hero.headline',
      body: 'landing.hero.body',
      primaryAction: 'landing.hero.primaryAction',
      secondaryAction: 'landing.hero.secondaryAction',
    },
    orders: {
      statement: 'landing.orders.statement',
      action: 'landing.orders.action',
    },
  },
  catalog: {
    section: {
      eyebrow: 'catalog.section.eyebrow',
      title: 'catalog.section.title',
      subtitle: 'catalog.section.subtitle',
    },
    card: {
      fromPrice: 'catalog.card.fromPrice',
      customize: 'catalog.card.customize',
    },
    groups: {
      portions: 'catalog.groups.portions',
      layers: 'catalog.groups.layers',
      fruit: 'catalog.groups.fruit',
    },
    hints: {
      layers: 'catalog.hints.layers',
      fruit: 'catalog.hints.fruit',
    },
    portions: {
      "8": 'catalog.portions.8',
      "12": 'catalog.portions.12',
      "16": 'catalog.portions.16',
    },
    layers: {
      fresa: 'catalog.layers.fresa',
      crema: 'catalog.layers.crema',
      durazno: 'catalog.layers.durazno',
      maracuya: 'catalog.layers.maracuya',
      limon: 'catalog.layers.limon',
      uva: 'catalog.layers.uva',
      leche: 'catalog.layers.leche',
      vainilla: 'catalog.layers.vainilla',
      mora: 'catalog.layers.mora',
      "frutos-rojos": 'catalog.layers.frutos-rojos',
      cereza: 'catalog.layers.cereza',
      granadilla: 'catalog.layers.granadilla',
      coco: 'catalog.layers.coco',
    },
    fruits: {
      fresa: 'catalog.fruits.fresa',
      uva: 'catalog.fruits.uva',
      durazno: 'catalog.fruits.durazno',
      kiwi: 'catalog.fruits.kiwi',
      mango: 'catalog.fruits.mango',
      pina: 'catalog.fruits.pina',
    },
    products: {
      "jardin-de-frutas": {
        name: 'catalog.products.jardin-de-frutas.name',
        note: 'catalog.products.jardin-de-frutas.note',
        description: 'catalog.products.jardin-de-frutas.description',
        imageAlt: 'catalog.products.jardin-de-frutas.imageAlt',
      },
      "mosaico-fresa-crema": {
        name: 'catalog.products.mosaico-fresa-crema.name',
        note: 'catalog.products.mosaico-fresa-crema.note',
        description: 'catalog.products.mosaico-fresa-crema.description',
        imageAlt: 'catalog.products.mosaico-fresa-crema.imageAlt',
      },
      "uva-nocturna": {
        name: 'catalog.products.uva-nocturna.name',
        note: 'catalog.products.uva-nocturna.note',
        description: 'catalog.products.uva-nocturna.description',
        imageAlt: 'catalog.products.uva-nocturna.imageAlt',
      },
      "rubi-clasica": {
        name: 'catalog.products.rubi-clasica.name',
        note: 'catalog.products.rubi-clasica.note',
        description: 'catalog.products.rubi-clasica.description',
        imageAlt: 'catalog.products.rubi-clasica.imageAlt',
      },
      "capas-de-fresa": {
        name: 'catalog.products.capas-de-fresa.name',
        note: 'catalog.products.capas-de-fresa.note',
        description: 'catalog.products.capas-de-fresa.description',
        imageAlt: 'catalog.products.capas-de-fresa.imageAlt',
      },
    },
    customizer: {
      eyebrow: 'catalog.customizer.eyebrow',
      back: 'catalog.customizer.back',
      order: 'catalog.customizer.order',
      summaryPortions: 'catalog.customizer.summaryPortions',
      summaryFruit: 'catalog.customizer.summaryFruit',
    },
    order: {
      greeting: 'catalog.order.greeting',
      product: 'catalog.order.product',
      portions: 'catalog.order.portions',
      option: 'catalog.order.option',
      total: 'catalog.order.total',
      closing: 'catalog.order.closing',
    },
    missing: {
      title: 'catalog.missing.title',
      body: 'catalog.missing.body',
      action: 'catalog.missing.action',
    },
  },
  footer: {
    tagline: 'footer.tagline',
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
export type TranslationKey = 'meta.home.title' | 'meta.home.description' | 'meta.product.title' | 'meta.product.description' | 'a11y.skipToContent' | 'a11y.mainNavigation' | 'a11y.changeLanguage' | 'a11y.switchToDarkTheme' | 'a11y.switchToLightTheme' | 'a11y.openWhatsapp' | 'a11y.priceUpdated' | 'a11y.previousPiece' | 'a11y.nextPiece' | 'a11y.pieces' | 'common.language.es' | 'common.language.en' | 'navigation.catalog' | 'navigation.orders' | 'landing.hero.eyebrow' | 'landing.hero.headline' | 'landing.hero.body' | 'landing.hero.primaryAction' | 'landing.hero.secondaryAction' | 'landing.orders.statement' | 'landing.orders.action' | 'catalog.section.eyebrow' | 'catalog.section.title' | 'catalog.section.subtitle' | 'catalog.card.fromPrice' | 'catalog.card.customize' | 'catalog.groups.portions' | 'catalog.groups.layers' | 'catalog.groups.fruit' | 'catalog.hints.layers' | 'catalog.hints.fruit' | 'catalog.portions.8' | 'catalog.portions.12' | 'catalog.portions.16' | 'catalog.layers.fresa' | 'catalog.layers.crema' | 'catalog.layers.durazno' | 'catalog.layers.maracuya' | 'catalog.layers.limon' | 'catalog.layers.uva' | 'catalog.layers.leche' | 'catalog.layers.vainilla' | 'catalog.layers.mora' | 'catalog.layers.frutos-rojos' | 'catalog.layers.cereza' | 'catalog.layers.granadilla' | 'catalog.layers.coco' | 'catalog.fruits.fresa' | 'catalog.fruits.uva' | 'catalog.fruits.durazno' | 'catalog.fruits.kiwi' | 'catalog.fruits.mango' | 'catalog.fruits.pina' | 'catalog.products.jardin-de-frutas.name' | 'catalog.products.jardin-de-frutas.note' | 'catalog.products.jardin-de-frutas.description' | 'catalog.products.jardin-de-frutas.imageAlt' | 'catalog.products.mosaico-fresa-crema.name' | 'catalog.products.mosaico-fresa-crema.note' | 'catalog.products.mosaico-fresa-crema.description' | 'catalog.products.mosaico-fresa-crema.imageAlt' | 'catalog.products.uva-nocturna.name' | 'catalog.products.uva-nocturna.note' | 'catalog.products.uva-nocturna.description' | 'catalog.products.uva-nocturna.imageAlt' | 'catalog.products.rubi-clasica.name' | 'catalog.products.rubi-clasica.note' | 'catalog.products.rubi-clasica.description' | 'catalog.products.rubi-clasica.imageAlt' | 'catalog.products.capas-de-fresa.name' | 'catalog.products.capas-de-fresa.note' | 'catalog.products.capas-de-fresa.description' | 'catalog.products.capas-de-fresa.imageAlt' | 'catalog.customizer.eyebrow' | 'catalog.customizer.back' | 'catalog.customizer.order' | 'catalog.customizer.summaryPortions' | 'catalog.customizer.summaryFruit' | 'catalog.order.greeting' | 'catalog.order.product' | 'catalog.order.portions' | 'catalog.order.option' | 'catalog.order.total' | 'catalog.order.closing' | 'catalog.missing.title' | 'catalog.missing.body' | 'catalog.missing.action' | 'footer.tagline' | 'errors.notFound.title' | 'errors.notFound.body' | 'errors.notFound.action';
