/**
 * i18n toolchain. Run with `bun run i18n` (write) or `bun run i18n:check` (verify).
 *
 * For each app that has a locale folder, in order:
 *  1. Generates its `translation-keys.generated.ts` from the SOURCE locale, so
 *     every translation key is a typed constant instead of a magic string.
 *  2. Verifies every other locale has exactly the same key set as the source —
 *     a missing or extra key is a build failure, not a runtime blank.
 *  3. Verifies no translation value is an empty string.
 *
 * `--check` makes it read-only and non-zero on drift. That is the CI mode.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const SOURCE_LOCALE = 'es';

interface LocaleSet {
  readonly name: string;
  readonly localesDir: string;
  readonly outputFile: string;
}

const LOCALE_SETS: readonly LocaleSet[] = [
  {
    name: 'site',
    localesDir: join(ROOT, 'public', 'i18n'),
    outputFile: join(ROOT, 'src', 'app', 'core', 'i18n', 'translation-keys.generated.ts'),
  },
  {
    name: 'admin',
    localesDir: join(ROOT, 'projects', 'admin', 'public', 'i18n'),
    outputFile: join(
      ROOT,
      'projects',
      'admin',
      'src',
      'app',
      'core',
      'i18n',
      'translation-keys.generated.ts',
    ),
  },
];

interface TranslationTree {
  readonly [key: string]: string | TranslationTree;
}

const isCheckMode = process.argv.includes('--check');

/** Flattens `{ a: { b: "x" } }` into `["a.b"]`, reporting empty values. */
function leafPaths(tree: TranslationTree, errors: string[], prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      if (value.trim() === '') errors.push(`empty value at "${path}"`);
      return [path];
    }
    return leafPaths(value, errors, path);
  });
}

/** Emits the nested `T` const: `T.landing.hero.headline === 'landing.hero.headline'`. */
function emitKeys(tree: TranslationTree, prefix = '', depth = 1): string {
  const pad = '  '.repeat(depth);
  return Object.entries(tree)
    .map(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const name = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return typeof value === 'string'
        ? `${pad}${name}: '${path}',`
        : `${pad}${name}: {\n${emitKeys(value, path, depth + 1)}\n${pad}},`;
    })
    .join('\n');
}

/** Generates or checks one app's keys; returns the problems found. */
function processSet(set: LocaleSet): string[] {
  const errors: string[] = [];
  const readLocale = (locale: string): TranslationTree =>
    JSON.parse(readFileSync(join(set.localesDir, `${locale}.json`), 'utf8')) as TranslationTree;

  const locales = readdirSync(set.localesDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort();
  if (!locales.includes(SOURCE_LOCALE)) {
    return [`${set.name}: source locale "${SOURCE_LOCALE}.json" is missing from ${set.localesDir}`];
  }

  const source = readLocale(SOURCE_LOCALE);
  const sourcePaths = leafPaths(source, errors);
  const sourceSet = new Set(sourcePaths);

  for (const locale of locales) {
    if (locale === SOURCE_LOCALE) continue;
    const targetSet = new Set(leafPaths(readLocale(locale), errors));
    for (const path of sourceSet) {
      if (!targetSet.has(path)) errors.push(`${set.name}/${locale}.json is missing key "${path}"`);
    }
    for (const path of targetSet) {
      if (!sourceSet.has(path)) {
        errors.push(`${set.name}/${locale}.json has key "${path}" not in ${SOURCE_LOCALE}.json`);
      }
    }
  }

  const generated = `// GENERATED FILE — do not edit by hand.
// Source: ${set.name} ${SOURCE_LOCALE}.json. Regenerate with \`bun run i18n\`.
//
// Import \`T\` instead of writing translation keys as string literals:
//   protected readonly t = T;                       // in the component
//   {{ translate(t.landing.hero.headline) }}        // in the template
//
// A renamed or deleted key becomes a compile error here rather than a blank
// string in production.

export const T = {
${emitKeys(source)}
} as const;

/** Every valid translation key, as a union of literal strings. */
export type TranslationKey = ${sourcePaths.map((path) => `'${path}'`).join(' | ')};
`;

  if (errors.length > 0) return errors;

  if (isCheckMode) {
    const current = existsSync(set.outputFile) ? readFileSync(set.outputFile, 'utf8') : '';
    if (current !== generated) {
      return [`${set.name}: translation-keys.generated.ts is stale. Run \`bun run i18n\`.`];
    }
    console.log(
      `i18n: ${set.name} — ${sourcePaths.length} keys, ${locales.length} locale(s), in sync.`,
    );
  } else {
    writeFileSync(set.outputFile, generated);
    console.log(
      `i18n: ${set.name} — wrote ${sourcePaths.length} keys from ${SOURCE_LOCALE}.json (locales: ${locales.join(', ')}).`,
    );
  }
  return [];
}

const problems = LOCALE_SETS.flatMap(processSet);
if (problems.length > 0) {
  console.error(`i18n: ${problems.length} problem(s) found:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
