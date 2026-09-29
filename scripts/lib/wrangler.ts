/**
 * Runs the project's wrangler against the local (`wrangler dev`) state or the
 * real account, for the scripts that move catalogue data in and out of KV/R2.
 */

// Names the Workers see their storage under; wrangler.jsonc binds them.
export const KV_BINDING = 'CATALOG';
export const R2_BUCKET = 'argelees-media';

export type StorageTarget = 'local' | 'remote';

const AUTH_FAILURE_PATTERN = / - 40[13]: |Authentication error|CLOUDFLARE_API_TOKEN|Not logged in/;

export interface WranglerResult {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

/** Reads `--local` or `--remote` from the arguments; exactly one is required so nothing hits production by accident. */
export function storageTarget(argv: readonly string[], usage: string): StorageTarget {
  const local = argv.includes('--local');
  const remote = argv.includes('--remote');
  if (local === remote) {
    console.error(usage);
    process.exit(1);
  }
  return local ? 'local' : 'remote';
}

export function runWrangler(args: readonly string[], target: StorageTarget): WranglerResult {
  const result = Bun.spawnSync(['bun', 'x', 'wrangler', ...args, `--${target}`], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    ok: result.exitCode === 0,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

/** True when Cloudflare refused wrangler's credentials: an expired or missing login, not a missing value. */
export function isAuthFailure(result: WranglerResult): boolean {
  return !result.ok && AUTH_FAILURE_PATTERN.test(result.stderr);
}

/** What to fix after an auth failure: the API token when one is set (CI), otherwise the OAuth login. */
export function loginHint(): string {
  return process.env['CLOUDFLARE_API_TOKEN'] === undefined
    ? 'run `bun x wrangler login`'
    : 'check that CLOUDFLARE_API_TOKEN is valid and can read Workers KV';
}

/** Wrangler prints a banner before the value; the value is the JSON, so start there. */
export function jsonFromWranglerOutput(output: string): unknown {
  const start = output.indexOf('{');
  if (start === -1) throw new Error('wrangler returned no JSON');
  return JSON.parse(output.slice(start));
}
