/**
 * Sets the admin panel's credentials. Run with `bun run admin:credentials --local`
 * (writes admin/.dev.vars for `wrangler dev`) or `--remote` (uploads Worker secrets).
 *
 * Asks for the user name and the password on the terminal with the echo off,
 * hashes the password (salted PBKDF2, see workers/admin/session.ts) and
 * generates a fresh session secret. Only the digest and the secret leave this
 * process; the password itself is never written anywhere.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SESSION_SECRET_BYTES } from '../workers/admin/auth.constants';
import { hashPassword, randomSecret } from '../workers/admin/session';
import { storageTarget } from './lib/wrangler';

const ROOT = resolve(import.meta.dir, '..');
const ADMIN_CONFIG = join('admin', 'wrangler.jsonc');
const DEV_VARS_FILE = join(ROOT, 'admin', '.dev.vars');
const USAGE = 'usage: bun run admin:credentials --local | --remote';
const SECRET_NAMES = {
  user: 'ADMIN_USER',
  passwordHash: 'ADMIN_PASSWORD_HASH',
  sessionSecret: 'SESSION_SECRET',
} as const;
const MIN_PASSWORD_LENGTH = 8;
const NEWLINE_CODES = [10, 13];
const CONTROL_C = 3;
const BACKSPACE_CODES = [8, 127];

const target = storageTarget(process.argv, USAGE);

const pipedLines: string[] = process.stdin.isTTY ? [] : (await Bun.stdin.text()).split(/\r?\n/);

/** Reads one line from the terminal (nothing echoed when `hidden`), or the next piped line. */
async function ask(label: string, hidden: boolean): Promise<string> {
  process.stdout.write(label);
  const input = process.stdin;
  if (!input.isTTY) {
    process.stdout.write('\n');
    return pipedLines.shift() ?? '';
  }
  input.setRawMode(true);
  input.resume();
  const chars: string[] = [];
  return new Promise((resolveLine) => {
    const onData = (data: Buffer): void => {
      for (const code of data) {
        if (code === CONTROL_C) process.exit(1);
        if (NEWLINE_CODES.includes(code)) {
          input.setRawMode(false);
          input.pause();
          input.off('data', onData);
          process.stdout.write('\n');
          resolveLine(chars.join(''));
          return;
        }
        if (BACKSPACE_CODES.includes(code)) {
          chars.pop();
          continue;
        }
        chars.push(String.fromCharCode(code));
        if (!hidden) process.stdout.write(String.fromCharCode(code));
      }
    };
    input.on('data', onData);
  });
}

function putSecret(name: string, value: string): void {
  const result = Bun.spawnSync(
    ['bun', 'x', 'wrangler', 'secret', 'put', name, '--config', ADMIN_CONFIG],
    { stdin: Buffer.from(value), stdout: 'pipe', stderr: 'pipe' },
  );
  if (result.exitCode !== 0) {
    console.error(result.stderr.toString());
    throw new Error(`admin:credentials — could not set ${name}`);
  }
}

/** Rewrites the given keys in a dotenv-style file, keeping every other line. */
function writeDevVars(values: Readonly<Record<string, string>>): void {
  const existing = existsSync(DEV_VARS_FILE) ? readFileSync(DEV_VARS_FILE, 'utf8') : '';
  const kept = existing
    .split(/\r?\n/)
    .filter((line) => !Object.keys(values).some((key) => line.startsWith(`${key}=`)))
    .filter((line, index, lines) => line !== '' || index < lines.length - 1);
  const added = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  writeFileSync(DEV_VARS_FILE, `${[...kept, ...added].join('\n')}\n`);
}

const user = (await ask('Admin user: ', false)).trim();
const password = await ask('Admin password (hidden): ', true);
const confirmation = await ask('Repeat the password (hidden): ', true);

if (user === '') {
  console.error('admin:credentials — the user name is empty.');
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`admin:credentials — use at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if (password !== confirmation) {
  console.error('admin:credentials — the passwords differ.');
  process.exit(1);
}

const values = {
  [SECRET_NAMES.user]: user,
  [SECRET_NAMES.passwordHash]: await hashPassword(password),
  [SECRET_NAMES.sessionSecret]: randomSecret(SESSION_SECRET_BYTES),
};

if (target === 'local') {
  writeDevVars(values);
  console.log(`admin:credentials — wrote ${DEV_VARS_FILE} (hash and session secret only).`);
} else {
  for (const [name, value] of Object.entries(values)) putSecret(name, value);
  console.log(
    'admin:credentials — three secrets set on argelees-admin; every session is now signed out.',
  );
}
