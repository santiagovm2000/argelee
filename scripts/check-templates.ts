/**
 * Template guard. Run with `bun run check:templates`.
 *
 * Enforces the two project rules that a type-checker cannot see:
 *
 *  1. No hardcoded user-facing text. Every string a visitor reads comes from
 *     transloco via a typed key. A literal in a template is invisible to the
 *     translator and ships untranslated.
 *  2. No native CSS in HTML. No `style="..."`, no `[style.x]`, no `[ngStyle]`.
 *     Styling is Tailwind utilities, or a class declared in src/styles.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const SRC = join(ROOT, 'src');

/* Attributes whose value reaches a user (and so must be translated) are listed
   inline in the attribute regex below: alt, title, placeholder, aria-label,
   aria-description. */

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
  readonly detail: string;
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    if (full.endsWith('index.html')) return [];
    return full.endsWith('.html') ? [full] : [];
  });
}

const hasWords = (text: string): boolean => /\p{L}{2,}/u.test(text);
const lineOf = (source: string, index: number): number => source.slice(0, index).split('\n').length;

function inspect(file: string): Finding[] {
  const source = readFileSync(file, 'utf8');
  const findings: Finding[] = [];
  const name = relative(ROOT, file).split(sep).join('/');

  // --- rule 2: native CSS in the template ---------------------------------
  for (const match of source.matchAll(/\s(style\s*=|\[style[.\]]|\[ngStyle\]|ngStyle\s*=)/g)) {
    findings.push({
      file: name,
      line: lineOf(source, match.index),
      rule: 'no-native-css',
      detail: `\`${match[1]}\` — use a Tailwind utility, or a class in src/styles.`,
    });
  }

  // Blank out regions that are allowed to contain words, so what remains is
  // genuinely hardcoded: comments, interpolations, and control-flow conditions.
  const blank = (text: string): string => ' '.repeat(text.length);
  const masked = source
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\{\{[\s\S]*?\}\}/g, blank)
    .replace(
      /@(else if|else|if|for|switch|case|default|defer|placeholder|loading|error|empty)\b[^{]*/g,
      blank,
    );

  // --- rule 1a: static text between tags -----------------------------------
  for (const match of masked.matchAll(/>([^<>]+)</g)) {
    const text = match[1] ?? '';
    if (!hasWords(text)) continue;
    findings.push({
      file: name,
      line: lineOf(source, match.index),
      rule: 'no-hardcoded-text',
      detail: `"${text.trim().slice(0, 60)}" — move it to public/i18n and use a key from \`T\`.`,
    });
  }

  // --- rule 1b: static user-facing attributes -------------------------------
  for (const match of masked.matchAll(
    /[ \t\n](alt|title|placeholder|aria-label|aria-description)[ ]*=[ ]*"([^"]*)"/g,
  )) {
    const value = match[2] ?? '';
    if (!hasWords(value)) continue;
    findings.push({
      file: name,
      line: lineOf(source, match.index),
      rule: 'no-hardcoded-text',
      detail: `${match[1]}="${value.slice(0, 40)}" — bind it to a translated value instead.`,
    });
  }

  return findings;
}

const findings = htmlFiles(SRC).flatMap(inspect);

if (findings.length > 0) {
  console.error(`check:templates — ${findings.length} violation(s):\n`);
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}  [${finding.rule}]\n    ${finding.detail}`);
  }
  process.exit(1);
}
console.log('check:templates — no hardcoded text, no native CSS.');
