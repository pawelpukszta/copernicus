#!/usr/bin/env node
/**
 * Guards the layer structure described in docs/project-structure.md.
 *
 * The structure only holds if the build says so: a review comment does not survive a
 * deadline, an import that fails CI does. This script walks src/, resolves every import
 * and fails on:
 *
 *   1. an import against the layer matrix below (e.g. components -> modules, shared -> app)
 *   2. a deep import into another module (anything but `@/modules/<name>`)
 *   3. a cross-module import that is not on the allowlist below
 *   4. a module's data/dto.ts or data/sources/** read from outside that module's data/
 *   5. a module's model/ importing React or Next
 *   6. a relative import that leaves its own layer unit (use the `@/` alias instead)
 *
 * It also prints the client-facing summary: which cross-module edges are in use and how
 * many imports still point at the legacy src/content layer, so the migration debt is a
 * number in the CI log rather than a feeling.
 *
 * Adding a cross-module edge is a change to MODULE_DEPENDENCIES in a reviewed commit, with
 * a one-line reason, the same way a colour pair is added to check-contrast.mjs.
 *
 * Usage: node scripts/check-structure.mjs
 * See docs/adr/0009-project-structure.md.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '../src');

// ---------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------

/**
 * Which layers each layer may import from. `modules` here means another module's public
 * API; the allowlist below decides which module.
 *
 * `root` is the handful of files directly under src/ (providers.tsx, proxy.ts).
 * `content` is the legacy layer, removed at the end of the migration in
 * docs/project-structure.md section 9. Delete the key and every mention of it then.
 */
const LAYER_IMPORTS = {
  app: ['widgets', 'modules', 'components', 'shared', 'styles', 'root', 'content'],
  widgets: ['modules', 'components', 'shared', 'styles', 'content'],
  modules: ['modules', 'components', 'shared', 'infrastructure', 'styles', 'content'],
  components: ['components', 'shared', 'styles', 'content'],
  shared: ['shared', 'styles'],
  infrastructure: ['shared'],
  root: ['components', 'shared', 'infrastructure', 'modules', 'styles'],
  content: ['content', 'shared', 'styles'],
  styles: [],
};

/**
 * Cross-module edges that are allowed, importer -> importees. `facilities` is the root of
 * the graph: every noun on a hospital site belongs to a place. `search` indexes every
 * module, so it may read all of them.
 */
const MODULE_DEPENDENCIES = {
  facilities: [],
  contacts: ['facilities'],
  staff: ['facilities'],
  news: ['facilities'],
  announcements: ['facilities'],
  'on-duty': ['facilities', 'contacts'],
  pricing: ['facilities'],
  pages: [],
  accessibility: ['facilities'],
  search: ['*'],
};

/** Layers whose files are treated as one unit for the relative-import rule. */
const LAYER_NAMES = Object.keys(LAYER_IMPORTS);

/** Bare specifiers a module's model/ may never touch: it must survive a framework change. */
const FRAMEWORK_SPECIFIERS = /^(react|react-dom|react-aria-components|next)(\/|$)/;

const SOURCE = /\.(ts|tsx|mts|js|jsx|mjs)$/;
const IGNORED_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage']);

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SOURCE.test(entry)) out.push(full);
  }
  return out;
}

/** Path relative to src/, always with forward slashes. */
function srcRelative(file) {
  return relative(srcRoot, file).split(sep).join('/');
}

/**
 * Every static or dynamic import specifier in a file. A regex is enough here: the
 * repository forbids import expressions built from variables, and `pnpm lint` runs first.
 */
function importSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[^'";]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

/**
 * Turns a specifier into a src-relative path (without extension resolution: the layer is
 * decided by the directory, so `@/modules/news` and `@/modules/news/index` are the same
 * thing). Returns null for bare package specifiers.
 */
function resolveSpecifier(fromFile, specifier) {
  if (specifier.startsWith('@/')) return specifier.slice(2).replace(/\/index$/, '');
  if (specifier.startsWith('.')) {
    const abs = resolve(dirname(fromFile), specifier);
    const rel = relative(srcRoot, abs).split(sep).join('/');
    if (rel.startsWith('..')) return null; // outside src/ (e.g. vitest.setup.ts)
    return rel.replace(/\/index$/, '');
  }
  return null;
}

/**
 * The layer and, for modules, the module name of a src-relative path.
 * `unit` is what the relative-import rule treats as "inside": the module for module
 * files, the layer for everything else.
 */
function classify(rel) {
  const [head, second] = rel.split('/');
  // A bare layer name (`@/content`, `@/shared`) is that layer's index file, not a root file.
  if (!rel.includes('/') && !LAYER_NAMES.includes(head)) {
    return { layer: 'root', unit: 'root', module: null };
  }
  if (head === 'modules') {
    return { layer: 'modules', unit: `modules/${second}`, module: second ?? null };
  }
  if (LAYER_NAMES.includes(head)) return { layer: head, unit: head, module: null };
  return { layer: head, unit: head, module: null, unknown: true };
}

function moduleMayDependOn(importer, importee) {
  const allowed = MODULE_DEPENDENCIES[importer];
  if (!allowed) return false;
  return allowed.includes('*') || allowed.includes(importee);
}

// ---------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------

if (!existsSync(srcRoot)) {
  console.log('No src directory; nothing to check.');
  process.exit(0);
}

const violations = [];
const edgesInUse = new Map(); // "importer -> importee" -> count
let legacyImports = 0;
const unknownLayers = new Set();

for (const file of walk(srcRoot)) {
  const fromRel = srcRelative(file);
  const from = classify(fromRel);
  if (from.unknown) unknownLayers.add(from.layer);

  const source = readFileSync(file, 'utf8');
  const isTest = /\.(test|spec)\.(ts|tsx)$/.test(fromRel);

  for (const specifier of importSpecifiers(source)) {
    const report = (rule, detail) =>
      violations.push({ file: fromRel, specifier, rule, detail });

    // Rule 5: model/ stays framework-free.
    if (
      from.layer === 'modules' &&
      /^modules\/[^/]+\/model\//.test(fromRel) &&
      FRAMEWORK_SPECIFIERS.test(specifier)
    ) {
      report('model-imports-framework', 'model/ must not import React or Next; move this to ui/ or queries/');
    }

    const toRel = resolveSpecifier(file, specifier);
    if (toRel === null) continue; // bare package or outside src/
    const to = classify(toRel);
    if (to.unknown) unknownLayers.add(to.layer);

    if (to.layer === 'content' && from.layer !== 'content') legacyImports += 1;

    // Rule 6: a relative import may not leave its own unit.
    if (specifier.startsWith('.') && to.unit !== from.unit) {
      report('relative-import-leaves-unit', `use the @/ alias to import from ${to.unit}`);
    }

    // Rule 1: the layer matrix. Imports within the same unit are always fine.
    if (to.unit !== from.unit) {
      const allowed = LAYER_IMPORTS[from.layer] ?? [];
      if (!allowed.includes(to.layer)) {
        report('layer-matrix', `${from.layer} may not import from ${to.layer}`);
        continue;
      }
    }

    // Rules 2 and 3: modules are reached through their index, and only along allowed edges.
    if (to.layer === 'modules' && to.unit !== from.unit) {
      const isPublicApi = toRel === to.unit; // "modules/news" (index) and nothing deeper
      if (!isPublicApi) {
        report('deep-module-import', `import from @/${to.unit} instead of @/${toRel}`);
      }
      if (from.layer === 'modules') {
        const edge = `${from.module} -> ${to.module}`;
        edgesInUse.set(edge, (edgesInUse.get(edge) ?? 0) + 1);
        if (!moduleMayDependOn(from.module, to.module)) {
          report(
            'module-dependency-not-allowed',
            `${edge} is not in MODULE_DEPENDENCIES in scripts/check-structure.mjs`,
          );
        }
      }
    }

    // Rule 4: DTOs and sources stay inside data/.
    if (to.layer === 'modules' && /^modules\/[^/]+\/data\/(dto|sources(\/|$))/.test(toRel)) {
      const fromData = new RegExp(`^${to.unit}/data/`).test(fromRel);
      const isFixtureInTest = isTest && from.unit === to.unit && /\/sources\//.test(toRel);
      if (!fromData && !isFixtureInTest) {
        report(
          'dto-or-source-leaked',
          'only data/repository.ts and data/mappers.ts may read dto.ts or sources/**',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------

const modulesDir = join(srcRoot, 'modules');
const presentModules = existsSync(modulesDir)
  ? readdirSync(modulesDir).filter((entry) => statSync(join(modulesDir, entry)).isDirectory())
  : [];

console.log(`Modules present: ${presentModules.length ? presentModules.sort().join(', ') : 'none yet'}`);

for (const name of presentModules) {
  if (!(name in MODULE_DEPENDENCIES)) {
    violations.push({
      file: `modules/${name}/`,
      specifier: '',
      rule: 'module-not-registered',
      detail: 'add the module to MODULE_DEPENDENCIES in scripts/check-structure.mjs, even with []',
    });
  }
}

if (edgesInUse.size > 0) {
  console.log('Cross-module edges in use:');
  for (const [edge, count] of [...edgesInUse].sort()) console.log(`  ${edge} (${count})`);
}

if (legacyImports > 0) {
  console.log(
    `Legacy imports of src/content: ${legacyImports} (see docs/project-structure.md section 9)`,
  );
}

if (unknownLayers.size > 0) {
  console.log(
    `Directories under src/ not described in docs/project-structure.md: ${[...unknownLayers].sort().join(', ')}`,
  );
  for (const layer of unknownLayers) {
    violations.push({
      file: `${layer}/`,
      specifier: '',
      rule: 'unknown-layer',
      detail: 'every top-level directory under src/ must be a layer from docs/project-structure.md',
    });
  }
}

if (violations.length > 0) {
  console.error(`\n${violations.length} structure violation(s):`);
  for (const v of violations.sort((a, b) => a.file.localeCompare(b.file))) {
    const where = v.specifier ? `src/${v.file}  imports '${v.specifier}'` : `src/${v.file}`;
    console.error(`  [${v.rule}] ${where}\n      ${v.detail}`);
  }
  console.error(
    '\nThe layer rules are in docs/project-structure.md; the placement table is in .claude/skills/project-structure/SKILL.md.',
  );
  process.exit(1);
}

console.log('\nStructure is intact.');
