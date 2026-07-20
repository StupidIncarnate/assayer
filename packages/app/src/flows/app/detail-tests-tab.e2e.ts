/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's TESTS tab — the derived
 *   case set. Compiles the smoke-repo syntax-repository into a PER-TEST temp cache, launches the REAL
 *   built Electron app, selects a single file by its exact data-relpath, and asserts the entry title,
 *   the per-exit derived case rows, and the hover coupling that highlights the case a code line runs
 *   through. Covers the if-else / switch / boolean rungs and the nested-function driven-through-caller
 *   proof.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/detail-tests-tab.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts';
const SWITCH_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/switch/in-function/in-function.ts';
const BOOLEAN_AND = 'packages/syntax-repository/src/happy-path/boolean/and/and.ts';
const NESTED_FUNCTION = 'packages/syntax-repository/src/happy-path/composition/nested-function/nested-function.ts';

// The remaining branch/pure rungs, each selected by exact relPath and asserted in ONE launch (compile
// + launch once, walk many). Class rungs (if-else / switch in a method), the three boolean shapes, the
// composition rungs, and the branchless pure function + method.
const IF_ELSE_IN_CLASS = 'packages/syntax-repository/src/happy-path/if-else/in-class/in-class.ts';
const SWITCH_IN_CLASS = 'packages/syntax-repository/src/happy-path/switch/in-class/in-class.ts';
const BOOLEAN_OR = 'packages/syntax-repository/src/happy-path/boolean/or/or.ts';
const BOOLEAN_NOT = 'packages/syntax-repository/src/happy-path/boolean/not/not.ts';
const BOOLEAN_MIXED = 'packages/syntax-repository/src/happy-path/boolean/mixed/mixed.ts';
const SWITCH_IN_IF = 'packages/syntax-repository/src/happy-path/composition/switch-in-if/switch-in-if.ts';
const IF_IN_SWITCH = 'packages/syntax-repository/src/happy-path/composition/if-in-switch/if-in-switch.ts';
const FALLTHROUGH_IN_IF = 'packages/syntax-repository/src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts';
const PURE_FUNCTION = 'packages/syntax-repository/src/happy-path/function/function.ts';
const PURE_CLASS = 'packages/syntax-repository/src/happy-path/class/class.ts';

// The ternary / short-circuit / value-position conditional rungs. Exit-position ternaries (block return
// and concise arrow), the nested-ternary recursion, the assumed ternaries (`||`/`&&`/`??` read as a
// controlling operand), and the value-flow `const x = ternary; return x` tail — each selected by exact
// relPath and asserted per-arm, one derived case per reachable path.
const TERNARY_RETURN_BASIC = 'packages/syntax-repository/src/happy-path/ternary/return-basic/return-basic.ts';
const TERNARY_RETURN_NESTED = 'packages/syntax-repository/src/happy-path/ternary/return-nested/return-nested.ts';
const TERNARY_ARROW_BASIC = 'packages/syntax-repository/src/happy-path/ternary/arrow-basic/arrow-basic.ts';
const TERNARY_VALUE_BASIC = 'packages/syntax-repository/src/happy-path/ternary/value-basic/value-basic.ts';
const SHORT_CIRCUIT_OR_CHAIN = 'packages/syntax-repository/src/happy-path/short-circuit/or-chain/or-chain.ts';
const SHORT_CIRCUIT_AND_CHAIN = 'packages/syntax-repository/src/happy-path/short-circuit/and-chain/and-chain.ts';
const SHORT_CIRCUIT_NULLISH = 'packages/syntax-repository/src/happy-path/short-circuit/nullish/nullish.ts';

// The module-scope entries — the two env-DRIVEN pure statements (labelled by filename), and the five
// consumption modules, each labelled by its single exported binding (Slice-12) or, for the side-effect
// console call, its filename.
const IF_ELSE_PURE_STATEMENT = 'packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.ts';
const SWITCH_PURE_STATEMENT = 'packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.ts';
const USES_GREETING = 'packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.ts';
const USES_BUILTIN = 'packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.ts';
const CALLS_JOIN = 'packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.ts';
const USES_PACKAGE = 'packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.ts';
const USES_CONSOLE = 'packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.ts';

test.describe('Compiled Surface Explorer — Tests tab', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {happy-path/if-else/in-function/in-function.ts selected} => the Tests tab lists the 2 derived cases and hovering L3 highlights the then-case', async () => {
    // Precondition: compile the syntax-repository into .assayer/cache, then open the file's compiled view.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();

    // code-shown: the read-only CodeMirror renders the cached blob, and the right detail panel is up.
    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Tests tab (the default active tab): the single entry, plus one derived case per reachable exit.
    // TEST_ENTRY wraps the title AND the case rows, so assert the entry TITLE (its first child) exactly.
    const entryTitle = window.getByTestId('TEST_ENTRY').locator('> *').first();
    await expect(entryTitle).toHaveText('classify(value) · 2 cases');
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'not run classify(5) → reaches L6',
      'not run classify(6) → reaches L3',
    ]);

    // Hover transition — before hover: no case row is highlighted.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveCount(0);

    // Hover code line 3 (the then-return): its case row highlights (data-match=true); the L6 case dims.
    await codePanel.locator('.cm-line').nth(2).hover();
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveText(
      'not run classify(6) → reaches L3',
    );
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveText(
      'not run classify(5) → reaches L6',
    );
  });

  test('VALID: {happy-path/switch/in-function/in-function.ts selected} => the switch over a 3-member union derives 3 exhaustive cases (one per label + the default\'s single uncovered member) and hovering the default return highlights only that case', async () => {
    // Precondition: compile the syntax-repository into .assayer/cache, then open the switch file's view.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_FUNCTION}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Tests tab: the switch over `'get' | 'post' | 'delete'` yields exactly 3 cases — one per case
    // label, plus the default binding the SINGLE union member no case covers ('delete'). Every arrange
    // value is derived from the type, never from running the code (P4).
    const entryTitle = window.getByTestId('TEST_ENTRY').locator('> *').first();
    await expect(entryTitle).toHaveText('routeLabel(method) · 3 cases');
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'not run routeLabel("delete") → reaches L8',
      'not run routeLabel("get") → reaches L4',
      'not run routeLabel("post") → reaches L6',
    ]);

    // Hover the default return (L8): only the default's case (reaches L8) runs through it, so exactly
    // that one row highlights and the two labelled cases dim.
    await codePanel.locator('.cm-line').nth(7).hover();
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveText(
      'not run routeLabel("delete") → reaches L8',
    );
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveCount(2);
  });

  test('VALID: {happy-path/boolean/and/and.ts selected} => the compound condition derives one case per CAUSE (1 then + 2 else)', async () => {
    // Precondition: compile the syntax-repository into .assayer/cache, then open the && specimen.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // `score > 5 && bonus > 1` is false for TWO distinct reasons, so the else exit owes two cases —
    // and each carries values that actually drive it there. Read as one opaque operand, this
    // condition derived two IDENTICAL cases, one of which claimed an exit its values cannot reach.
    const entryTitle = window.getByTestId('TEST_ENTRY').locator('> *').first();
    await expect(entryTitle).toHaveText('grade(score, bonus) · 3 cases');
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      // score fails its own test, so bonus never evaluates and is left at its fill value.
      'not run grade(5, 7) → reaches L6',
      // score passes, so bonus is the operand that decides.
      'not run grade(6, 1) → reaches L6',
      'not run grade(6, 2) → reaches L3',
    ]);
  });

  test('VALID: {happy-path/ternary/return-basic/return-basic.ts selected} => the exit-position ternary splits into a then/else return, one case per arm, and hovering the ternary line highlights both', async () => {
    // Precondition: compile the syntax-repository into .assayer/cache, then open the ternary file's view.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_BASIC}"]`).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // `return n > 5 ? 'big' : 'small'` is two guarded returns: the condition is one ternary branch, each
    // arm a return exit. n=6 takes the then-arm, n=5 the else — both derived from the operand's type,
    // never from running the code (P4). Both exits sit on the ternary's own line (L2).
    const entryTitle = window.getByTestId('TEST_ENTRY').locator('> *').first();
    await expect(entryTitle).toHaveText('classify(n) · 2 cases');
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'not run classify(5) → reaches L2',
      'not run classify(6) → reaches L2',
    ]);

    // Hover transition — before hover: no case row is highlighted.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveCount(0);

    // Hover the ternary line (L2): the condition and BOTH arms share that single line, so every case runs
    // through it — both rows highlight (data-match=true) and none dims. A single-line ternary couples its
    // whole case set to its one line, which is exactly what the gutter/hover coupling must show.
    await codePanel.locator('.cm-line').nth(1).hover();
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveCount(2);
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveCount(0);
  });

  test('VALID: {happy-path/composition/nested-function/nested-function.ts selected} => the private inner is DRIVEN through outer, its branch covered by cases arranged in the caller param', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${NESTED_FUNCTION}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The whole point of Stage B, proven across the real IPC crossing: `inner` is unexported, so
    // nothing calls it directly — yet it is a DRIVEN entry here, its `n > 5` branch covered by cases
    // that set `outer`'s own `value` (inner(6) reaches the then-return L4, inner(5) the else L7), while
    // `outer` keeps its own trivial case. Nothing is admitted undriven: following the call graph
    // reached it, and that fact travelled core -> cache -> IPC to this panel.
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'not run inner(5) → reaches L7',
      'not run inner(6) → reaches L4',
      'not run outer(7) → reaches L10',
    ]);
    await expect(window.getByTestId('UNDRIVEN')).toHaveCount(0);
  });

  test('VALID: {compile+launch once, walk the class/boolean/composition/pure rungs} => each file\'s Tests tab lists its exact entry title and derived cases', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });

    // Each file is selected by its exact relPath; gating on the (unique) entry title lets the case-row
    // read settle on the newly-opened file before it is asserted whole. Class rung — an `if` in a method.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_CLASS}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('classify(value) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run classify(5) → reaches L7',
      'not run classify(6) → reaches L4',
    ]);

    // Class rung — a `switch` over a 3-member union in a method: one case per label + the default's member.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_CLASS}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('routeLabel(method) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run routeLabel("delete") → reaches L9',
      'not run routeLabel("get") → reaches L5',
      'not run routeLabel("post") → reaches L7',
    ]);

    // Boolean `||` — the else exit owes one case per CAUSE that makes the OR false; the then folds to one.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_OR}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('alarmLevel(temp, smoke) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run alarmLevel(50, false) → reaches L6',
      'not run alarmLevel(50, true) → reaches L3',
      'not run alarmLevel(51, false) → reaches L3',
    ]);

    // Boolean `!` — a single negated operand, one case per arm.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_NOT}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('gate(ready) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run gate(false) → reaches L3',
      'not run gate(true) → reaches L6',
    ]);

    // Boolean mixed `&&`/`||` — the compound condition fans out to four cause-distinct cases.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_MIXED}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('route(admin, level, owner) · 4 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run route(false, 7, false) → reaches L6',
      'not run route(true, 3, false) → reaches L6',
      'not run route(true, 3, true) → reaches L3',
      'not run route(true, 4, false) → reaches L3',
    ]);

    // Composition — a `switch` nested inside an `if`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_IF}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('route(enabled, method) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run route(false, "get") → reaches L11',
      'not run route(true, "get") → reaches L5',
      'not run route(true, "post") → reaches L7',
    ]);

    // Composition — an `if` nested inside a `switch`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_IN_SWITCH}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('describeRoute(method, size) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run describeRoute("get", 5) → reaches L8',
      'not run describeRoute("get", 6) → reaches L5',
      'not run describeRoute("post", 7) → reaches L10',
    ]);

    // Composition — a fall-through `switch` inside an `if`: read-accounted vs read-terminal keep it at one
    // convergent exit, so exactly one case (this is the specimen that pins those two predicates apart).
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${FALLTHROUGH_IN_IF}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('tally(value, mode) · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run tally(7, "abc123") → reaches L11',
    ]);

    // Branchless pure function — one exit, one derived case.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${PURE_FUNCTION}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('add(a, b) · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run add(7, 7) → reaches L2',
    ]);

    // Branchless constructable method — the zero-arg class means the runner can build one, so it is DRIVEN.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${PURE_CLASS}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('greet(name) · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run greet("abc123") → reaches L3',
    ]);

    // Ternary in a block return — the condition is one branch, each arm a guarded return, both on L2.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_BASIC}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('classify(n) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run classify(5) → reaches L2',
      'not run classify(6) → reaches L2',
    ]);

    // Nested ternary in the else arm — `g >= 90 ? a : g >= 80 ? b : c` recurses into three per-leaf exits.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_NESTED}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('grade(g) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run grade(79) → reaches L2',
      'not run grade(89) → reaches L2',
      'not run grade(90) → reaches L2',
    ]);

    // Concise-arrow body that IS a ternary — the exit-owning arrow splits without ever reaching an exit
    // statement, so both arm returns sit on the arrow's own line (L1).
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_ARROW_BASIC}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('classify(n) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run classify(5) → reaches L1',
      'not run classify(6) → reaches L1',
    ]);

    // Assumed ternary `||` chain — `a || b || 'default'` flattens its left spine to one branch per
    // controlling operand, one exit per path: a truthy; a empty + b truthy; both empty → the fall-through.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_OR_CHAIN}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('pick(a, b) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run pick("", "") → reaches L2',
      'not run pick("", "abc123") → reaches L2',
      'not run pick("abc123", "abc123") → reaches L2',
    ]);

    // Assumed ternary `&&` chain — the mirror: each operand's FALSY case short-circuits, the all-truthy
    // path falls through to the last operand.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_AND_CHAIN}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('all(a, b, c) · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run all(false, false, false) → reaches L2',
      'not run all(true, false, false) → reaches L2',
      'not run all(true, true, false) → reaches L2',
    ]);

    // Assumed ternary `??` — the operand's non-nullishness is the branch: non-null returns it, null/undefined
    // falls through to the right operand.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_NULLISH}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('orElse(a, b) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run orElse("abc123", "abc123") → reaches L2',
      'not run orElse(null, "abc123") → reaches L2',
    ]);

    // Value-position value-flow — `const label = n > 5 ? a : b; return label` collapses to the same split
    // an exit-position ternary gets, the binding never appearing.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_VALUE_BASIC}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('classify(n) · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run classify(5) → reaches L2',
      'not run classify(6) → reaches L2',
    ]);
  });

  test('VALID: {compile+launch once, walk the module-scope + consumption entries} => each is a DRIVEN module entry labelled by export-or-filename, its case row carrying no args', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });

    // A module scope DRIVEN from `process.env` — labelled by its filename, no `()`, and its case rows
    // carry NO args (a module is reached by importing it, not calling it).
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_PURE_STATEMENT}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('pure-statement.ts · 2 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run pure-statement.ts → reaches L4',
      'not run pure-statement.ts → reaches L6',
    ]);

    // The switch equivalent, DRIVEN from `Number(process.env.CODE)`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_PURE_STATEMENT}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('pure-statement.ts · 3 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run pure-statement.ts → reaches L11',
      'not run pure-statement.ts → reaches L5',
      'not run pure-statement.ts → reaches L8',
    ]);

    // Consumption: calls a LOCAL import (`greeting()`), labelled by its single export `message`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_GREETING}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('message · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run message → reaches L4',
    ]);

    // Consumption: binds a node BUILTIN as a value (`const separator = sep`), labelled `separator`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_BUILTIN}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('separator · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run separator → reaches L4',
    ]);

    // Consumption: CALLS a node builtin (`join(...)`), labelled by its single export `full`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${CALLS_JOIN}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('full · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run full → reaches L4',
    ]);

    // Consumption: calls an external PACKAGE (`greet(...)`), labelled by its single export `hello`.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_PACKAGE}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('hello · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run hello → reaches L4',
    ]);

    // Consumption: a side-effect `console.log(...)` with no export — labelled by its filename.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_CONSOLE}"]`).click();
    await expect(window.getByTestId('TEST_ENTRY').locator('> *').first()).toHaveText('uses-console.ts · 1 cases');
    expect([...(await window.getByTestId('TEST_CASE_ROW').allTextContents())].sort()).toStrictEqual([
      'not run uses-console.ts → reaches L4',
    ]);
  });
});
