#!/usr/bin/env node
/**
 * Contrast budget guard for the Copernicus design tokens.
 *
 * Conformance target is WCAG 2.2 level AA, with the AAA thresholds tracked as an
 * advisory gap report so the path to AAA stays visible instead of being forgotten.
 *
 * Thresholds per pair kind:
 *   body    AA 4.5:1   AAA 7.0:1    (1.4.3 / 1.4.6, text below 18.66px bold or 24px)
 *   large   AA 3.0:1   AAA 4.5:1    (1.4.3 / 1.4.6, large text)
 *   nontext AA 3.0:1   AAA 3.0:1    (1.4.11 Non-text Contrast, no AAA equivalent)
 *
 * Exit code:
 *   default              fail on an AA breach, report the AAA gap as advisory
 *   CONTRAST_LEVEL=aaa   fail on an AAA breach too
 *
 * Flip CONTRAST_LEVEL to aaa in CI on the day the AAA decision is taken; nothing
 * else about this script has to change. See docs/accessibility.md.
 *
 * Run: pnpm run check:contrast
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(here, '../src/styles/tokens.css');

const LEVEL = (process.env.CONTRAST_LEVEL ?? 'aa').toLowerCase();

const THRESHOLDS = {
  body: { aa: 4.5, aaa: 7 },
  large: { aa: 3, aaa: 4.5 },
  nontext: { aa: 3, aaa: 3 },
};

/** Pairs to verify: [foreground token, background token, kind, note]. */
const PAIRS = [
  ['--color-text', '--color-surface', 'body', 'body text on page background'],
  ['--color-text', '--color-surface-raised', 'body', 'body text on raised surface'],
  ['--color-text-muted', '--color-surface', 'body', 'secondary text on page background'],
  ['--color-text-muted', '--color-surface-raised', 'body', 'secondary text on raised surface'],
  ['--color-primary', '--color-surface', 'body', 'link text on page background'],
  ['--color-primary', '--color-surface-raised', 'body', 'link text on raised surface'],
  ['--color-text-inverse', '--color-primary', 'body', 'primary button label'],
  ['--color-text-inverse', '--color-primary-hover', 'body', 'primary button label, hover'],
  ['--color-text-inverse', '--color-primary-active', 'body', 'primary button label, pressed'],
  ['--color-danger', '--color-surface', 'body', 'error text'],
  ['--color-success', '--color-surface', 'body', 'success text'],
  ['--color-warning', '--color-surface', 'body', 'warning text'],
  ['--color-border', '--color-surface', 'nontext', 'input and divider borders'],
  ['--color-border-strong', '--color-surface', 'nontext', 'emphasised borders'],
  ['--color-focus', '--color-surface', 'nontext', 'focus indicator on page background'],
  ['--color-focus', '--color-surface-raised', 'nontext', 'focus indicator on raised surface'],
];

const css = readFileSync(tokensPath, 'utf8');

/** Extract `--token: value;` declarations from a css block. */
function declarations(block) {
  const out = new Map();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(match[1], match[2].trim());
  }
  return out;
}

/** Read the body of the first block whose selector matches the needle. */
function blockFor(selectorNeedle) {
  const index = css.indexOf(selectorNeedle);
  if (index === -1) {
    throw new Error(`Selector not found in tokens.css: ${selectorNeedle}`);
  }
  const start = css.indexOf('{', index);
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start + 1, i);
    }
  }
  throw new Error(`Unbalanced braces after ${selectorNeedle}`);
}

const light = declarations(blockFor(':root {'));
const dark = new Map(light);
for (const [key, value] of declarations(blockFor(":root[data-theme='dark']"))) {
  dark.set(key, value);
}

function toRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
}

function relativeLuminance(hex) {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const aaFailures = [];
const aaaGap = [];

for (const [themeName, palette] of [
  ['light', light],
  ['dark', dark],
]) {
  console.log(`\n${themeName} theme`);
  for (const [fgToken, bgToken, kind, note] of PAIRS) {
    const fg = palette.get(fgToken);
    const bg = palette.get(bgToken);
    if (!fg || !bg) {
      aaFailures.push(`${themeName}: missing token ${fgToken} or ${bgToken}`);
      console.error(`  MISSING ${fgToken} or ${bgToken}`);
      continue;
    }

    const { aa, aaa } = THRESHOLDS[kind];
    const value = ratio(fg, bg);
    const passesAa = value >= aa;
    const passesAaa = value >= aaa;
    const where = `${fgToken} on ${bgToken} (${note})`;

    if (!passesAa)
      aaFailures.push(`${themeName}: ${where} is ${value.toFixed(2)}:1, needs ${aa}:1`);
    if (passesAa && !passesAaa) {
      aaaGap.push(`${themeName}: ${where} is ${value.toFixed(2)}:1, AAA needs ${aaa}:1`);
    }

    const status = !passesAa ? 'FAIL' : passesAaa ? 'PASS' : 'AA  ';
    console.log(
      `  ${status} ${value.toFixed(2)}:1 (AA ${aa.toFixed(1)}, AAA ${aaa.toFixed(1)}) ${where}`,
    );
  }
}

if (aaaGap.length > 0) {
  console.log(`\nGap to AAA (${aaaGap.length} pair(s), advisory at level ${LEVEL}):`);
  for (const line of aaaGap) console.log(`  ${line}`);
} else {
  console.log('\nEvery pair already meets the AAA threshold as well as AA.');
}

if (aaFailures.length > 0) {
  console.error(`\n${aaFailures.length} AA contrast check(s) failed:`);
  for (const line of aaFailures) console.error(`  ${line}`);
  console.error('\nAdjust src/styles/tokens.css.');
  process.exit(1);
}

if (LEVEL === 'aaa' && aaaGap.length > 0) {
  console.error(`\nCONTRAST_LEVEL=aaa: ${aaaGap.length} pair(s) below the AAA threshold.`);
  process.exit(1);
}

console.log(`\nAll contrast checks passed at level ${LEVEL.toUpperCase()}.`);
