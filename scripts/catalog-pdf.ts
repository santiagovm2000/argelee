/**
 * Local preview of the price list. Run with `bun run catalog-pdf` while
 * `bun start` is up: it renders the same HTML the admin Worker sends to
 * Browser Run, from the catalogue snapshot, and prints it with Edge to
 * dist/ArGeles-catalogo.pdf, then says how many pages came out.
 *
 * Production never runs this: the panel's "Generar PDF" does the same in the
 * cloud and stores the result in R2.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CATALOG_SNAPSHOT } from '../src/app/core/catalog/catalog.snapshot.generated';
import { renderCatalogHtml } from '../src/app/core/catalog/pdf/catalog-pdf';
import {
  PDF_FONT_FILES,
  PDF_PAGE_HEIGHT_MM,
  PDF_PAGE_WIDTH_MM,
} from '../src/app/core/catalog/pdf/catalog-pdf.constants';
import { SITE } from '../src/app/core/config/app.constants';
import { DEFAULT_LANGUAGE } from '../src/app/core/i18n/i18n.constants';
import locale from '../public/i18n/es.json';

const ROOT = resolve(import.meta.dir, '..');
const OUTPUT_DIR = join(ROOT, 'dist');
const OUTPUT_FILE = join(OUTPUT_DIR, SITE.catalogPdf);
const FONTS_DIR = join(ROOT, 'src', 'styles', 'fonts');
const ICONS_DIR = join(ROOT, 'public', 'icons', 'orders');
const EDGE_FILE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEV_SITE_ORIGIN = 'http://localhost:8787';
const RENDER_BUDGET_MS = 8000;
const PX_PER_MM = 96 / 25.4;
const PAGE_WIDTH_PX = Math.round(PDF_PAGE_WIDTH_MM * PX_PER_MM);
const PAGE_HEIGHT_PX = Math.round(PDF_PAGE_HEIGHT_MM * PX_PER_MM);
const PDF_PAGE_OBJECT = /\/Type\s*\/Page[^s]/g;

/** The drawing inside public/icons/orders/<id>.svg, without its outer <svg> element. */
function glyphMarkup(id: string): string {
  const svg = readFileSync(join(ICONS_DIR, `${id}.svg`), 'utf8');
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];
  if (inner === undefined) throw new Error(`catalog-pdf: ${id}.svg is not an SVG file`);
  return inner.trim();
}

const html = renderCatalogHtml({
  catalog: CATALOG_SNAPSHOT,
  locale,
  language: DEFAULT_LANGUAGE,
  brand: SITE.wordmark,
  whatsappNumber: SITE.whatsappNumber,
  assets: {
    fontUrl: (role) => pathToFileURL(join(FONTS_DIR, PDF_FONT_FILES[role])).href,
    photoUrl: (key) => `${DEV_SITE_ORIGIN}/${key}`,
    coverPhotoUrl: (key) => `${DEV_SITE_ORIGIN}/${key}`,
    iconMarkup: glyphMarkup,
  },
});

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
        `--virtual-time-budget=${String(RENDER_BUDGET_MS)}`,
        `--window-size=${String(PAGE_WIDTH_PX)},${String(PAGE_HEIGHT_PX)}`,
        outputFlag,
        pathToFileURL(htmlFile).href,
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    );
    const code = await edge.exited;
    if (code !== 0 || !existsSync(outputFile)) {
      throw new Error(
        `catalog-pdf: Edge exited with ${String(code)} and did not write ${outputFile}`,
      );
    }
  } finally {
    rmSync(profileDir, { recursive: true, force: true });
  }
}

if (!existsSync(EDGE_FILE)) {
  console.error(`catalog-pdf: Edge not found at ${EDGE_FILE}; it is the local print engine.`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const htmlFile = join(OUTPUT_DIR, 'catalog-preview.html');
writeFileSync(htmlFile, html);
await runEdge(htmlFile, `--print-to-pdf=${OUTPUT_FILE}`, OUTPUT_FILE);
const pages = readFileSync(OUTPUT_FILE, 'latin1').match(PDF_PAGE_OBJECT)?.length ?? 0;
console.log(
  `catalog-pdf: wrote ${OUTPUT_FILE} (${String(CATALOG_SNAPSHOT.products.length)} pieces, ${String(pages)} pages).`,
);
