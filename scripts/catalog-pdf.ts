/**
 * Prints the price-list catalogue, public/ArGeles-catalogo.pdf, from assets-src/catalog.
 * Run with `bun run catalog-pdf`. See docs/CATALOG.md.
 *
 * The template holds the layout, the photos and their crops. Everything a
 * customer reads comes from the same data as the site: piece names, prices,
 * people served and descriptions from PRODUCTS and public/i18n/es.json, the
 * order conditions from ORDER_CONDITION_GROUPS. So a price changes in one
 * place and both the page and the PDF follow.
 *
 * Rendering is Edge in headless mode printing the filled HTML to A4; no
 * browser dependency is added to the project because Edge ships with Windows.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { PRODUCTS } from '../src/app/core/catalog/catalog.data';
import { PRICE_FRACTION_DIGITS, PRICE_LOCALES } from '../src/app/core/catalog/catalog.constants';
import { ORDER_CONDITION_GROUPS } from '../src/app/core/catalog/order-conditions.data';
import { DEFAULT_LANGUAGE } from '../src/app/core/i18n/i18n.constants';
import { T } from '../src/app/core/i18n/translation-keys.generated';

const ROOT = resolve(import.meta.dir, '..');
const SOURCE_DIR = join(ROOT, 'assets-src', 'catalog');
const TEMPLATE_FILE = join(SOURCE_DIR, 'catalog.html');
const FILLED_FILE = join(SOURCE_DIR, 'catalog.filled.html');
const LOCALE_FILE = join(ROOT, 'public', 'i18n', `${DEFAULT_LANGUAGE}.json`);
const ICONS_DIR = join(ROOT, 'public', 'icons', 'orders');
const OUTPUT_FILE = join(ROOT, 'public', 'ArGeles-catalogo.pdf');

const EDGE_FILE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
// Time Edge gives the page to load fonts and photos before printing.
const RENDER_BUDGET_MS = 8000;
// A4 at 96 dpi, and the number of pages the template lays out, for the preview screenshot.
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_COUNT = 4;
const PREVIEW_FILE = join(tmpdir(), 'argelee-catalog-preview.png');

const wantsPreview = process.argv.includes('--preview');

type Translations = Record<string, unknown>;

/** Resolves a dotted translation key against the locale file, or fails loudly. */
function translate(translations: Translations, key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => {
    return typeof node === 'object' && node !== null ? (node as Translations)[part] : undefined;
  }, translations);
  if (typeof value !== 'string') throw new Error(`catalog-pdf: no translation for ${key}`);
  return value;
}

/** "{{from}}" placeholders, the way Transloco interpolates them. */
function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => String(params[name] ?? ''));
}

/** The number part of a price in the catalogue's locale: "60", "3,50". */
function priceDigits(amount: number): string {
  const digits = Number.isInteger(amount) ? 0 : PRICE_FRACTION_DIGITS;
  return new Intl.NumberFormat(PRICE_LOCALES[DEFAULT_LANGUAGE], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

function fillTemplate(): string {
  const translations = JSON.parse(readFileSync(LOCALE_FILE, 'utf8')) as Translations;
  const dom = new JSDOM(readFileSync(TEMPLATE_FILE, 'utf8'));
  const { document } = dom.window;

  for (const product of PRODUCTS) {
    const article = document.querySelector(`[data-product="${product.id}"]`);
    if (article === null) {
      throw new Error(
        `catalog-pdf: ${product.id} has no slot in catalog.html (see docs/CATALOG.md)`,
      );
    }
    const keys = T.catalog.products[product.id];
    const heading = article.querySelector('h3');
    const price = article.querySelector('.price');
    const description = article.querySelector('[data-description]');
    if (heading === null || price === null || description === null) {
      throw new Error(
        `catalog-pdf: the ${product.id} slot lacks a name, price or description element`,
      );
    }
    heading.textContent = translate(translations, keys.name);
    price.innerHTML =
      `<span class="from">${translate(translations, T.catalog.customizer.from)}</span>` +
      `<span class="amount"><small>$</small>${priceDigits(product.price)}</span>`;
    description.textContent = translate(translations, keys.description);

    const serves = article.querySelector('[data-serves]');
    if (serves !== null && product.serves !== null) {
      const [from, to] = product.serves;
      serves.textContent = interpolate(translate(translations, T.catalog.customizer.serves), {
        from,
        to,
      });
    }
  }

  const conditionsTitle = document.querySelector('[data-conditions-title]');
  const conditions = document.querySelector('[data-conditions]');
  const groupTemplate = document.querySelector<HTMLTemplateElement>('#condition-group');
  if (conditionsTitle === null || conditions === null || groupTemplate === null) {
    throw new Error('catalog-pdf: catalog.html lacks the conditions page or its template');
  }
  conditionsTitle.textContent = translate(translations, T.landing.orders.title);
  for (const group of ORDER_CONDITION_GROUPS) {
    const fragment = groupTemplate.content.cloneNode(true) as DocumentFragment;
    const icon = fragment.querySelector('svg');
    const title = fragment.querySelector('h3 > span');
    const list = fragment.querySelector('ul');
    if (icon === null || title === null || list === null) {
      throw new Error('catalog-pdf: the condition-group template changed shape');
    }
    icon.innerHTML = glyphMarkup(group.id);
    title.textContent = translate(translations, group.titleKey);
    for (const noteKey of group.noteKeys) {
      const item = document.createElement('li');
      item.textContent = translate(translations, noteKey);
      list.appendChild(item);
    }
    conditions.appendChild(fragment);
  }

  return dom.serialize();
}

/** The drawing inside public/icons/orders/<id>.svg, without its outer <svg> element. */
function glyphMarkup(id: string): string {
  const svg = readFileSync(join(ICONS_DIR, `${id}.svg`), 'utf8');
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];
  if (inner === undefined) throw new Error(`catalog-pdf: ${id}.svg is not an SVG file`);
  return inner.trim();
}

/** Runs headless Edge once with the given output flag and checks that the file appeared. */
async function runEdge(htmlFile: string, outputFlag: string, outputFile: string): Promise<void> {
  const profileDir = mkdtempSync(join(tmpdir(), 'argelee-catalog-'));
  try {
    const edge = Bun.spawn(
      [
        EDGE_FILE,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-pdf-header-footer',
        `--user-data-dir=${profileDir}`,
        `--virtual-time-budget=${RENDER_BUDGET_MS}`,
        `--window-size=${PAGE_WIDTH_PX},${PAGE_HEIGHT_PX * PAGE_COUNT}`,
        outputFlag,
        pathToFileURL(htmlFile).href,
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    );
    const code = await edge.exited;
    if (code !== 0 || !existsSync(outputFile)) {
      throw new Error(`catalog-pdf: Edge exited with ${code} and did not write ${outputFile}`);
    }
  } finally {
    rmSync(profileDir, { recursive: true, force: true });
  }
}

/** Prints the PDF and, with --preview, a PNG of every page stacked, to check the layout. */
async function printToPdf(htmlFile: string): Promise<void> {
  if (!existsSync(EDGE_FILE)) {
    throw new Error(`catalog-pdf: Edge not found at ${EDGE_FILE}; it is the print engine`);
  }
  await runEdge(htmlFile, `--print-to-pdf=${OUTPUT_FILE}`, OUTPUT_FILE);
  if (wantsPreview) {
    await runEdge(htmlFile, `--screenshot=${PREVIEW_FILE}`, PREVIEW_FILE);
    console.log(`catalog-pdf: preview at ${PREVIEW_FILE}`);
  }
}

writeFileSync(FILLED_FILE, fillTemplate());
try {
  await printToPdf(FILLED_FILE);
} finally {
  rmSync(FILLED_FILE, { force: true });
}
console.log(`catalog-pdf: wrote ${OUTPUT_FILE}`);
