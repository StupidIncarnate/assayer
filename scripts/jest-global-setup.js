// Jest globalSetup — compile the tsc build graph before any test runs.
//
// WHY: the engine's generated shim requires core's COMPILED adapters (`<coreRoot>/dist/adapters`), so
// the integration suite proves whatever sits in dist/ while the unit suite proves src/. Nothing else
// makes those two agree. A stale dist lets BOTH go green while they disagree: inverting a verdict in
// a src adapter still passes integration, because the shim loads the old compiled copy and never sees
// the change. Jest runs globalSetup once per config before any test, so every entry point builds
// first — `npm run ward`, `npm run test` (npm fires `pretest`, never `preward`), or a bare `npx jest`.
// No invocation path can bypass it.
//
// `tsc --build` is incremental and decides up-to-dateness by CONTENT hash, not mtime, so touching a
// file does not trigger a rebuild and the no-op cost is ~0.3s. The copy step matches it because
// `tsc --build` never emits a package.json into dist/, which `assayer version` reads at runtime.
//
// The vite app bundle is deliberately NOT built here: only the e2e needs it, and
// packages/app/test/e2e-global-build.ts already owns that (it runs the full `npm run build`).

const { execFileSync } = require('node:child_process');
const { join } = require('node:path');

const repoRoot = join(__dirname, '..');

const steps = [
  {
    label: 'npx tsc --build tsconfig.build.json',
    argv: [require.resolve('typescript/bin/tsc'), '--build', 'tsconfig.build.json'],
  },
  {
    label: 'node scripts/copy-dist-package-json.mjs',
    argv: [join(__dirname, 'copy-dist-package-json.mjs')],
  },
];

module.exports = async () => {
  for (const { label, argv } of steps) {
    try {
      execFileSync(process.execPath, argv, { cwd: repoRoot, stdio: 'pipe' });
    } catch (error) {
      const output = `${String(error.stdout ?? '')}${String(error.stderr ?? '')}`.trim();

      throw new Error(
        `assayer: \`${label}\` FAILED — the test run was aborted before any test executed.\n\n` +
          `${output}\n\n` +
          '  Jest builds packages/*/dist before running because the engine\'s generated shim requires\n' +
          '  core\'s COMPILED adapters from packages/core/dist. Running tests against a stale dist proves\n' +
          '  nothing about src, so a build failure must stop the run rather than green-light old code.\n' +
          `  Fix the errors above, then re-run. To reproduce this step alone, from ${repoRoot}:\n` +
          `    ${label}`,
      );
    }
  }
};
