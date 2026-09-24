import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isSupportedLanguage } from '../i18n/i18n.constants';
import {
  CENTS_PER_UNIT,
  PHOTO_KEY_PREFIX,
  PRICE_STEP,
  PRODUCT_ID_PATTERN,
} from './catalog.constants';
import type { LocalizedText, PeopleRange, ProductPhoto, ProductText } from './catalog.model';

// Untrusted JSON (a KV document, an API response, a seed file) becomes typed
// data only through these readers. They stop at the first problem and name
// the path to it, so a bad document is rejected with a message a person can act on.

export type Validation<Value> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly errors: readonly string[] };

/** A single problem in the input, located by its JSON path. */
export class CatalogValidationError extends Error {
  constructor(
    readonly path: string,
    detail: string,
  ) {
    super(`${path}: ${detail}`);
    this.name = 'CatalogValidationError';
  }
}

const PLACEHOLDER_PREFIX = 'data:image/';
const TEXT_FIELDS = ['name', 'note', 'description'] as const;
const PEOPLE_RANGE_LENGTH = 2;

/** Rejects the input at that path; `validate()` turns it into a result, everything else lets it surface. */
export function fail(path: string, detail: string): never {
  throw new CatalogValidationError(path, detail);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, path: string): Record<string, unknown> {
  return isRecord(value) ? value : fail(path, 'must be an object');
}

export function expectArray(value: unknown, path: string): readonly unknown[] {
  return Array.isArray(value) ? value : fail(path, 'must be an array');
}

export function expectString(record: Record<string, unknown>, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    return fail(`${path}.${key}`, 'must be a non-empty string');
  }
  return value;
}

export function expectBoolean(record: Record<string, unknown>, key: string, path: string): boolean {
  const value = record[key];
  return typeof value === 'boolean' ? value : fail(`${path}.${key}`, 'must be true or false');
}

export interface NumberRules {
  readonly integer?: boolean;
  readonly min?: number;
  readonly exclusiveMin?: boolean;
}

export function expectNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
  rules: NumberRules = {},
): number {
  const value = record[key];
  const at = `${path}.${key}`;
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(at, 'must be a number');
  if (rules.integer === true && !Number.isInteger(value)) return fail(at, 'must be a whole number');
  if (rules.min !== undefined) {
    const tooLow = rules.exclusiveMin === true ? value <= rules.min : value < rules.min;
    if (tooLow) {
      return fail(at, `must be ${rules.exclusiveMin === true ? 'above' : 'at least'} ${rules.min}`);
    }
  }
  return value;
}

/** Reads a field that is either absent-as-null or a value the given reader accepts. */
export function expectNullable<Value>(
  record: Record<string, unknown>,
  key: string,
  path: string,
  read: (value: unknown, path: string) => Value,
): Value | null {
  const value = record[key];
  if (value === undefined) return fail(`${path}.${key}`, 'is required (use null for none)');
  return value === null ? null : read(value, `${path}.${key}`);
}

/** A sale price: positive and on the price step, checked in cents so floats cannot lie. */
export function expectPrice(record: Record<string, unknown>, key: string, path: string): number {
  const price = expectNumber(record, key, path, { min: 0, exclusiveMin: true });
  const cents = Math.round(price * CENTS_PER_UNIT);
  const stepCents = Math.round(PRICE_STEP * CENTS_PER_UNIT);
  return cents % stepCents === 0
    ? price
    : fail(`${path}.${key}`, `must be a multiple of ${PRICE_STEP}`);
}

export function expectProductId(
  record: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const value = expectString(record, key, path);
  return PRODUCT_ID_PATTERN.test(value) ? value : fail(`${path}.${key}`, 'must be a UUID');
}

export function expectUnique(values: readonly string[], path: string, what: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) fail(path, `${what} "${value}" appears more than once`);
    seen.add(value);
  }
}

function expectProductText(value: unknown, path: string): ProductText {
  const record = expectRecord(value, path);
  return {
    name: expectString(record, TEXT_FIELDS[0], path),
    note: expectString(record, TEXT_FIELDS[1], path),
    description: expectString(record, TEXT_FIELDS[2], path),
  };
}

/** The default language is mandatory; other supported languages are optional; anything else is a typo. */
export function expectLocalizedText(value: unknown, path: string): LocalizedText {
  const record = expectRecord(value, path);
  for (const language of Object.keys(record)) {
    if (!isSupportedLanguage(language)) fail(`${path}.${language}`, 'is not a supported language');
  }
  const text: Partial<Record<(typeof SUPPORTED_LANGUAGES)[number], ProductText>> = {};
  for (const language of SUPPORTED_LANGUAGES) {
    const entry = record[language];
    if (entry === undefined) {
      if (language === DEFAULT_LANGUAGE) fail(`${path}.${language}`, 'is required');
      continue;
    }
    text[language] = expectProductText(entry, `${path}.${language}`);
  }
  return text as LocalizedText;
}

export function expectPhoto(value: unknown, path: string): ProductPhoto {
  const record = expectRecord(value, path);
  const key = expectString(record, 'key', path);
  if (!key.startsWith(PHOTO_KEY_PREFIX))
    fail(`${path}.key`, `must start with "${PHOTO_KEY_PREFIX}"`);
  const placeholder = expectString(record, 'placeholder', path);
  if (!placeholder.startsWith(PLACEHOLDER_PREFIX)) {
    fail(`${path}.placeholder`, 'must be an inline data: image');
  }
  return {
    key,
    width: expectNumber(record, 'width', path, { integer: true, min: 1 }),
    height: expectNumber(record, 'height', path, { integer: true, min: 1 }),
    placeholder,
  };
}

export function expectServes(value: unknown, path: string): PeopleRange {
  const pair = expectArray(value, path);
  if (pair.length !== PEOPLE_RANGE_LENGTH) fail(path, 'must be [from, to]');
  const range = { from: pair[0], to: pair[1] };
  const from = expectNumber(range, 'from', path, { integer: true, min: 1 });
  const to = expectNumber(range, 'to', path, { integer: true, min: from });
  return [from, to];
}

/** A piece's flavours or fruit: known ids, at least one, none repeated. */
export function expectChoices<Id extends string>(
  value: unknown,
  path: string,
  isKnown: (id: string) => id is Id,
): readonly Id[] {
  const choices = expectArray(value, path).map((choice, index) =>
    typeof choice === 'string' && isKnown(choice)
      ? choice
      : fail(`${path}[${index}]`, 'is not a known choice'),
  );
  if (choices.length === 0) fail(path, 'must name at least one');
  expectUnique(choices, path, 'choice');
  return choices;
}

/** Runs a reader and turns its exception into a result, so callers can report instead of crash. */
export function validate<Value>(read: () => Value): Validation<Value> {
  try {
    return { ok: true, value: read() };
  } catch (error) {
    if (error instanceof CatalogValidationError) return { ok: false, errors: [error.message] };
    throw error;
  }
}
