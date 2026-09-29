// GENERATED FILE — do not edit by hand.
// Source: site es.json. Regenerate with `bun run i18n`.
//
// Import `T` instead of writing translation keys as string literals:
//   protected readonly t = T;                       // in the component
//   {{ translate(t.landing.hero.headline) }}        // in the template
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
    links: {
      title: 'meta.links.title',
      description: 'meta.links.description',
    },
  },
  a11y: {
    skipToContent: 'a11y.skipToContent',
    mainNavigation: 'a11y.mainNavigation',
    footerNavigation: 'a11y.footerNavigation',
    changeLanguage: 'a11y.changeLanguage',
    switchToDarkTheme: 'a11y.switchToDarkTheme',
    switchToLightTheme: 'a11y.switchToLightTheme',
    openWhatsapp: 'a11y.openWhatsapp',
    priceUpdated: 'a11y.priceUpdated',
    previousPiece: 'a11y.previousPiece',
    nextPiece: 'a11y.nextPiece',
    pieces: 'a11y.pieces',
    fewerUnits: 'a11y.fewerUnits',
    moreUnits: 'a11y.moreUnits',
  },
  common: {
    language: {
      es: 'common.language.es',
      en: 'common.language.en',
    },
  },
  brand: {
    tagline: 'brand.tagline',
    seal: {
      top: 'brand.seal.top',
      bottom: 'brand.seal.bottom',
    },
  },
  navigation: {
    catalog: 'navigation.catalog',
    orders: 'navigation.orders',
  },
  landing: {
    hero: {
      headline: 'landing.hero.headline',
      body: 'landing.hero.body',
      primaryAction: 'landing.hero.primaryAction',
      secondaryAction: 'landing.hero.secondaryAction',
    },
    promise: {
      title: 'landing.promise.title',
      lead: 'landing.promise.lead',
      values: {
        punctuality: {
          title: 'landing.promise.values.punctuality.title',
          body: 'landing.promise.values.punctuality.body',
        },
        organization: {
          title: 'landing.promise.values.organization.title',
          body: 'landing.promise.values.organization.body',
        },
        quality: {
          title: 'landing.promise.values.quality.title',
          body: 'landing.promise.values.quality.body',
        },
      },
    },
    orders: {
      title: 'landing.orders.title',
      action: 'landing.orders.action',
      groups: {
        piece: 'landing.orders.groups.piece',
        payment: 'landing.orders.groups.payment',
        delivery: 'landing.orders.groups.delivery',
      },
      notes: {
        notice: 'landing.orders.notes.notice',
        fruit: 'landing.orders.notes.fruit',
        flavours: 'landing.orders.notes.flavours',
        availability: 'landing.orders.notes.availability',
        deposit: 'landing.orders.notes.deposit',
        receipt: 'landing.orders.notes.receipt',
        delivery: 'landing.orders.notes.delivery',
        deliveryFee: 'landing.orders.notes.deliveryFee',
        deliveryArea: 'landing.orders.notes.deliveryArea',
        currency: 'landing.orders.notes.currency',
      },
    },
  },
  catalog: {
    section: {
      title: 'catalog.section.title',
      subtitle: 'catalog.section.subtitle',
    },
    card: {
      from: 'catalog.card.from',
      each: 'catalog.card.each',
      price: 'catalog.card.price',
      unitPrice: 'catalog.card.unitPrice',
      customize: 'catalog.card.customize',
    },
    groups: {
      size: 'catalog.groups.size',
      quantity: 'catalog.groups.quantity',
      fruit: 'catalog.groups.fruit',
      flavours: 'catalog.groups.flavours',
    },
    hints: {
      quantity: 'catalog.hints.quantity',
    },
    flavours: {
      strawberry: 'catalog.flavours.strawberry',
      cherry: 'catalog.flavours.cherry',
      raspberry: 'catalog.flavours.raspberry',
      grape: 'catalog.flavours.grape',
      lemon: 'catalog.flavours.lemon',
      pineapple: 'catalog.flavours.pineapple',
      "tutti-frutti": 'catalog.flavours.tutti-frutti',
    },
    fruits: {
      strawberry: 'catalog.fruits.strawberry',
      grape: 'catalog.fruits.grape',
      peach: 'catalog.fruits.peach',
      blackberry: 'catalog.fruits.blackberry',
      blueberry: 'catalog.fruits.blueberry',
      cherry: 'catalog.fruits.cherry',
      pineapple: 'catalog.fruits.pineapple',
    },
    customizer: {
      eyebrow: 'catalog.customizer.eyebrow',
      back: 'catalog.customizer.back',
      order: 'catalog.customizer.order',
      serves: 'catalog.customizer.serves',
      from: 'catalog.customizer.from',
    },
    order: {
      greeting: 'catalog.order.greeting',
      product: 'catalog.order.product',
      closing: 'catalog.order.closing',
      quantity: 'catalog.order.quantity',
    },
    missing: {
      title: 'catalog.missing.title',
      body: 'catalog.missing.body',
      action: 'catalog.missing.action',
    },
  },
  footer: {
    tagline: 'footer.tagline',
    location: 'footer.location',
    pdf: 'footer.pdf',
  },
  errors: {
    notFound: {
      title: 'errors.notFound.title',
      body: 'errors.notFound.body',
      action: 'errors.notFound.action',
    },
  },
  links: {
    title: 'links.title',
    whatsapp: 'links.whatsapp',
    website: 'links.website',
    catalog: 'links.catalog',
  },
  pdf: {
    cover: {
      sub: 'pdf.cover.sub',
      title: 'pdf.cover.title',
      lead: 'pdf.cover.lead',
      tag: 'pdf.cover.tag',
    },
    band: {
      serves: 'pdf.band.serves',
      unit: 'pdf.band.unit',
      unitVolume: 'pdf.band.unitVolume',
    },
    perUnit: 'pdf.perUnit',
    order: {
      title: 'pdf.order.title',
      lead: 'pdf.order.lead',
    },
  },
} as const;

/** Every valid translation key, as a union of literal strings. */
export type TranslationKey = 'meta.home.title' | 'meta.home.description' | 'meta.product.title' | 'meta.product.description' | 'meta.links.title' | 'meta.links.description' | 'a11y.skipToContent' | 'a11y.mainNavigation' | 'a11y.footerNavigation' | 'a11y.changeLanguage' | 'a11y.switchToDarkTheme' | 'a11y.switchToLightTheme' | 'a11y.openWhatsapp' | 'a11y.priceUpdated' | 'a11y.previousPiece' | 'a11y.nextPiece' | 'a11y.pieces' | 'a11y.fewerUnits' | 'a11y.moreUnits' | 'common.language.es' | 'common.language.en' | 'brand.tagline' | 'brand.seal.top' | 'brand.seal.bottom' | 'navigation.catalog' | 'navigation.orders' | 'landing.hero.headline' | 'landing.hero.body' | 'landing.hero.primaryAction' | 'landing.hero.secondaryAction' | 'landing.promise.title' | 'landing.promise.lead' | 'landing.promise.values.punctuality.title' | 'landing.promise.values.punctuality.body' | 'landing.promise.values.organization.title' | 'landing.promise.values.organization.body' | 'landing.promise.values.quality.title' | 'landing.promise.values.quality.body' | 'landing.orders.title' | 'landing.orders.action' | 'landing.orders.groups.piece' | 'landing.orders.groups.payment' | 'landing.orders.groups.delivery' | 'landing.orders.notes.notice' | 'landing.orders.notes.fruit' | 'landing.orders.notes.flavours' | 'landing.orders.notes.availability' | 'landing.orders.notes.deposit' | 'landing.orders.notes.receipt' | 'landing.orders.notes.delivery' | 'landing.orders.notes.deliveryFee' | 'landing.orders.notes.deliveryArea' | 'landing.orders.notes.currency' | 'catalog.section.title' | 'catalog.section.subtitle' | 'catalog.card.from' | 'catalog.card.each' | 'catalog.card.price' | 'catalog.card.unitPrice' | 'catalog.card.customize' | 'catalog.groups.size' | 'catalog.groups.quantity' | 'catalog.groups.fruit' | 'catalog.groups.flavours' | 'catalog.hints.quantity' | 'catalog.flavours.strawberry' | 'catalog.flavours.cherry' | 'catalog.flavours.raspberry' | 'catalog.flavours.grape' | 'catalog.flavours.lemon' | 'catalog.flavours.pineapple' | 'catalog.flavours.tutti-frutti' | 'catalog.fruits.strawberry' | 'catalog.fruits.grape' | 'catalog.fruits.peach' | 'catalog.fruits.blackberry' | 'catalog.fruits.blueberry' | 'catalog.fruits.cherry' | 'catalog.fruits.pineapple' | 'catalog.customizer.eyebrow' | 'catalog.customizer.back' | 'catalog.customizer.order' | 'catalog.customizer.serves' | 'catalog.customizer.from' | 'catalog.order.greeting' | 'catalog.order.product' | 'catalog.order.closing' | 'catalog.order.quantity' | 'catalog.missing.title' | 'catalog.missing.body' | 'catalog.missing.action' | 'footer.tagline' | 'footer.location' | 'footer.pdf' | 'errors.notFound.title' | 'errors.notFound.body' | 'errors.notFound.action' | 'links.title' | 'links.whatsapp' | 'links.website' | 'links.catalog' | 'pdf.cover.sub' | 'pdf.cover.title' | 'pdf.cover.lead' | 'pdf.cover.tag' | 'pdf.band.serves' | 'pdf.band.unit' | 'pdf.band.unitVolume' | 'pdf.perUnit' | 'pdf.order.title' | 'pdf.order.lead';
