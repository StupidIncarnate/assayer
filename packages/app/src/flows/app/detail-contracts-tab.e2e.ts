/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's CONTRACTS tab — the
 *   resolved external import rendered as a typed input/output contract. Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects
 *   happy-path/npm-package/uses-package/uses-package.ts, opens the Contracts tab, and asserts the symbol, its `pkg <name>`
 *   source, the structured `name: type` input line, and the `returns <type>` output — the typed black
 *   box carried across the real IPC crossing.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/detail-contracts-tab.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const USES_PACKAGE = 'packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.ts';
// The remaining resolved-edge shapes: a LOCAL import (with its resolved def path + external signature),
// a CALLED node builtin (its signature), a node builtin bound as a VALUE (its declared type, not a
// signature), the two ambient-global forms (a member-access type + a called-method signature), and a
// file with no imports at all (the empty prompt).
const USES_GREETING = 'packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.ts';
const CALLS_JOIN = 'packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.ts';
const USES_BUILTIN = 'packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.ts';
const USES_PROCESS = 'packages/syntax-repository/src/happy-path/node-global/uses-process/uses-process.ts';
const USES_CONSOLE = 'packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.ts';
const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts';

const GREETING_DEF = 'packages/syntax-repository/src/happy-path/import-local/uses-greeting/greeting.ts';

// The exact contract-inspector cells the Contracts tab shows for happy-path/npm-package/uses-package/uses-package.ts — the
// symbol, its `pkg <name>` source, the structured `name: type` INPUT line, and the `returns <type>`
// output. `vendored-fixture` lives outside the analyzed root as a `file:` dependency, so the stitch
// classifies it a real external package and pulls its declared `(name: string) => string` as the typed
// black box. Asserted whole for the reason the admissions are: the signature is derived in core's
// external reader, cached by `.d.ts` hash, contract-parsed back out, and carried over Electron IPC
// before any pixel renders — drop it at any hop and every unit test still passes.
const USES_PACKAGE_CONTRACT_SYMBOL = 'greet';
const USES_PACKAGE_CONTRACT_SOURCE = 'pkg vendored-fixture';
const USES_PACKAGE_CONTRACT_INPUT = 'name: string';
const USES_PACKAGE_CONTRACT_OUTPUT = 'returns string';

test.describe('Compiled Surface Explorer — Contracts tab', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {happy-path/npm-package/uses-package/uses-package.ts selected} => the Contracts tab renders the resolved external package import as an input/output contract — the typed black box across the real IPC crossing', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_PACKAGE}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The contracts live in their own dedicated tab, separate from the Tests tab (keepMounted=false,
    // so the panel mounts on click).
    await window.getByTestId('TAB_CONTRACTS').click();

    // The whole assertion is the exactness. `vendored-fixture` resolves to a real external package (it
    // lives outside the analyzed root), so the stitch attaches its declared signature to the edge and
    // the panel renders the typed black box as a structured input/output contract. Only a real window
    // proves the signature survived core -> cache -> IPC intact: the widget's own unit test hands it a
    // stub edge whose signature the test wrote, and would stay green if the reader, the cache, or the
    // IPC channel dropped it.
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText(USES_PACKAGE_CONTRACT_SYMBOL);
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText(USES_PACKAGE_CONTRACT_SOURCE);
    await expect(window.getByTestId('CONTRACT_INPUT')).toHaveText(USES_PACKAGE_CONTRACT_INPUT);
    await expect(window.getByTestId('CONTRACT_OUTPUT')).toHaveText(USES_PACKAGE_CONTRACT_OUTPUT);
  });

  test('VALID: {compile+launch once, walk the local/builtin/global edge shapes} => each renders its own source form and typed contract, and an import-free file shows the empty prompt', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });

    // LOCAL import: the source names the specifier AND the resolved definition path, and the stitch
    // attached the target file's own `() => string` signature (a no-arg input, a `string` return).
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_GREETING}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText('greeting');
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText(`import './greeting' → ${GREETING_DEF}`);
    await expect(window.getByTestId('CONTRACT_INPUT')).toHaveText('—');
    await expect(window.getByTestId('CONTRACT_OUTPUT')).toHaveText('returns string');

    // CALLED node builtin: source reads the specifier `node:path` (never `pkg path`), and `@types/node`
    // types the call as `join(paths: string[]): string`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${CALLS_JOIN}"]`).click();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText('join');
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText('node:path');
    await expect(window.getByTestId('CONTRACT_INPUT')).toHaveText('paths: string[]');
    await expect(window.getByTestId('CONTRACT_OUTPUT')).toHaveText('returns string');

    // Node builtin bound as a VALUE (`const separator = sep`): source is still `node:path` (NOT `pkg
    // path`), and the OUTPUT is the declared literal-union TYPE — a `type "\\" | "/"` line, never the `—`
    // an unsigned callable would show.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_BUILTIN}"]`).click();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText('sep');
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText('node:path');
    await expect(window.getByTestId('CONTRACT_OUTPUT')).toHaveText('type "\\\\" | "/"');

    // Ambient globals, two forms in one file: `process.env` is a MEMBER ACCESS carrying the member TYPE
    // `NodeJS.ProcessEnv`, `process.cwd` is a CALLED method carrying `returns string`. Both source `global`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_PROCESS}"]`).click();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText(['process.env', 'process.cwd']);
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText(['global', 'global']);
    await expect(window.getByTestId('CONTRACT_OUTPUT')).toHaveText(['type NodeJS.ProcessEnv', 'returns string']);

    // A called ambient global method — `console.log`, sourced `global`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_CONSOLE}"]`).click();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACT_SYMBOL')).toHaveText('console.log');
    await expect(window.getByTestId('CONTRACT_SOURCE')).toHaveText('global');

    // A file that imports nothing and touches no ambient global has no edges, so the tab states its empty
    // prompt rather than an empty inspector.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();
    await window.getByTestId('TAB_CONTRACTS').click();
    await expect(window.getByTestId('CONTRACTS_EMPTY')).toHaveText('No contracts for this file');
    await expect(window.getByTestId('CONTRACT_ENTRY')).toHaveCount(0);
  });
});
