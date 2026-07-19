/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer CODE VIEW — the read-only CodeMirror 6
 *   render of a cached blob and the per-line test-count gutter. Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects a
 *   single file by its exact data-relpath, and asserts the editor surface (line-number gutter, syntax
 *   highlighting, the exact cached bytes) and the `.cm-test-counts` gutter counts derived per line.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/code-view.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/if-else/in-function.ts';
const SWITCH_IN_FUNCTION = 'packages/syntax-repository/src/switch/in-function.ts';
const BOOLEAN_AND = 'packages/syntax-repository/src/boolean/and.ts';
const LOOP_IN_FUNCTION = 'packages/syntax-repository/src/loop/in-function.ts';

// The exact dark-spot tooltip the shaded region's gutter icon carries — the same sentence the detail
// panel prints, sourced from core's dark-spot channel (the `for…of` ratchet).
const LOOP_DARK_SPOT_LINE =
  'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it ' +
  'is covered';

test.describe('Compiled Surface Explorer — code view', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {if-else/in-function.ts selected} => CodeMirror renders the cached blob with a line gutter, syntax highlighting, and the exact cached lines, and the count gutter reads 2/1/1', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();

    // code-shown: read-only CodeMirror 6 renders the cached blob.
    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // obs-codemirror-linenumbers: a visible line-number gutter.
    await expect(codePanel.locator('.cm-lineNumbers')).toBeVisible();

    // obs-codemirror-highlight: TS syntax highlighting wraps tokens in styled spans inside lines.
    await expect(codePanel.locator('.cm-line span').first()).toBeVisible();

    // obs-code-from-cache: the rendered text equals the cached blob's lines[] for this relPath — the
    // exact bytes the compiler stored for if-else/in-function.ts. The source ends with a trailing
    // newline, so the compiler's per-line split records a final empty line[] entry — 8 lines total.
    const codeLines = await codePanel.locator('.cm-line').allTextContents();
    expect(codeLines).toStrictEqual([
      'export function classify(value: number): string {',
      '  if (value > 5) {',
      "    return 'big';",
      '  }',
      '',
      "  return 'small';",
      '}',
      '',
    ]);

    // Gutter: the .cm-test-counts gutter marks L2 (the `if` guard, on both cases' path) with 2, and
    // each exit line (L3 then-return, L6 fall-through return) with 1. Unmarked lines render empty
    // cells; the non-empty cells, in document order (2 < 3 < 6), read 2, 1, 1.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['2', '1', '1']);
  });

  test('VALID: {switch/in-function.ts selected} => the count gutter reads 2/1/2/1/1 across the discriminant and exit lines', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_FUNCTION}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // Gutter: each discriminant test line (L3 `case 'get'`, L5 `case 'post'`) is on 2 cases' paths (its
    // own case + the default, which must fail every case); each exit line (L4/L6/L8) is on 1. In
    // document order 3 < 4 < 5 < 6 < 8 the non-empty count cells read 2, 1, 2, 1, 1.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['2', '1', '2', '1', '1']);
  });

  test('VALID: {boolean/and.ts selected} => the count gutter reads 3/1/2 through the guard and both exits', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // Gutter: L2 (the `if`) is on all 3 cases' paths; L3 (then-return) on 1; L6 (else-return) on 2.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['3', '1', '2']);
  });

  test('VALID: {loop/in-function.ts selected} => the for…of body (L4-L6) is shaded as a dark spot and its gutter icon carries the admission tooltip', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${LOOP_IN_FUNCTION}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // The dark spot is marked ON THE SOURCE, not only in the side panel: the three lines of the unfollowed
    // `for…of` (L4-L6) carry the `.cm-dark-spot` line decoration, so the code itself stops reading as
    // understood. A file Assayer read completely shades nothing.
    await expect(codePanel.locator('.cm-dark-spot')).toHaveCount(3);

    // The region's FIRST line carries the single info icon, and its tooltip is the same sentence the
    // detail panel prints — one artifact, described identically on both surfaces.
    const icon = codePanel.locator('[data-testid="DARK_SPOT_ICON"]');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('title', LOOP_DARK_SPOT_LINE);
  });
});
