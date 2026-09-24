/**
 * The development stack in one command: `bun start` runs this after `config`
 * and `catalog:pull`.
 *
 * Two processes make the site work locally. `ng serve` (port 4200) rebuilds
 * the app on every change; `wrangler dev` (port 8787) runs the Worker against
 * the local KV and R2 state, and the dev server proxies `/api`, `/photos` and
 * the sitemap to it (proxy.conf.json). Without the Worker those requests fail
 * with ECONNREFUSED and the shelf shows no photos, so both start here and both
 * stop together on Ctrl+C. Once each one reports ready, a summary names every
 * URL there is, so nobody has to fish them out of the two logs.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const ASSET_DIRS = [
  join(ROOT, 'dist', 'argelee', 'browser'),
  join(ROOT, 'dist', 'admin', 'browser'),
];
const SITE_PORT = 4200;
const ADMIN_PORT = 4300;
const WORKER_PORT = 8787;
const ADMIN_WORKER_PORT = 8790;
const STATE_DIR = '.wrangler/state';
const RULE = '─'.repeat(60);

interface Service {
  readonly name: string;
  readonly command: readonly string[];
  /** The line the process prints when it accepts requests. */
  readonly readyMarker: string;
}

const SERVICES: readonly Service[] = [
  {
    name: 'worker',
    command: [
      'bun',
      'x',
      'wrangler',
      'dev',
      '--port',
      String(WORKER_PORT),
      '--persist-to',
      STATE_DIR,
    ],
    readyMarker: 'Ready on',
  },
  {
    name: 'admin worker',
    command: [
      'bun',
      'x',
      'wrangler',
      'dev',
      '--config',
      'admin/wrangler.jsonc',
      '--port',
      String(ADMIN_WORKER_PORT),
      '--persist-to',
      STATE_DIR,
    ],
    readyMarker: 'Ready on',
  },
  {
    name: 'site',
    command: ['bun', 'x', 'ng', 'serve', '--port', String(SITE_PORT)],
    readyMarker: 'Local:',
  },
  {
    name: 'admin',
    command: ['bun', 'x', 'ng', 'serve', 'admin', '--port', String(ADMIN_PORT)],
    readyMarker: 'Local:',
  },
];

// wrangler refuses to start when the assets directory is missing; an empty one
// is enough here because the dev server, not the Worker, serves the pages.
for (const dir of ASSET_DIRS) {
  if (existsSync(dir)) continue;
  mkdirSync(dir, { recursive: true });
  console.log(`dev: ${dir} did not exist; created empty so wrangler can start.`);
}

const ready = new Set<string>();

function printSummary(): void {
  console.log(`
${RULE}
  ArGeles — development stack is up

  site     http://localhost:${SITE_PORT}        the landing, live-reloading
  worker   http://localhost:${WORKER_PORT}        /api/catalog, /photos, /sitemap.xml (local KV + R2)
  admin    http://localhost:${ADMIN_PORT}        the panel, live-reloading
  admin api http://localhost:${ADMIN_WORKER_PORT}       login + write API (local KV + R2)

  Ctrl+C stops both.
${RULE}
`);
}

/** Forwards a process's output as is and watches it, colours stripped, for the ready line. */
async function relay(service: Service, stream: ReadableStream<Uint8Array>): Promise<void> {
  const decoder = new TextDecoder();
  for await (const chunk of stream) {
    process.stdout.write(chunk);
    const text = Bun.stripANSI(decoder.decode(chunk));
    if (!ready.has(service.name) && text.includes(service.readyMarker)) {
      ready.add(service.name);
      if (ready.size === SERVICES.length) printSummary();
    }
  }
}

const children = SERVICES.map((service) => {
  const child = Bun.spawn([...service.command], {
    cwd: ROOT,
    stdin: 'inherit',
    stdout: 'pipe',
    stderr: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  void relay(service, child.stdout);
  return child;
});

/** Windows keeps workerd alive when its parent dies, so the whole tree is taken down. */
function stop(): void {
  for (const child of children) {
    if (process.platform === 'win32') {
      Bun.spawnSync(['taskkill', '/T', '/F', '/PID', String(child.pid)], {
        stdout: 'ignore',
        stderr: 'ignore',
      });
    } else {
      child.kill();
    }
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

// If either process ends on its own, the other has no reason to keep running.
await Promise.race(children.map((child) => child.exited));
stop();
