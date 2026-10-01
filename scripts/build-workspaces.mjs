#!/usr/bin/env node
/**
 * Builds every workspace package in dependency order, the gateway packages included.
 *
 * `npm run build --workspaces` runs packages in directory order. On a cold tree that breaks: a
 * package that sorts before one of its own dependencies cannot resolve that dependency's types,
 * because nothing has written the dependency's `dist` yet.
 *
 * `tsc -b` cannot do the ordering. Build mode needs `composite: true` and a `references` graph, and
 * no config in this repo sets either. Build mode would also skip every non-tsc build step, such as
 * app's `vite build` and cli's `postbuild` chmod. So this script runs each package's own `build`
 * script and decides only the order.
 *
 * The script derives the order on every run from each package.json's `dependencies` and
 * `peerDependencies` that name another workspace package. A hand-written list would silently skip
 * a package added later.
 *
 * Flags:
 *   --tsc-only  build only the packages that have a `tsconfig.build.json`. Each package's
 *               `prepack` passes it, because a packed tarball never holds app's Vite bundle.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listWorkspacePackageDirs } from './workspace-package-dirs.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const BUILD_CONFIG_NAME = 'tsconfig.build.json';
const TSC_ONLY = process.argv.slice(2).includes('--tsc-only');

// A refusal lists only a sample of paths. The full list for a large dist would bury the two lines
// above it that name rootDir and outDir.
const REFUSAL_SAMPLE_LIMIT = 20;

/**
 * PRUNE_DIST modes:
 *   unset      build every package, then delete its stale emit
 *   'report'   build nothing, delete nothing, print what a prune would delete
 *   'only'     build nothing, delete stale emit
 */
const PRUNE_MODE = process.env.PRUNE_DIST ?? '';
const PRUNE_REPORT_ONLY = PRUNE_MODE === 'report';
const SKIP_BUILD = PRUNE_REPORT_ONLY || PRUNE_MODE === 'only';

// `tsc` only ever adds files to outDir. A renamed or deleted source leaves its emitted `.js`,
// `.d.ts` and `.d.ts.map` behind. A stale declaration lets a typecheck that reads `dist` pass
// against code whose source is gone, so the prune deletes it.
const EMITTED_EXTENSIONS = ['.d.ts.map', '.d.ts', '.js.map', '.js'];

// `allowJs` is on repo-wide, so a `.jsx` beside an emitted `.js` is a real source. `.mts` and
// `.cts` are absent on purpose. They emit `.mjs`, `.cjs`, `.d.mts` and `.d.cts`, and none of those
// is in EMITTED_EXTENSIONS, so the prune never considers that output. If `.mjs` or `.d.mts` joins
// EMITTED_EXTENSIONS, add `.mts` and `.cts` here in the same change.
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Emitted files that have no source of their own, keyed by the package's directory under
// `packages/` and listed as outDir-relative posix paths. No package has one.
const PRUNE_KEEP = new Map();

const collectFiles = ({ dir }) => {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles({ dir: full }));
      continue;
    }

    if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
};

const removeEmptyDirectories = ({ dir }) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirectories({ dir: join(dir, entry.name) });
    }
  }

  if (readdirSync(dir).length === 0) {
    rmdirSync(dir);
  }
};

/**
 * Reads the one config the prune maps emitted files through. Any config this cannot read comes back
 * as `invalid`, never as a skip. A silent skip would switch pruning off for that package forever,
 * and the default build mode prints nothing when it prunes zero files, so nobody would notice.
 */
const readPruneConfig = ({ packageDir }) => {
  const configPath = join(packageDir, BUILD_CONFIG_NAME);

  if (!existsSync(configPath)) {
    // No tsc build to prune. App builds with Vite, which clears its own outDir.
    return { kind: 'skip', reason: 'no tsc outDir to prune' };
  }

  let config;

  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    return {
      kind: 'invalid',
      configPath,
      message: `cannot be read as JSON: ${error.message}`,
      hint: 'tsc accepts JSONC, but this prune parses strict JSON. Remove every comment and trailing comma.',
    };
  }

  const { rootDir, outDir } = config.compilerOptions ?? {};

  if (typeof rootDir !== 'string' || typeof outDir !== 'string') {
    return {
      kind: 'invalid',
      configPath,
      message: `compilerOptions.rootDir and compilerOptions.outDir must both be strings (rootDir: ${JSON.stringify(rootDir)}, outDir: ${JSON.stringify(outDir)})`,
      hint: 'This prune does not follow `extends`, and a guessed default would map the emit at the wrong depth. Set both in this file.',
    };
  }

  return { kind: 'config', rootDir, outDir };
};

/**
 * Returns the emitted files under the package's outDir that have no source behind them. Unless
 * `dryRun` is set, it also deletes them, plus every directory the deletes left empty.
 *
 * A file counts as stale when no source file exists on disk at the same stem under rootDir. The
 * check does not use the config's own file list. `exclude` only trims the files tsc finds by
 * wildcard, and tsc still emits an excluded file that a non-excluded file imports. Core's
 * `testing.ts` and shared's `contracts.ts` import `.proxy.ts` and `.stub.ts` files that way, so a
 * check against the config's file list would delete real output.
 */
const pruneStaleEmit = ({ dirName, dryRun }) => {
  const packageDir = resolve(PACKAGES_DIR, dirName);
  const config = readPruneConfig({ packageDir });

  if (config.kind !== 'config') {
    return config;
  }

  const rootPath = resolve(packageDir, config.rootDir);
  const outPath = resolve(packageDir, config.outDir);

  // outDir must be a directory strictly below the package. `.ward/build.tsbuildinfo` sits beside it.
  // Deleting that file would make the next `tsc` believe the tree is current and emit nothing.
  if (!outPath.startsWith(`${packageDir}${sep}`)) {
    return { kind: 'skip', reason: `outDir ${config.outDir} is not below the package, so it is not walked` };
  }

  if (!existsSync(outPath)) {
    return { kind: 'skip', reason: 'no tsc outDir to prune' };
  }

  const keep = PRUNE_KEEP.get(dirName) ?? new Set();
  const stale = [];
  let mapped = 0;

  for (const file of collectFiles({ dir: outPath })) {
    const relativePath = relative(outPath, file);
    const extension = EMITTED_EXTENSIONS.find((candidate) => relativePath.endsWith(candidate));

    // Only tsc's own output extensions are the prune's to delete. Any other file in dist came from
    // a different build step, such as the `package.json` that copy-dist-package-json.mjs writes.
    if (extension === undefined || keep.has(relativePath.split(sep).join('/'))) {
      continue;
    }

    const stem = relativePath.slice(0, -extension.length);
    const hasSource = SOURCE_EXTENSIONS.some((candidate) =>
      existsSync(join(rootPath, `${stem}${candidate}`)),
    );

    if (hasSource) {
      mapped += 1;
      continue;
    }

    stale.push(file);
  }

  // A wrong rootDir maps every emitted file to a source that cannot exist, so the whole dist reads
  // as stale. Deleting it would erase the package at exit 0 and leave the buildinfo in place, so the
  // next `tsc` would emit nothing to replace it. A rootDir that really moved looks the same by
  // count. The difference is that the build has just written the relocated files, so some of them
  // map. Zero mapped files means the mapping is broken, and the prune refuses to delete anything.
  if (mapped === 0 && stale.length > 0) {
    return {
      kind: 'refused',
      rootDir: config.rootDir,
      outDir: config.outDir,
      rootPath,
      outPath,
      stale,
    };
  }

  if (!dryRun && stale.length > 0) {
    for (const file of stale) {
      unlinkSync(file);
    }

    for (const entry of readdirSync(outPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        removeEmptyDirectories({ dir: join(outPath, entry.name) });
      }
    }
  }

  return { kind: 'pruned', outPath, stale };
};

// Returns false when the package's prune cannot be trusted. Every such case is fatal, because a
// prune that cannot run correctly is how a whole dist disappears at exit 0.
const reportPrune = ({ name, dirName }) => {
  const result = pruneStaleEmit({ dirName, dryRun: PRUNE_REPORT_ONLY });

  if (result.kind === 'skip') {
    if (PRUNE_REPORT_ONLY) {
      process.stdout.write(`${name}: ${result.reason}\n`);
    }
    return true;
  }

  if (result.kind === 'invalid') {
    process.stderr.write(
      `\nprune aborted in ${name}\n` +
        `  ${relative(process.cwd(), result.configPath)} ${result.message}\n` +
        `  ${result.hint}\n`,
    );
    return false;
  }

  if (result.kind === 'refused') {
    process.stderr.write(
      `\nprune refused in ${name}: all ${String(result.stale.length)} emitted file(s) under outDir map to a\n` +
        `missing source and NONE map to an existing one, so rootDir does not describe this emit.\n` +
        `Nothing was deleted. Fix the paths below, or run \`npm run build:clean\` if the tree really is stale.\n` +
        `  rootDir: ${result.rootDir} -> ${relative(process.cwd(), result.rootPath)}\n` +
        `  outDir:  ${result.outDir} -> ${relative(process.cwd(), result.outPath)}\n` +
        `  would have deleted:\n`,
    );

    for (const file of result.stale.slice(0, REFUSAL_SAMPLE_LIMIT)) {
      process.stderr.write(`    ${relative(process.cwd(), file)}\n`);
    }

    if (result.stale.length > REFUSAL_SAMPLE_LIMIT) {
      process.stderr.write(
        `    ... and ${String(result.stale.length - REFUSAL_SAMPLE_LIMIT)} more\n`,
      );
    }

    return false;
  }

  const verb = PRUNE_REPORT_ONLY ? 'would prune' : 'pruned';

  if (result.stale.length > 0 || PRUNE_REPORT_ONLY) {
    process.stdout.write(`${verb} ${String(result.stale.length)} stale file(s) in ${name}\n`);
  }

  for (const file of result.stale) {
    process.stdout.write(`  ${relative(process.cwd(), file)}\n`);
  }

  return true;
};

// Keeps every dependency name. topologicalOrder drops the ones that are not workspace packages,
// once every manifest has been read. The cli package is named `assayer`, with no scope, so a scope
// prefix cannot tell a workspace package from an npm one.
const readManifests = () => {
  const manifests = new Map();

  for (const dirName of listWorkspacePackageDirs({ packagesDir: PACKAGES_DIR })) {
    const manifestPath = join(PACKAGES_DIR, dirName, 'package.json');
    let raw;
    try {
      raw = readFileSync(manifestPath, 'utf8');
    } catch {
      continue;
    }

    const manifest = JSON.parse(raw);
    manifests.set(manifest.name, {
      dir: dirName,
      hasBuild: Boolean(manifest.scripts?.build),
      hasBuildConfig: existsSync(join(PACKAGES_DIR, dirName, BUILD_CONFIG_NAME)),
      deps: Object.keys({
        ...manifest.dependencies,
        ...manifest.peerDependencies,
      }),
    });
  }

  return manifests;
};

// Kahn's algorithm. Names in the same tier sort alphabetically, so the order is the same every run.
const topologicalOrder = ({ manifests }) => {
  const pending = new Map(
    [...manifests].map(([name, meta]) => [name, meta.deps.filter((dep) => manifests.has(dep))]),
  );
  const order = [];

  while (pending.size > 0) {
    const ready = [...pending]
      .filter(([, deps]) => deps.every((dep) => !pending.has(dep)))
      .map(([name]) => name)
      .sort();

    if (ready.length === 0) {
      throw new Error(
        `Dependency cycle among workspaces: ${[...pending.keys()].sort().join(', ')}`,
      );
    }

    for (const name of ready) {
      order.push(name);
      pending.delete(name);
    }
  }

  return order;
};

const manifests = readManifests();
const order = topologicalOrder({ manifests });

if (SKIP_BUILD) {
  process.stdout.write(`prune ${PRUNE_MODE}: building nothing\n`);
} else {
  process.stdout.write(`build order: ${order.join(' -> ')}\n`);
}

let pruneRefused = false;

for (const name of order) {
  const { dir, hasBuild, hasBuildConfig } = manifests.get(name);

  if (SKIP_BUILD) {
    // Nothing is being built, so check every package before exiting. Stopping at the first refusal
    // would hide a second broken config behind it.
    pruneRefused = !reportPrune({ name, dirName: dir }) || pruneRefused;
    continue;
  }

  if (!hasBuild) {
    process.stdout.write(`skipping ${name} (no build script)\n`);
    continue;
  }

  if (TSC_ONLY && !hasBuildConfig) {
    process.stdout.write(`skipping ${name} (--tsc-only, no ${BUILD_CONFIG_NAME})\n`);
    continue;
  }

  const { status } = spawnSync('npm', ['run', 'build', `--workspace=${name}`], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: false,
  });

  // Stop at the first failure. `npm run build --workspaces` carries on and reports at the end,
  // which buries the first error under every later error it caused.
  if (status !== 0) {
    process.stderr.write(`\nbuild failed in ${name} (exit ${String(status)})\n`);
    process.exit(status ?? 1);
  }

  // The prune runs after the whole `build` script, `postbuild` included, so it never races a
  // build step that writes into dist.
  if (!reportPrune({ name, dirName: dir })) {
    process.exit(1);
  }
}

if (pruneRefused) {
  process.exit(1);
}
