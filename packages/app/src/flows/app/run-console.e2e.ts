/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer RUN flow + console. Compiles the manual-smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects
 *   happy-path/boolean/and/and.ts, and drives the Run action — the ONE assertion that proves the desktop's spawn of
 *   the same binary a human types actually terminates and streams the real CLI report. Also covers the
 *   negative: opening a file and never clicking Run leaves no console and executes nothing.
 *
 *   It also drives the INPUT-GAP pair, which is the only place the desktop's two gap producers are read
 *   side by side: the invoiced file states its gap the moment it is opened (the analysis carries it, so
 *   no run is needed), while its harness twin — the same source with a committed `<basename>.harness.ts`
 *   — already shows the cases that harness bought and runs them green.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/run-console.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect } from '../../../test/harnesses/e2e-fixtures';

const BOOLEAN_AND = 'packages/syntax-repository/src/happy-path/boolean/and/and.ts';
const RUN_GAP_SPECIMEN = 'packages/syntax-repository/src/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts';
const INPUT_GAP_SPECIMEN = 'packages/syntax-repository/src/sad-path/input-gap/callback-param/callback-param.ts';
// Its PAID twin — byte for byte the same source, with a committed `callback-param.harness.ts` beside
// it. The harness is the only difference between the two files, so the pair is what proves the invoice
// above is closable rather than merely printable.
const HARNESS_SPECIMEN = 'packages/syntax-repository/src/happy-path/harness/callback-param/callback-param.ts';

// The ACCESS-shaped GAP line a RUN surfaces for sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts —
// `GAP <name> — <reason>`, authored in core's case-set-projection. `Repo`'s constructor needs a `url`,
// so the runner builds no zero-argument instance, and the instance method `find` is
// understood-but-unconstructable, the caller's debt to close with a harness. The constructor itself is
// driven: the runner constructs `Repo` with the `url` the case arranges. Both ride beside `tally`.
const RUN_GAP_METHOD_LINE =
  'GAP find — its class needs constructor arguments, so no instance can be built to drive it — needs a harness';

// The INPUT-shaped gap, and the other producer of the same channel: `audit` takes a callback, no value
// in the arrange vocabulary is a function, so the fill seam refuses it and the file derives nothing. This
// one rides the ANALYSIS, so the panel states it the moment the file is opened — verbatim, because it is
// product surface an LLM acts on with no human.
const INPUT_GAP_LINE =
  'GAP audit — `audit` derives no case, because Assayer cannot construct an input it needs. It ' +
  'builds inputs out of declared DATA — a scalar, a union, an array, or an object shape whose every ' +
  'property is itself one — and refuses anything that bottoms out in a function or in a type carrying ' +
  'nothing but its name: `report: (message: string) => string`. Substituting a stand-in would be worse ' +
  'than deriving nothing: code that CALLS the value throws on it, and code that merely measures it ' +
  'passes on something nobody supplied. Assayer read the signature perfectly — this is not syntax it ' +
  "missed — so the value is the caller's to supply. Colocate a harness with this file, the same " +
  "basename with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from " +
  "'@assayer/core'; assayerHarness({ inputs: { audit: { report: <a (message: string) => string> } } });`. " +
  'Assayer then builds them from that declaration instead of refusing them; anything else still ' +
  'standing between `audit` and a case is reported on its own line.';

test.describe('Compiled Surface Explorer — Run flow + console', () => {
  test('VALID: {happy-path/boolean/and/and.ts open, click Run} => the run finishes and every derived case reads the CLI verdict, with no run error', async ({ smokeWindow: window }) => {
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
      "PASS grade(5, 7) → 'fail' (reaches L6)",
      "PASS grade(6, 1) → 'fail' (reaches L6)",
      "PASS grade(6, 2) → 'pass' (reaches L3)",
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

  test('VALID: {app opened and a file selected, Run never clicked} => no run console and no run happens', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Opening the app and clicking through the tree must never execute the repo. The console is the
    // Run action's own output, so its absence here is the evidence that nothing ran — as is every
    // case still reading not-run.
    await expect(window.getByTestId('RUN_CONSOLE')).toHaveCount(0);
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="not-run"]')).toHaveCount(3);
  });

  test('VALID: {sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts open, click Run} => the run drives `tally` and the constructor and surfaces the GAP row for the unconstructable method', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${RUN_GAP_SPECIMEN}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // This file's debt is ACCESS-shaped, and only the case-set projection knows it: every declared
    // parameter here — `value`, `url`, `id` — is a scalar the fill seam constructs happily, so the
    // file's own analysis invoices nothing and no gap shows yet. The panel IS populated — all four
    // derived cases across `tally`, the constructor and `find` are on screen, none run — so the absent
    // gap row is the finding rather than a panel that failed to render. The run below is what turns
    // the unconstructable method into a gap.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="not-run"]')).toHaveCount(4);
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);

    await window.getByTestId('RUN_BUTTON').click();

    // run-done: the case set drives `tally`, and the constructor through `new Repo(url)` with the
    // representative string the fill seam builds for `url`. Its body ends on line 6 with no value, so
    // its exit carries `undefined`. `find` needs an instance no zero-argument call can build, so it is a
    // gap, not an entry. The exit code is NOT the verdict — the run wrote an artifact whose GAP travels
    // to the panel, worded exactly as `assayer unit` prints it.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="passed"]')).toHaveText([
      'PASS tally(7) → 8 (reaches L2)',
      'PASS constructor("abc123") → undefined (reaches L6)',
    ]);
    await expect(window.getByTestId('RUN_GAP')).toHaveText([RUN_GAP_METHOD_LINE]);
    await expect(window.getByTestId('RUN_ERROR')).toHaveCount(0);

    // The claim the panel's own header makes — every admission worded exactly as `assayer unit` prints
    // it — asserted as BYTES rather than left as prose. The console carries the real CLI report, so the
    // same row appears there, indented and otherwise identical. This is the only check that reads both
    // surfaces at once, and a wording change on either side that the other does not follow fails here.
    await expect(window.getByTestId('RUN_CONSOLE_OUTPUT')).toContainText(`  ${RUN_GAP_METHOD_LINE}`);
  });

  test('VALID: {sad-path/input-gap/callback-param/callback-param.ts open, Run never clicked} => the input-gap invoice is already on the panel', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${INPUT_GAP_SPECIMEN}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The other producer, and the one that does NOT wait for a run. `audit` is understood perfectly and
    // derives nothing because its callback cannot be constructed — so without this row the panel shows
    // an entry with zero cases and no reason for it, which reads exactly like a file with nothing to
    // test. The whole line is asserted because the remedy is the part a reader acts on.
    await expect(window.getByTestId('RUN_GAP')).toHaveText([INPUT_GAP_LINE]);

    // Nothing ran: no console, no verdict, and no case row to carry one. The invoice came off the
    // static analysis the compile already wrote.
    await expect(window.getByTestId('RUN_CONSOLE')).toHaveCount(0);
    await expect(window.getByTestId('TEST_CASE_ROW')).toHaveCount(0);
  });

  test('VALID: {happy-path/harness/callback-param/callback-param.ts open, click Run} => the colocated harness pays the invoice and both arms run green', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${HARNESS_SPECIMEN}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The controlled half of the pair. Same source as the invoiced file above, plus a committed
    // `callback-param.harness.ts` — and BEFORE any run the panel already shows two cases where the twin
    // shows an invoice, because the harness overlay runs where the compiled view is resolved. Each row
    // names the key path rather than a value: only KEYS are cached, and the value is a live callback the
    // run resolves by loading the same file.
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);
    const derivedRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...derivedRows].sort()).toStrictEqual([
      'not run audit(10, <harness inputs.audit.report>) → reaches L6',
      'not run audit(11, <harness inputs.audit.report>) → reaches L3',
    ]);

    await window.getByTestId('RUN_BUTTON').click();

    // run-done, and the whole point of the feature: the shim required the harness through the same
    // ts-jest transform, the registrar collected what its body declared, and the interpreter resolved
    // `inputs.audit.report` to the real function. `audit` CALLS what it is handed — a stand-in string
    // would throw and both rows would read ERROR — so two PASSes are the evidence that the author's own
    // value reached the code.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-status="passed"]')).toHaveCount(2);
    await expect(window.getByTestId('RUN_ERROR')).toHaveCount(0);

    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      "PASS audit(10, <harness inputs.audit.report>) → 'audited:under' (reaches L6)",
      "PASS audit(11, <harness inputs.audit.report>) → 'audited:over' (reaches L3)",
    ]);

    // The CLI report agrees, and still invoices nothing: a paid gap must not be reprinted beside the
    // cases it bought.
    await expect(window.getByTestId('RUN_CONSOLE_STATUS')).toHaveText('Finished');
    await expect(window.getByTestId('RUN_CONSOLE_OUTPUT')).toContainText(`${HARNESS_SPECIMEN}  2/2 passed`);
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);
  });
});
