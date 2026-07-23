/**
 * PURPOSE: Playwright e2e for the STUB REPOSITORY view. Compiles the smoke-repo syntax-repository into
 *   a PER-TEST temp cache via the built CLI precheck, launches the REAL built Electron desktop app,
 *   switches from the explorer to `/stubs` through the nav, and asserts the merged stub view renders
 *   real smoke-repo stubs: an OBJECT card (the cross-file-shape Config with its two readers, its
 *   per-property values, and its `unknown` retries), the committed OVERLAY merged in (branch-local
 *   Config's mode shows the corrected `staging`, which exists only in `assayer/stubs/`), and an ENV
 *   card (`process.env#CODE` with its guessed values). Also asserts the nav switches both ways.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/stub-repository.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const CROSS_FILE_KEY = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/types.ts#Config';
const BRANCH_LOCAL_KEY = 'packages/syntax-repository/src/happy-path/object/branch-local/branch-local.ts#Config';
const CODE_KEY = 'process.env#CODE';
const CROSS_FILE_READER_A = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/cross-file-shape.ts';
const CROSS_FILE_READER_B = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/reader-b.ts';

test.describe('Stub Repository view', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {compiled syntax-repository cache, nav to /stubs} => renders object + env stubs with readers, values, unknown, the merged overlay correction, and the nav switches views', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    // The nav is the shell around every view. It resolves as soon as the window paints.
    await expect(window.getByTestId('EXPLORER_NAV')).toBeVisible({ timeout: 30_000 });
    await expect(window.getByTestId('STUB_NAV')).toBeVisible();
    // The index route is the compiled-surface explorer.
    await expect(window.getByTestId('SURFACE_EXPLORER')).toBeVisible();

    // nav-switch: clicking Stub Repository swaps the body — the explorer disappears, the stub view appears.
    await window.getByTestId('STUB_NAV').click();
    await expect(window.getByTestId('SURFACE_EXPLORER')).not.toBeVisible();
    await expect(window.getByTestId('STUB_REPOSITORY')).toBeVisible();
    // The stub view fetches over the new `assayer:stubs` IPC channel; wait for the first card.
    await expect(window.getByTestId('STUB_CARD').first()).toBeVisible({ timeout: 30_000 });

    // OBJECT stub: the cross-file Config, keyed on its DEFINITION site, unioned across both readers.
    const crossFileCard = window.locator(`[data-testid="STUB_CARD"][data-stubkey="${CROSS_FILE_KEY}"]`);
    await expect(crossFileCard).toBeVisible();
    // readers[] — the two files that branch on this type, the inventory a human eyeballs.
    expect(await crossFileCard.getByTestId('STUB_READER').allTextContents()).toEqual([
      CROSS_FILE_READER_A,
      CROSS_FILE_READER_B,
    ]);
    // per-property values: region is branched on 'us' (plus a representative), retries is read by no
    // one, so it is an honest `unknown`.
    expect(
      await crossFileCard.locator('[data-testid="STUB_PROPERTY"][data-propname="region"]').getByTestId('STUB_PROPERTY_VALUE').allTextContents(),
    ).toEqual(['abc123', 'us']);
    await expect(
      crossFileCard.locator('[data-testid="STUB_PROPERTY"][data-propname="retries"]').getByTestId('STUB_UNKNOWN'),
    ).toHaveText('unknown');

    // OVERLAY MERGE: branch-local Config's `mode` shows the committed correction (a, dev, prod, staging).
    // `dev`/`prod`/`staging` exist ONLY in assayer/stubs/, never in the derived index — so seeing them
    // proves the desktop resolver combined the committed overlay with the cache-derived stub index.
    const branchLocalCard = window.locator(`[data-testid="STUB_CARD"][data-stubkey="${BRANCH_LOCAL_KEY}"]`);
    expect(
      await branchLocalCard.locator('[data-testid="STUB_PROPERTY"][data-propname="mode"]').getByTestId('STUB_PROPERTY_VALUE').allTextContents(),
    ).toEqual(['a', 'dev', 'prod', 'staging']);

    // ENV stub: process.env#CODE — process.env is an object; CODE's values are GUESSED from the branch
    // literals (case 1, case 2, and a representative for everything else).
    const codeCard = window.locator(`[data-testid="STUB_CARD"][data-stubkey="${CODE_KEY}"]`);
    await expect(codeCard).toBeVisible();
    await expect(codeCard.getByTestId('STUB_GUESSED')).toHaveText('guessed');
    expect(await codeCard.getByTestId('STUB_PROPERTY_VALUE').allTextContents()).toEqual(['1', '2', '7']);

    // nav-switch back: Explorer restores the compiled-surface view and hides the stub view.
    await window.getByTestId('EXPLORER_NAV').click();
    await expect(window.getByTestId('STUB_REPOSITORY')).not.toBeVisible();
    await expect(window.getByTestId('SURFACE_EXPLORER')).toBeVisible();
  });
});
