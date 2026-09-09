/**
 * File-placement guard. Run with `bun run check:structure`.
 *
 * Enforces three rules a compiler cannot see:
 *  1. Every test lives under tests/. No spec files scattered next to source.
 *  2. No filename carries the project name.
 *  3. Every flavour and fruit the menu offers has its glyph file in public/icons/choices.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { PRODUCTS } from '../src/app/core/catalog/catalog.data';

const ROOT = resolve(import.meta.dir, '..');
const TESTS_DIR = 'tests';
const SCANNED_DIRS = ['src', 'tests', 'scripts', 'public', 'assets-src', 'docs'];
const TEST_SUFFIXES = ['.spec.ts', '.test.ts'];
const CHOICE_GLYPHS_DIR = join('public', 'icons', 'choices');

const projectName = (
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { name: string }
).name.toLowerCase();

interface Finding {
  readonly file: string;
  readonly rule: string;
  readonly detail: string;
}

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const findings: Finding[] = [];

for (const dir of SCANNED_DIRS) {
  for (const full of walk(join(ROOT, dir))) {
    const relativePath = relative(ROOT, full).split(sep).join('/');
    const name = basename(full);

    if (TEST_SUFFIXES.some((suffix) => name.endsWith(suffix)) && dir !== TESTS_DIR) {
      findings.push({
        file: relativePath,
        rule: 'tests-live-in-tests',
        detail: `move it to ${TESTS_DIR}/ mirroring the source path, and import through @core/@shared/@features/@layout.`,
      });
    }

    if (name.toLowerCase().includes(projectName)) {
      findings.push({
        file: relativePath,
        rule: 'no-project-name-in-filename',
        detail: `"${projectName}" must not appear in a filename — name the file after what it does.`,
      });
    }
  }
}

const offered = new Set(
  PRODUCTS.flatMap((product) => [
    ...(product.flavours?.options ?? []),
    ...(product.fruits?.options ?? []),
  ]),
);
for (const option of offered) {
  const glyph = join(CHOICE_GLYPHS_DIR, `${option}.svg`);
  if (!existsSync(join(ROOT, glyph))) {
    findings.push({
      file: glyph.split(sep).join('/'),
      rule: 'every-choice-has-a-glyph',
      detail: `draw "${option}" as a 24x24 line glyph there, root id "glyph", stroke currentColor.`,
    });
  }
}

if (findings.length > 0) {
  console.error(`check:structure — ${findings.length} violation(s):\n`);
  for (const finding of findings) {
    console.error(`  ${finding.file}  [${finding.rule}]\n    ${finding.detail}`);
  }
  process.exit(1);
}
console.log(
  'check:structure — tests are all in tests/, no project name in a filename, every choice has a glyph.',
);
