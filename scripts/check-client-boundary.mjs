#!/usr/bin/env node
/**
 * Guards the client/server boundary in the Next.js App Router.
 *
 * react-aria-components ships no "use client" directives of its own, so every
 * library component is reached through a wrapper under src/components. That
 * convention is what keeps the client bundle from growing by accident: one
 * misplaced directive pulls an entire subtree out of server rendering, and
 * nothing fails visibly when it happens.
 *
 * This script fails the build when 'use client' appears outside the directories
 * allowed below, and prints the full client surface so growth is visible in CI
 * logs rather than discovered in a bundle six months later.
 *
 * Usage: node scripts/check-client-boundary.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '../src');

/** Paths permitted to declare 'use client', relative to src/. */
const ALLOWED = ['components', 'providers.tsx'];

const SOURCE = /\.(ts|tsx|js|jsx|mjs)$/;

if (!existsSync(srcRoot)) {
  console.log('No src directory; nothing to check.');
  process.exit(0);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SOURCE.test(entry)) out.push(full);
  }
  return out;
}

/** True when the file opens with a 'use client' directive, comments aside. */
function declaresUseClient(file) {
  const head = readFileSync(file, 'utf8').slice(0, 2048);
  const withoutComments = head
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trimStart();
  return /^(['"])use client\1\s*;?/.test(withoutComments);
}

const clientFiles = walk(srcRoot)
  .filter(declaresUseClient)
  .map((file) => relative(srcRoot, file));

const violations = clientFiles.filter(
  (file) => !ALLOWED.some((prefix) => file === prefix || file.startsWith(prefix + sep)),
);

if (clientFiles.length > 0) {
  console.log(`Client surface (${clientFiles.length} file(s) declaring 'use client'):`);
  for (const file of clientFiles.sort()) console.log(`  src/${file.split(sep).join('/')}`);
} else {
  console.log("No file declares 'use client'.");
}

if (violations.length > 0) {
  console.error(
    `\n${violations.length} file(s) declare 'use client' outside ${ALLOWED.map((a) => `src/${a}`).join(', ')}:`,
  );
  for (const file of violations.sort()) console.error(`  src/${file.split(sep).join('/')}`);
  console.error(
    '\nReach React Aria through a wrapper in src/components instead, so the client surface stays where it is reviewed.',
  );
  process.exit(1);
}

console.log('\nClient boundary is intact.');
