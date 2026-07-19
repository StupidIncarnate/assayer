/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer RUN flow + console. Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects
 *   happy-path/boolean/and/and.ts, and drives the Run action — the ONE assertion that proves the desktop's spawn of
 *   the same binary a human types actually terminates and streams the real CLI report. Also covers the
 *   negative: opening a file and never clicking Run leaves no console and executes nothing.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/run-console.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const BOOLEAN_AND = 'packages/syntax-repository/src/happy-path/boolean/and/and.ts';
const RUN_GAP_SPECIMEN = 'packages/syntax-repository/src/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts';

// The two GAP lines a RUN surfaces for sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts — `GAP <name> — <reason>`, both authored
// in core's case-set-projection. `Repo`'s constructor needs a `url`, so no instance can be built: the
// constructor (reached through `new`) and the method `find` are BOTH understood-but-unconstructable, the
// caller's debt to close with a harness. They ride beside the file's one driven entry `tally`, and appear
// only after a Run (they travel on the run artifact, not the static analysis).
const RUN_GAP_CONSTRUCTOR_LINE =
  'GAP constructor — a constructor is reached through `new`, which the runner does not drive — needs a harness';
const RUN_GAP_METHOD_LINE =
  'GAP find — its class needs constructor arguments, so no instance can be built to drive it — needs a harness';

test.describe('Compiled Surface Explorer — Run flow + console', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {happy-path/boolean/and/and.ts open, click Run} => the run finishes and every derived case reads the CLI verdict, with no run error', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Opening a file LOADS its last run and never starts one, so all three cases read not-run here.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="not-run"]')).toHaveCount(3);

    await window.getByTestId('RUN_BUTTON').click();

    // run-done: the UI's Run spawns the same binary a human types, so this is the ONE assertion that
    // proves that spawn actually terminates. Only an e2e can: the desktop's `process.execPath` is the
    // ELECTRON binary here, exactly as in production, where a unit test's mocked spawn would not be.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="passed"]')).toHaveCount(3);
    await expect(window.getByTestId('RUN_ERROR')).toHaveCount(0);

    // The verdict reaches the row it belongs to — not-run must not survive anywhere on the panel.
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'PASS grade(5, 0) → reaches L6',
      'PASS grade(6, 1) → reaches L6',
      'PASS grade(6, 2) → reaches L3',
    ]);

    // A finished run must SAY it finished: the button leaves its loading state rather than spinning on.
    await expect(window.locator('[data-testid="RUN_BUTTON"][data-loading="true"]')).toHaveCount(0);

    // The console carries the REAL CLI report — the same bytes `assayer unit` writes to a terminal,
    // streamed over the run-output channel. Anything less and the panel could disagree with the CLI.
    await expect(window.getByTestId('RUN_CONSOLE_STATUS')).toHaveText('Finished');
    await expect(window.getByTestId('RUN_CONSOLE_OUTPUT')).toContainText(
      `${BOOLEAN_AND}  3/3 passed`,
    );

    // The rightmost column, and WHOLLY on screen. Geometry rather than presence, because a
    // fixed-width column that overflows the window is clipped away by the root's overflow:hidden
    // while still being visible to every query — present in the DOM, and invisible to a human.
    const consoleBox = await window.getByTestId('RUN_CONSOLE').boundingBox();
    const detailBox = await window.getByTestId('DETAIL_PANEL').boundingBox();
    const innerWidth = await window.evaluate(() => globalThis.innerWidth);

    expect(Math.round((consoleBox?.x ?? 0) + (consoleBox?.width ?? 0))).toBe(innerWidth);
    expect((consoleBox?.x ?? 0) > (detailBox?.x ?? 0)).toBe(true);

    // Nothing was starved to make room: the code pane is still a usable width, not a slot of gutter.
    const codeBox = await window.locator('.cm-editor').boundingBox();

    expect((codeBox?.width ?? 0) > 300).toBe(true);
  });

  test('VALID: {app opened and a file selected, Run never clicked} => no run console and no run happens', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Opening the app and clicking through the tree must never execute the repo. The console is the
    // Run action's own output, so its absence here is the evidence that nothing ran — as is every
    // case still reading not-run.
    await expect(window.getByTestId('RUN_CONSOLE')).toHaveCount(0);
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="not-run"]')).toHaveCount(3);
  });

  test('VALID: {sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts open, click Run} => the run drives the one buildable entry and surfaces the two GAP rows for the unconstructable class', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${RUN_GAP_SPECIMEN}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Before a Run, no gaps are shown: they ride the run artifact, not the static analysis. There is a Run
    // to click because the file has a buildable `tally` entry.
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);

    await window.getByTestId('RUN_BUTTON').click();

    // run-done: the case set drives ONLY the buildable `tally` (the unconstructable class members are
    // gaps, not entries), so exactly one case runs and passes. The exit code is NOT the verdict — the run
    // wrote an artifact whose GAPS travel to the panel, naming the constructor and `find` the caller must
    // write a harness for, worded exactly as `assayer unit` prints them, in the case set's own order.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="passed"]')).toHaveText(
      'PASS tally(0) → reaches L2',
    );
    await expect(window.getByTestId('RUN_GAP')).toHaveText([RUN_GAP_CONSTRUCTOR_LINE, RUN_GAP_METHOD_LINE]);
    await expect(window.getByTestId('RUN_ERROR')).toHaveCount(0);
  });
});
