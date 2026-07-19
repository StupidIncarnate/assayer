/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer RAW JSON tab — the full cache blob shown
 *   as pretty-printed JSON. Compiles the smoke-repo syntax-repository into a PER-TEST temp cache,
 *   launches the REAL built Electron app, selects a file, switches to the Raw JSON tab, and asserts
 *   the blob carries the file's relPath, its content-hash key, and a DERIVED coverage ID — while the
 *   code pane and right detail panel unmount (keepMounted=false).
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/raw-json-view.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts';

test.describe('Compiled Surface Explorer — Raw JSON tab', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {happy-path/if-else/in-function/in-function.ts selected, switch to Raw JSON tab} => shows the full cache blob (relPath + contentHash + derived analysis) at full width and hides the right detail panel', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();

    // Code tab (default): the code pane and the right detail panel are both up.
    await expect(window.getByTestId('EXPLORER_CODE').locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Switch to the Raw JSON tab: the detail panel is unmounted (keepMounted=false), and the blob is
    // shown as pretty-printed JSON — the exact CompiledFileView the app received from the cache.
    await window.getByTestId('VIEW_TAB_RAW').click();

    const rawBlob = window.getByTestId('RAW_BLOB');
    await expect(rawBlob).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toHaveCount(0);
    await expect(window.getByTestId('EXPLORER_CODE')).toHaveCount(0);

    // The JSON carries the file's relPath, the content-hash blob key, and the DERIVED analysis
    // (coverage IDs) — i.e. exactly what the compiler wrote to .assayer/cache.
    await expect(rawBlob).toContainText('"relPath": "packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts"');
    await expect(rawBlob).toContainText('"contentHash":');
    // The exit ID names the BRANCH it crossed, not just the arm — two sibling `then`-returns in one
    // scope would otherwise key identically, and the ref-to-ref diff keys on exactly this.
    await expect(rawBlob).toContainText(
      'classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
    );
  });
});
