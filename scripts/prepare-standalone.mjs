#!/usr/bin/env node
/**
 * Assembles the standalone server produced by `next build` with `output: 'standalone'`.
 *
 * Next copies only the server into .next/standalone; static assets and the public
 * folder have to be placed next to it. Doing that here, in Node rather than in a
 * shell one-liner, keeps it working on Windows as well as in CI.
 *
 * This is also what the Playwright suite runs, so the accessibility tests exercise
 * the exact artefact that gets deployed rather than the dev-mode server.
 *
 * Usage: node scripts/prepare-standalone.mjs
 */
import { cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standalone = join(root, '.next', 'standalone');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(standalone))) {
  console.error(
    'Missing .next/standalone. Run `next build` first, with output: "standalone" in next.config.ts.',
  );
  process.exit(1);
}

for (const [from, to] of [
  [join(root, '.next', 'static'), join(standalone, '.next', 'static')],
  [join(root, 'public'), join(standalone, 'public')],
]) {
  if (await exists(from)) {
    await cp(from, to, { recursive: true });
    console.log(`Copied ${from.replace(root + '/', '')} into the standalone build.`);
  }
}

console.log('Standalone server ready: node .next/standalone/server.js');
