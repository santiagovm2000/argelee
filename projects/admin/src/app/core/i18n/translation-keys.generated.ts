// GENERATED FILE — do not edit by hand.
// Source: admin es.json. Regenerate with `bun run i18n`.
//
// Import `T` instead of writing translation keys as string literals:
//   protected readonly t = T;                       // in the component
//   {{ translate(t.landing.hero.headline) }}        // in the template
//
// A renamed or deleted key becomes a compile error here rather than a blank
// string in production.

export const T = {
  app: {
    title: 'app.title',
    skipToContent: 'app.skipToContent',
  },
  nav: {
    catalog: 'nav.catalog',
    site: 'nav.site',
    logout: 'nav.logout',
    menu: 'nav.menu',
    darkTheme: 'nav.darkTheme',
  },
  login: {
    title: 'login.title',
    user: 'login.user',
    password: 'login.password',
    submit: 'login.submit',
    submitting: 'login.submitting',
    failed: 'login.failed',
    tooMany: 'login.tooMany',
    offline: 'login.offline',
    tagline: 'login.tagline',
    lead: 'login.lead',
    site: 'login.site',
  },
  catalog: {
    title: 'catalog.title',
    count: 'catalog.count',
    new: 'catalog.new',
    loading: 'catalog.loading',
    empty: 'catalog.empty',
    edit: 'catalog.edit',
    delete: 'catalog.delete',
    confirmDeleteTitle: 'catalog.confirmDeleteTitle',
    confirmDeleteBody: 'catalog.confirmDeleteBody',
    published: 'catalog.published',
    hidden: 'catalog.hidden',
    noPhoto: 'catalog.noPhoto',
    perUnit: 'catalog.perUnit',
    serves: 'catalog.serves',
    search: 'catalog.search',
    noMatches: 'catalog.noMatches',
    reorder: 'catalog.reorder',
  },
  save: {
    dirty: 'save.dirty',
    action: 'save.action',
    saving: 'save.saving',
    conflict: 'save.conflict',
    reload: 'save.reload',
    invalid: 'save.invalid',
    offline: 'save.offline',
    discard: 'save.discard',
  },
  pdf: {
    current: 'pdf.current',
    stale: 'pdf.stale',
    staleAfterSave: 'pdf.staleAfterSave',
    missing: 'pdf.missing',
    generate: 'pdf.generate',
    generating: 'pdf.generating',
    failed: 'pdf.failed',
    open: 'pdf.open',
  },
  product: {
    newTitle: 'product.newTitle',
    editTitle: 'product.editTitle',
    back: 'product.back',
    save: 'product.save',
    saving: 'product.saving',
    missing: 'product.missing',
    sections: {
      text: 'product.sections.text',
      photo: 'product.sections.photo',
      size: 'product.sections.size',
      flavours: 'product.sections.flavours',
      fruits: 'product.sections.fruits',
      pricing: 'product.sections.pricing',
      visibility: 'product.sections.visibility',
    },
    fields: {
      spanish: 'product.fields.spanish',
      name: 'product.fields.name',
      note: 'product.fields.note',
      noteHint: 'product.fields.noteHint',
      description: 'product.fields.description',
      descriptionHint: 'product.fields.descriptionHint',
      published: 'product.fields.published',
      publishedHint: 'product.fields.publishedHint',
    },
    size: {
      whole: 'product.size.whole',
      unit: 'product.size.unit',
      from: 'product.size.from',
      to: 'product.size.to',
    },
    options: {
      enabledFlavours: 'product.options.enabledFlavours',
      enabledFruits: 'product.options.enabledFruits',
      offered: 'product.options.offered',
    },
    pricing: {
      mode: 'product.pricing.mode',
      fixed: 'product.pricing.fixed',
      calculated: 'product.pricing.calculated',
      cost: 'product.pricing.cost',
      marginKind: 'product.pricing.marginKind',
      percent: 'product.pricing.percent',
      amount: 'product.pricing.amount',
      marginValue: 'product.pricing.marginValue',
      price: 'product.pricing.price',
      choice: 'product.pricing.choice',
      exact: 'product.pricing.exact',
      rounded: 'product.pricing.rounded',
      effective: 'product.pricing.effective',
    },
    photo: {
      upload: 'product.photo.upload',
      replace: 'product.photo.replace',
      uploading: 'product.photo.uploading',
      failed: 'product.photo.failed',
      hint: 'product.photo.hint',
      empty: 'product.photo.empty',
    },
    errors: {
      title: 'product.errors.title',
      required: 'product.errors.required',
    },
  },
  a11y: {
    photoOf: 'a11y.photoOf',
    pieces: 'a11y.pieces',
    switchToDarkTheme: 'a11y.switchToDarkTheme',
    switchToLightTheme: 'a11y.switchToLightTheme',
    search: 'a11y.search',
  },
  dialog: {
    cancel: 'dialog.cancel',
  },
} as const;

/** Every valid translation key, as a union of literal strings. */
export type TranslationKey = 'app.title' | 'app.skipToContent' | 'nav.catalog' | 'nav.site' | 'nav.logout' | 'nav.menu' | 'nav.darkTheme' | 'login.title' | 'login.user' | 'login.password' | 'login.submit' | 'login.submitting' | 'login.failed' | 'login.tooMany' | 'login.offline' | 'login.tagline' | 'login.lead' | 'login.site' | 'catalog.title' | 'catalog.count' | 'catalog.new' | 'catalog.loading' | 'catalog.empty' | 'catalog.edit' | 'catalog.delete' | 'catalog.confirmDeleteTitle' | 'catalog.confirmDeleteBody' | 'catalog.published' | 'catalog.hidden' | 'catalog.noPhoto' | 'catalog.perUnit' | 'catalog.serves' | 'catalog.search' | 'catalog.noMatches' | 'catalog.reorder' | 'save.dirty' | 'save.action' | 'save.saving' | 'save.conflict' | 'save.reload' | 'save.invalid' | 'save.offline' | 'save.discard' | 'pdf.current' | 'pdf.stale' | 'pdf.staleAfterSave' | 'pdf.missing' | 'pdf.generate' | 'pdf.generating' | 'pdf.failed' | 'pdf.open' | 'product.newTitle' | 'product.editTitle' | 'product.back' | 'product.save' | 'product.saving' | 'product.missing' | 'product.sections.text' | 'product.sections.photo' | 'product.sections.size' | 'product.sections.flavours' | 'product.sections.fruits' | 'product.sections.pricing' | 'product.sections.visibility' | 'product.fields.spanish' | 'product.fields.name' | 'product.fields.note' | 'product.fields.noteHint' | 'product.fields.description' | 'product.fields.descriptionHint' | 'product.fields.published' | 'product.fields.publishedHint' | 'product.size.whole' | 'product.size.unit' | 'product.size.from' | 'product.size.to' | 'product.options.enabledFlavours' | 'product.options.enabledFruits' | 'product.options.offered' | 'product.pricing.mode' | 'product.pricing.fixed' | 'product.pricing.calculated' | 'product.pricing.cost' | 'product.pricing.marginKind' | 'product.pricing.percent' | 'product.pricing.amount' | 'product.pricing.marginValue' | 'product.pricing.price' | 'product.pricing.choice' | 'product.pricing.exact' | 'product.pricing.rounded' | 'product.pricing.effective' | 'product.photo.upload' | 'product.photo.replace' | 'product.photo.uploading' | 'product.photo.failed' | 'product.photo.hint' | 'product.photo.empty' | 'product.errors.title' | 'product.errors.required' | 'a11y.photoOf' | 'a11y.pieces' | 'a11y.switchToDarkTheme' | 'a11y.switchToLightTheme' | 'a11y.search' | 'dialog.cancel';
