/**
 * i18n toolchain. Run with `bun run i18n` (write) or `bun run i18n:check` (verify).
 *
 * Does three things, in order:
 *  1. Generates `translation-keys.generated.ts` from the SOURCE locale, so every
 *     translation key is a typed constant instead of a magic string.
 *  2. Verifies every other locale has exactly the same key set as the source —
 *     a missing or extra key is a build failure, not a runtime blank.
 *  3. Verifies no translation value is an empty string.
 *
 * `--check` makes it read-only and non-zero on drift. That is the CI mode.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const LOCALES_DIR = join(ROOT, 'public', 'i18n');
const OUTPUT_FILE = join(ROOT, 'src', 'app', 'core', 'i18n', 'translation-keys.generated.ts');
const SOURCE_LOCALE = 'es';

interface TranslationTree {
  readonly [key: string]: string | TranslationTree;
}

const isCheckMode = process.argv.includes('--check');
const errors: string[] = [];

function readLocale(locale: string): TranslationTree {
  return JSON.parse(readFileSync(join(LOCALES_DIR, `${locale}.json`), 'utf8')) as TranslationTree;
}

/** Flattens `{ a: { b: "x" } }` into `["a.b"]`. */
function leafPaths(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      if (value.trim() === '') errors.push(`empty value at "${path}"`);
      return [path];
    }
    return leafPaths(value, path);
  });
}

/** Emits the nested `T` const: `T.landing.hero.headline === 'landing.hero.headline'`. */
function emitKeys(tree: TranslationTree, prefix = '', depth = 1): string {
  const pad = '  '.repeat(depth);
  const body = Object.entries(tree)
    .map(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const name = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return typeof value === 'string'
        ? `${pad}${name}: '${path}',`
        : `${pad}${name}: {\n${emitKeys(value, path, depth + 1)}\n${pad}},`;
    })
    .join('\n');
  return body;
}

const localeFiles = readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

if (!localeFiles.includes(SOURCE_LOCALE)) {
  console.error(`i18n: source locale "${SOURCE_LOCALE}.json" is missing from ${LOCALES_DIR}`);
  process.exit(1);
}

const source = readLocale(SOURCE_LOCALE);
const sourcePaths = leafPaths(source);
const sourceSet = new Set(sourcePaths);

for (const locale of localeFiles) {
  if (locale === SOURCE_LOCALE) continue;
  const targetSet = new Set(leafPaths(readLocale(locale)));
  for (const path of sourceSet) {
    if (!targetSet.has(path)) errors.push(`${locale}.json is missing key "${path}"`);
  }
  for (const path of targetSet) {
    if (!sourceSet.has(path))
      errors.push(`${locale}.json has key "${path}" not in ${SOURCE_LOCALE}.json`);
  }
}

const generated = `// GENERATED FILE — do not edit by hand.
// Source: public/i18n/${SOURCE_LOCALE}.json. Regenerate with \`bun run i18n\`.
//
// Import \`T\` instead of writing translation keys as string literals:
//   protected readonly t = T;                       // in the component
//   {{ t.landing.hero.headline | transloco }}       // in the template
//
// A renamed or deleted key becomes a compile error here rather than a blank
// string in production.

export const T = {
${emitKeys(source)}
} as const;

/** Every valid translation key, as a union of literal strings. */
export type TranslationKey = ${sourcePaths.map((path) => `'${path}'`).join(' | ')};
`;

if (errors.length > 0) {
  console.error(`i18n: ${errors.length} problem(s) found:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (isCheckMode) {
  const current = (() => {
    try {
      return readFileSync(OUTPUT_FILE, 'utf8');
    } catch {
      return '';
    }
  })();
  if (current !== generated) {
    console.error('i18n: translation-keys.generated.ts is stale. Run `bun run i18n`.');
    process.exit(1);
  }
  console.log(`i18n: ${sourcePaths.length} keys, ${localeFiles.length} locales, all in sync.`);
} else {
  writeFileSync(OUTPUT_FILE, generated);
  console.log(
    `i18n: wrote ${sourcePaths.length} keys from ${SOURCE_LOCALE}.json (locales: ${localeFiles.join(', ')}).`,
  );
}
