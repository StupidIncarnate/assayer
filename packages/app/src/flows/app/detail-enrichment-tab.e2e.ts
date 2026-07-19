/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's ENRICHMENT tab — the
 *   per-line data facts (a param's symbol + type, a branch operand's representative value range).
 *   Compiles the smoke-repo syntax-repository into a PER-TEST temp cache, launches the REAL built
 *   Electron app, selects a single file by its exact data-relpath, opens the Enrichment tab, and
 *   asserts its rows. Covers the single-operand if-else rung and the compound boolean rung whose two
 *   operands both get a range.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/detail-enrichment-tab.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts';
const BOOLEAN_AND = 'packages/syntax-repository/src/happy-path/boolean/and/and.ts';
// Union-member ranges on a switch discriminant, a class-method's per-line facts, and a consumption
// module with no enrichable line (nothing to derive a value for).
const SWITCH_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/switch/in-function/in-function.ts';
const IF_ELSE_IN_CLASS = 'packages/syntax-repository/src/happy-path/if-else/in-class/in-class.ts';
const USES_GREETING = 'packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.ts';

test.describe('Compiled Surface Explorer — Enrichment tab', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {happy-path/if-else/in-function/in-function.ts selected, Enrichment tab} => lists the per-line facts (param symbol + type, branch operand range { 6, 5 })', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Enrichment tab: the per-line data facts — L1 the param symbol + type, L2 the branch operand's
    // representative value range { 6, 5 }.
    await window.getByTestId('TAB_ENRICHMENT').click();
    const enrichmentRows = await window.getByTestId('ENRICHMENT_ROW').allTextContents();
    expect([...enrichmentRows].sort()).toStrictEqual([
      'L1  value: number',
      'L2  value: number  → { 6, 5 }',
    ]);
  });

  test('VALID: {happy-path/boolean/and/and.ts selected, Enrichment tab} => both operands of the compound condition get their range on the branch line', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Enrichment: BOTH operands of the compound condition get their range on the branch line. A
    // compound condition previously enriched neither, having no single operand to name.
    await window.getByTestId('TAB_ENRICHMENT').click();
    const enrichmentRows = await window.getByTestId('ENRICHMENT_ROW').allTextContents();
    expect([...enrichmentRows].sort()).toStrictEqual([
      'L1  bonus: number',
      'L1  score: number',
      'L2  bonus: number  → { 2, 1 }',
      'L2  score: number  → { 6, 5 }',
    ]);
  });

  test('VALID: {compile+launch once, walk a switch, a class method, and an import-only module} => union-member ranges, class-method facts, and the empty prompt', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });

    // Switch discriminant: each `case` line's range is the whole union, rotated so the matched member is
    // first — the exhaustive per-member fan-out `read-operand-type` deliberately preserves. `toHaveText`
    // with an ordered array retries until the newly-selected file's rows have replaced the previous ones.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_FUNCTION}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();
    await window.getByTestId('TAB_ENRICHMENT').click();
    await expect(window.getByTestId('ENRICHMENT_ROW')).toHaveText([
      'L1  method: "get" | "post" | "delete"',
      'L3  method: "get" | "post" | "delete"  → { "get", "post", "delete" }',
      'L5  method: "get" | "post" | "delete"  → { "post", "get", "delete" }',
    ]);

    // A class method enriches exactly like a free function, one rung deeper: the param on its signature
    // line, the operand range on the branch line.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_CLASS}"]`).click();
    await window.getByTestId('TAB_ENRICHMENT').click();
    await expect(window.getByTestId('ENRICHMENT_ROW')).toHaveText([
      'L2  value: number',
      'L3  value: number  → { 6, 5 }',
    ]);

    // A module that only imports and calls has no operand and no param to enrich, so the tab states its
    // empty prompt rather than an empty list that reads as "still loading".
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_GREETING}"]`).click();
    await window.getByTestId('TAB_ENRICHMENT').click();
    await expect(window.getByTestId('ENRICHMENT_EMPTY')).toHaveText('No enrichment for this file');
    await expect(window.getByTestId('ENRICHMENT_ROW')).toHaveCount(0);
  });
});
