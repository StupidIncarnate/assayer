// Jest globalSetup. It builds every tsc package before any test runs, then hands over to the
// published @dungeonmaster/testing globalSetup, which points HOME at a temporary sandbox.
//
// WHY THE BUILD: the engine's generated shim requires core's COMPILED adapters
// (`<coreRoot>/dist/adapters`), so the integration suite proves whatever sits in dist/ while the unit
// suite proves src/. Nothing else makes those two agree. A stale dist lets both suites pass while
// they disagree. Jest runs globalSetup once per config before any test, so every entry point builds
// first: `npm run ward`, `npm run test`, or a bare `npx jest`.
//
// `build-workspaces.mjs --tsc-only` builds each package that has a `tsconfig.build.json`, in
// dependency order, the gateway packages included. Each package's tsc build is incremental. The copy
// step runs after it because tsc never emits a package.json into dist/, and `assayer version` reads
// one at runtime. `--tsc-only` leaves out app's Vite bundle, because only the e2e suite reads it, and
// packages/app/test/e2e-global-build.ts runs the full `npm run build` for that suite.
//
// WHY THE SANDBOX CALL: Jest takes one globalSetup, so this file replaces the published base's
// sandbox setup. The published globalTeardown still runs, and it deletes `process.env.HOME`
// recursively. So this file must call the published sandbox setup on every path that returns
// normally. Every failure throws instead, and Jest runs no globalTeardown after a globalSetup that
// throws, so a failed build leaves HOME untouched.

const { execFileSync } = require('node:child_process');
const { homedir } = require('node:os');
const { join } = require('node:path');

const repoRoot = join(__dirname, '..');
const publishedSandboxSetupPath = join(
  repoRoot,
  'node_modules/@dungeonmaster/testing/src/jest.setup-global.js',
);

const steps = [
  {
    label: 'node scripts/build-workspaces.mjs --tsc-only',
    argv: [join(__dirname, 'build-workspaces.mjs'), '--tsc-only'],
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

  const realHome = homedir();
  require(publishedSandboxSetupPath)();

  // The published globalTeardown deletes whatever HOME holds when the run ends. Throwing here
  // makes Jest skip that teardown, so the real home directory survives a sandbox that did not apply.
  if (process.env.HOME === realHome) {
    throw new Error(
      'assayer: the Jest HOME sandbox did not apply. The test run was aborted before any test executed.\n\n' +
        `  ${publishedSandboxSetupPath} returned, but HOME is still the real home directory, ${realHome}.\n` +
        '  The published globalTeardown deletes HOME recursively, so no test may run until the sandbox\n' +
        '  setup moves HOME to a temporary directory. Install a @dungeonmaster/testing whose\n' +
        '  src/jest.setup-global.js assigns process.env.HOME, then re-run.',
    );
  }
};
