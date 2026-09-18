import type { Product } from './catalog.model';

// The whole menu, in the order of the owner's price list. Add a piece here and
// its names in public/i18n/<lang>.json, run `bun run i18n`, and the shelf, the
// product page and the sitemap pick it up. `serves: null` sells the piece by
// the unit: the configurator asks how many, and `price` is the price of one.
//
// Flavours and fruit follow the owner's "frutas y sabores por pieza" sheet:
// what each piece admits, and how many choices it takes. A group listed as
// `null` is simply absent from the configurator. Every choice is included in
// the price; the defaults are what the photo shows. A group that takes several
// choices may be left empty; one that takes a single choice always has one. The
// sheet fixes the Napolitana at three stripes; the other maximums follow what
// fits the mould.
const ONE_CHOICE = 1;
const OPTIONAL = 0;

export const PRODUCTS: readonly Product[] = [
  {
    id: 'encapsulated-fruit',
    slug: 'encapsulada-de-frutas',
    image: 'catalogFruitCrystalLayer',
    price: 60,
    serves: [16, 20],
    flavours: {
      options: ['strawberry', 'cherry', 'raspberry', 'lemon', 'pineapple', 'grape'],
      defaults: ['strawberry'],
      min: OPTIONAL,
      max: 3,
    },
    fruits: {
      options: [
        'strawberry',
        'grape',
        'peach',
        'mango',
        'blackberry',
        'blueberry',
        'cherry',
        'tangerine',
        'pineapple',
      ],
      defaults: ['strawberry', 'grape', 'peach'],
      min: OPTIONAL,
      max: 4,
    },
  },
  {
    id: 'neapolitan-fruit',
    slug: 'napolitana-de-frutas',
    image: 'catalogStrawberryStripes',
    price: 45,
    serves: [16, 20],
    flavours: {
      options: ['strawberry', 'cherry', 'raspberry', 'lemon', 'pineapple', 'grape', 'tutti-frutti'],
      defaults: ['strawberry', 'lemon', 'pineapple'],
      min: OPTIONAL,
      max: 3,
    },
    fruits: {
      options: ['strawberry', 'peach', 'mango', 'grape', 'blackberry'],
      defaults: ['strawberry'],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'tres-leches-crown',
    slug: 'corona-tres-leches',
    image: 'catalogCherryTresLechesRing',
    price: 35,
    serves: [16, 20],
    flavours: {
      options: ['cherry', 'strawberry', 'raspberry', 'grape', 'lemon', 'pineapple', 'tutti-frutti'],
      defaults: ['strawberry'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['strawberry', 'grape', 'cherry'],
      defaults: [],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'crowned-two-tone',
    slug: 'bicolor-coronada',
    image: 'catalogTwoToneGrape',
    price: 30,
    serves: [16, 20],
    flavours: {
      options: ['grape', 'strawberry', 'cherry', 'raspberry', 'pineapple', 'lemon'],
      defaults: ['grape'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['grape', 'strawberry', 'cherry', 'blackberry', 'blueberry', 'tangerine'],
      defaults: ['grape'],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'fresh-fruit-mosaic',
    slug: 'mosaico-de-fruta-fresca',
    image: 'catalogStrawberryCubes',
    price: 30,
    serves: [13, 16],
    flavours: {
      options: ['strawberry', 'cherry', 'raspberry', 'grape', 'pineapple', 'tutti-frutti'],
      defaults: ['strawberry'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['strawberry', 'peach', 'grape', 'mango', 'blackberry', 'blueberry', 'pineapple'],
      defaults: ['strawberry'],
      min: OPTIONAL,
      max: 3,
    },
  },
  {
    id: 'crystal-and-cream',
    slug: 'cristal-y-crema',
    image: 'catalogCherryCondensedMilk',
    price: 20,
    serves: [8, 10],
    flavours: {
      options: ['cherry', 'strawberry', 'raspberry', 'grape', 'lemon', 'pineapple', 'tutti-frutti'],
      defaults: ['strawberry'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: null,
  },
  {
    id: 'individual-portion',
    slug: 'porcion-individual',
    image: 'catalogStrawberryCup',
    price: 3.5,
    serves: null,
    flavours: {
      options: ['strawberry', 'cherry', 'raspberry', 'grape', 'pineapple', 'lemon'],
      defaults: ['strawberry'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['strawberry', 'grape', 'peach', 'blackberry', 'blueberry', 'mango'],
      defaults: ['strawberry'],
      min: OPTIONAL,
      max: 2,
    },
  },
];
