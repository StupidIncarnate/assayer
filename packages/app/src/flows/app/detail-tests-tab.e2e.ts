/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's TESTS tab — the derived
 *   case set. Reads the manual-smoke-repo syntax-repository cache that globalSetup compiles once, through the
 *   REAL built Electron app the e2e fixture keeps warm, selects a single file by its exact
 *   data-relpath, and asserts the entry title, the per-exit derived case rows, and the hover coupling that highlights the case a code line runs
 *   through. Covers the if-else / switch / boolean rungs and the nested-function funnel proof (the
 *   private inner driven through outer, folded into outer's single entry).
 *
 *   It also proves the two labelled case sets: every entry lists "Every route" (one case per route that
 *   can run, full rows) and "Fewest runs" (the smallest subset taking every reachable arm, the set Assayer
 *   runs). Rows outside the run set read `data-running="false"`, and each row names the arms its route takes.
 *
 * USAGE:
 * npm run ward -- --files=packages/app/src/flows/app/detail-tests-tab.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect } from "../../../test/harnesses/e2e-fixtures";

const IF_ELSE_IN_FUNCTION =
  "packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts";
const SWITCH_IN_FUNCTION =
  "packages/syntax-repository/src/happy-path/switch/in-function/in-function.ts";
const BOOLEAN_AND =
  "packages/syntax-repository/src/happy-path/boolean/and/and.ts";
const NESTED_FUNCTION =
  "packages/syntax-repository/src/happy-path/function/nested/nested.ts";
// An array-param rung: branchless, but the array fans out over cardinality into three cases, proving the
// cardinality matrix and the fewest-runs set reach the renderer.
const ARRAY_ELEMENT_LENGTH =
  "packages/syntax-repository/src/happy-path/array/element-length/element-length.ts";

// The remaining branch/pure rungs, each selected by exact relPath and asserted in ONE test on the shared
// window (walk many). Class rungs (if-else / switch in a method), the three boolean shapes, the
// composition rungs, and the branchless pure function + method.
const IF_ELSE_IN_CLASS =
  "packages/syntax-repository/src/happy-path/if-else/in-class/in-class.ts";
const SWITCH_IN_CLASS =
  "packages/syntax-repository/src/happy-path/switch/in-class/in-class.ts";
const BOOLEAN_OR = "packages/syntax-repository/src/happy-path/boolean/or/or.ts";
const BOOLEAN_NOT =
  "packages/syntax-repository/src/happy-path/boolean/not/not.ts";
const BOOLEAN_MIXED =
  "packages/syntax-repository/src/happy-path/boolean/mixed/mixed.ts";
const SWITCH_IN_IF =
  "packages/syntax-repository/src/happy-path/composition/switch-in-if/switch-in-if.ts";
const IF_IN_SWITCH =
  "packages/syntax-repository/src/happy-path/composition/if-in-switch/if-in-switch.ts";
const FALLTHROUGH_IN_IF =
  "packages/syntax-repository/src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts";
const PURE_FUNCTION =
  "packages/syntax-repository/src/happy-path/function/declaration/declaration.ts";
const PURE_CLASS = "packages/syntax-repository/src/happy-path/class/class.ts";

// The ternary / short-circuit / value-position conditional rungs. Exit-position ternaries (block return
// and concise arrow), the nested-ternary recursion, the assumed ternaries (`||`/`&&`/`??` read as a
// controlling operand), and the value-flow `const x = ternary; return x` tail — each selected by exact
// relPath and asserted per-arm, one derived case per reachable path.
const TERNARY_RETURN_BASIC =
  "packages/syntax-repository/src/happy-path/ternary/return-basic/return-basic.ts";
const TERNARY_RETURN_NESTED =
  "packages/syntax-repository/src/happy-path/ternary/return-nested/return-nested.ts";
const TERNARY_ARROW_BASIC =
  "packages/syntax-repository/src/happy-path/ternary/arrow-basic/arrow-basic.ts";
const TERNARY_VALUE_BASIC =
  "packages/syntax-repository/src/happy-path/ternary/value-basic/value-basic.ts";
const SHORT_CIRCUIT_OR_CHAIN =
  "packages/syntax-repository/src/happy-path/short-circuit/or-chain/or-chain.ts";
const SHORT_CIRCUIT_AND_CHAIN =
  "packages/syntax-repository/src/happy-path/short-circuit/and-chain/and-chain.ts";
const SHORT_CIRCUIT_NULLISH =
  "packages/syntax-repository/src/happy-path/short-circuit/nullish/nullish.ts";

// The module-scope entries — the two env-DRIVEN pure statements (labelled by filename), and the five
// consumption modules, each labelled by its single exported binding (Slice-12) or, for the side-effect
// console call, its filename.
const IF_ELSE_PURE_STATEMENT =
  "packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.ts";
const SWITCH_PURE_STATEMENT =
  "packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.ts";
const USES_GREETING =
  "packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.ts";
const USES_BUILTIN =
  "packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.ts";
const CALLS_JOIN =
  "packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.ts";
const USES_PACKAGE =
  "packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.ts";
const USES_CONSOLE =
  "packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.ts";

test.describe("Compiled Surface Explorer — Tests tab", () => {
  test("VALID: {happy-path/if-else/in-function/in-function.ts selected} => the Tests tab lists the 2 derived cases and hovering L3 highlights the then-case", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`,
      )
      .click();

    // code-shown: the read-only CodeMirror renders the cached blob, and the right detail panel is up.
    const codePanel = window.getByTestId("EXPLORER_CODE");
    await expect(codePanel.locator(".cm-editor")).toBeVisible();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // Tests tab (the default active tab): the single entry, plus one derived case per reachable exit.
    // TEST_ENTRY wraps the title AND the case rows, so assert the entry TITLE (its first child) exactly.
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("classify(value) · 2 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      "not run classify(5)",
      "not run classify(6)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 3: (not run)", "  => 6: (not run)"]);

    // Hover transition — before hover: no case row is highlighted.
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]'),
    ).toHaveCount(0);

    // Hover code line 3 (the then-return): its case row highlights (data-match=true); the L6 case dims.
    await codePanel.locator(".cm-line").nth(2).hover();
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]'),
    ).toHaveText("not run classify(6)");
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]'),
    ).toHaveText("not run classify(5)");
  });

  test("VALID: {happy-path/switch/in-function/in-function.ts selected} => the switch over a 3-member union derives 3 exhaustive cases (one per label + the default's single uncovered member) and hovering the default return highlights only that case", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_FUNCTION}"]`,
      )
      .click();

    const codePanel = window.getByTestId("EXPLORER_CODE");
    await expect(codePanel.locator(".cm-editor")).toBeVisible();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // Tests tab: the switch over `'get' | 'post' | 'delete'` yields exactly 3 cases — one per case
    // label, plus the default binding the SINGLE union member no case covers ('delete'). Every arrange
    // value is derived from the type, never from running the code (P4).
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("routeLabel(method) · 3 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'not run routeLabel("delete")',
      'not run routeLabel("get")',
      'not run routeLabel("post")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 4: (not run)",
      "  => 6: (not run)",
      "  => 8: (not run)",
    ]);

    // Hover the default return (L8): only the default's case (reaches L8) runs through it, so exactly
    // that one row highlights and the two labelled cases dim.
    await codePanel.locator(".cm-line").nth(7).hover();
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]'),
    ).toHaveText('not run routeLabel("delete")');
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]'),
    ).toHaveCount(2);
  });

  test("VALID: {happy-path/boolean/and/and.ts selected} => the compound condition derives one case per CAUSE (1 then + 2 else)", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_AND}"]`)
      .click();

    const codePanel = window.getByTestId("EXPLORER_CODE");
    await expect(codePanel.locator(".cm-editor")).toBeVisible();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // `score > 5 && bonus > 1` is false for TWO distinct reasons, so the else exit owes two cases —
    // and each carries values that actually drive it there. Read as one opaque operand, this
    // condition derived two IDENTICAL cases, one of which claimed an exit its values cannot reach.
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("grade(score, bonus) · 3 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      // score fails its own test, so bonus never evaluates and is left at its fill value.
      "not run grade(5, 7)",
      // score passes, so bonus is the operand that decides. Same else exit as grade(5, 7), so this is
      // the breadth twin: in Every route only, so it is not run.
      "not run grade(6, 1)",
      "not run grade(6, 2)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 3: (not run)",
      "  => 6: (not run)",
      "  => 6: (not run)",
    ]);

    // Two labelled sets. Every route holds all three cases; Fewest runs holds the two that together take
    // every arm of `score > 5 && bonus > 1` — the then-case grade(6,2) and the first else, grade(5,7).
    // grade(6,1) takes the same else arm as grade(5,7), so it is in Every route only and does not run.
    await expect(window.getByTestId("CASE_SET_LABEL")).toHaveText([
      "Every route · 3",
      "Fewest runs · 2",
    ]);
    expect(
      [
        ...(await window.getByTestId("FEWEST_RUNS_ROW").allTextContents()),
      ].sort(),
    ).toStrictEqual(["not run grade(5, 7)", "not run grade(6, 2)"]);
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-running="true"]'),
    ).toHaveCount(2);
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-running="false"]'),
    ).toHaveText("not run grade(6, 1)");
  });

  test("VALID: {happy-path/array/element-length/element-length.ts selected} => the array param fans out to three cardinality cases (empty/one/many) reaching the one exit, only the empty [] in the fewest-runs set", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${ARRAY_ELEMENT_LENGTH}"]`,
      )
      .click();

    const codePanel = window.getByTestId("EXPLORER_CODE");
    await expect(codePanel.locator(".cm-editor")).toBeVisible();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // `count(items: number[])` is branchless, but the array param FANS OUT over cardinality: three cases
    // reach the one exit (L2), each arranging a REAL array — the `[]` the fewest-runs set keeps plus the
    // `[7]`/`[7,8]` breadth that only Every route lists. The arrange renders as the array literal a reader would pass, positionally.
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("count(items) · 3 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      "not run count([7,8])",
      "not run count([7])",
      "not run count([])",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 2: (not run)",
      "  => 2: (not run)",
      "  => 2: (not run)",
    ]);

    // Branchless: no arm to take, so the fewest-runs set is the one case at the front of the set, the
    // empty `[]`. The single and many twins are listed in Every route and are not run.
    await expect(window.getByTestId("CASE_SET_LABEL")).toHaveText([
      "Every route · 3",
      "Fewest runs · 1",
    ]);
    await expect(window.getByTestId("FEWEST_RUNS_ROW")).toHaveText([
      "not run count([])",
    ]);
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-running="true"]'),
    ).toHaveCount(1);
  });

  test("VALID: {happy-path/ternary/return-basic/return-basic.ts selected} => the exit-position ternary splits into a then/else return, one case per arm, and hovering the ternary line highlights both", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_BASIC}"]`,
      )
      .click();

    const codePanel = window.getByTestId("EXPLORER_CODE");
    await expect(codePanel.locator(".cm-editor")).toBeVisible();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // `return n > 5 ? 'big' : 'small'` is two guarded returns: the condition is one ternary branch, each
    // arm a return exit. n=6 takes the then-arm, n=5 the else — both derived from the operand's type,
    // never from running the code (P4). Both exits sit on the ternary's own line (L2).
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("classify(n) · 2 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      "not run classify(5)",
      "not run classify(6)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 2: (not run)", "  => 2: (not run)"]);

    // Hover transition — before hover: no case row is highlighted.
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]'),
    ).toHaveCount(0);

    // Hover the ternary line (L2): the condition and BOTH arms share that single line, so every case runs
    // through it — both rows highlight (data-match=true) and none dims. A single-line ternary couples its
    // whole case set to its one line, which is exactly what the gutter/hover coupling must show.
    await codePanel.locator(".cm-line").nth(1).hover();
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]'),
    ).toHaveCount(2);
    await expect(
      window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]'),
    ).toHaveCount(0);
  });

  test("VALID: {happy-path/function/nested/nested.ts selected} => the private inner FUNNELS into outer as one entry, its branch covered by cases arranged in outer's param", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${NESTED_FUNCTION}"]`,
      )
      .click();
    await expect(window.getByTestId("DETAIL_PANEL")).toBeVisible();

    // The whole point of Stage B, proven across the real IPC crossing: `inner` is unexported, so
    // nothing calls it directly — its `n > 5` branch FUNNELS into `outer`, the surface that returns
    // `inner(value)`. `outer` is the SOLE entry, and each of its two cases threads through one of inner's
    // exits before returning by outer's own passthrough — so there is no separate `inner` entry and no
    // `outer` trivial case: outer's return is subsumed into the funnelled paths. Nothing is admitted
    // undriven: following the call graph reached it, and that fact travelled core -> cache -> IPC.
    //
    // Every row names `outer` because `outer` is what the runner CALLS, and the exit each reaches is the
    // FIRST (innermost) exit on the funnelled path — inner's own L4 / L7. `inner(6)` would read as a
    // direct call on a private nothing can call, using a value that is outer's argument, not inner's.
    const entryTitle = window.getByTestId("TEST_ENTRY").locator("> *").first();
    await expect(entryTitle).toHaveText("outer(value) · 2 cases");
    const caseRows = await window
      .getByTestId("TEST_CASE_ROW")
      .allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      "not run outer(5)",
      "not run outer(6)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)", "  => 7: (not run)"]);
    await expect(window.getByTestId("UNDRIVEN")).toHaveCount(0);
  });

  test("VALID: {one shared window, walk the class/boolean/composition/pure rungs} => each file's Tests tab lists its exact entry title and derived cases", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();

    // Each file is selected by its exact relPath; gating on the (unique) entry title lets the case-row
    // read settle on the newly-opened file before it is asserted whole. Class rung — an `if` in a method.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_CLASS}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("classify(value) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run classify(5)", "not run classify(6)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)", "  => 7: (not run)"]);

    // Class rung — a `switch` over a 3-member union in a method: one case per label + the default's member.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_CLASS}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("routeLabel(method) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run routeLabel("delete")',
      'not run routeLabel("get")',
      'not run routeLabel("post")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 5: (not run)",
      "  => 7: (not run)",
      "  => 9: (not run)",
    ]);

    // Boolean `||` — the else exit owes one case per CAUSE that makes the OR false; the then folds to one.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_OR}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("alarmLevel(temp, smoke) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      "not run alarmLevel(50, false)",
      "not run alarmLevel(50, true)",
      "not run alarmLevel(51, false)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 3: (not run)",
      "  => 3: (not run)",
      "  => 6: (not run)",
    ]);

    // Boolean `!` — a single negated operand, one case per arm.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_NOT}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("gate(ready) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run gate(false)", "not run gate(true)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 3: (not run)", "  => 6: (not run)"]);

    // Boolean mixed `&&`/`||` — the compound condition fans out to four cause-distinct cases.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${BOOLEAN_MIXED}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("route(admin, level, owner) · 4 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      "not run route(false, 7, false)",
      "not run route(true, 3, false)",
      "not run route(true, 3, true)",
      "not run route(true, 4, false)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 3: (not run)",
      "  => 3: (not run)",
      "  => 6: (not run)",
      "  => 6: (not run)",
    ]);

    // Composition — a `switch` nested inside an `if`: a route takes one arm at every branch it meets. The
    // switch is met only when `enabled` is true, so the routes are enabled+get, enabled+post and disabled:
    // 3 cases, with no second disabled route.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_IN_IF}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("route(enabled, method) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run route(false, "get")',
      'not run route(true, "get")',
      'not run route(true, "post")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 11: (not run)",
      "  => 5: (not run)",
      "  => 7: (not run)",
    ]);

    // Composition — an `if` nested inside a `switch`: the inner `if (size > 5)` is met only on the 'get'
    // arm, so the routes are get+big, get+small and the default: 3 cases, with no second default route.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_IN_SWITCH}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("describeRoute(method, size) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run describeRoute("get", 5)',
      'not run describeRoute("get", 6)',
      'not run describeRoute("post", 7)',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 10: (not run)",
      "  => 5: (not run)",
      "  => 8: (not run)",
    ]);

    // Composition — a fall-through `switch` inside an `if`: the switch is met only when `value > 5`, so
    // the routes are big+'a', big+default and small: 3 cases, all reaching the one trailing `return 1`
    // (L11). The title carries the every-route count.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${FALLTHROUGH_IN_IF}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("tally(value, mode) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run tally(5, "abc123")',
      'not run tally(6, "a")',
      'not run tally(6, "abc123")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 11: (not run)",
      "  => 11: (not run)",
      "  => 11: (not run)",
    ]);

    // Branchless pure function — one exit, one derived case.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${PURE_FUNCTION}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("add(a, b) · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run add(7, 7)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 2: (not run)"]);

    // Branchless constructable method — the zero-arg class means the runner can build one, so it is DRIVEN.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${PURE_CLASS}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("greet(name) · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(['not run greet("abc123")']);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 3: (not run)"]);

    // Ternary in a block return — the condition is one branch, each arm a guarded return, both on L2.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_BASIC}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("classify(n) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run classify(5)", "not run classify(6)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 2: (not run)", "  => 2: (not run)"]);

    // Nested ternary in the else arm — `g >= 90 ? a : g >= 80 ? b : c` recurses into three per-leaf exits.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_RETURN_NESTED}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("grade(g) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      "not run grade(79)",
      "not run grade(89)",
      "not run grade(90)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 2: (not run)",
      "  => 2: (not run)",
      "  => 2: (not run)",
    ]);

    // Concise-arrow body that IS a ternary — the exit-owning arrow splits without ever reaching an exit
    // statement, so both arm returns sit on the arrow's own line (L1).
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_ARROW_BASIC}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("classify(n) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run classify(5)", "not run classify(6)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 1: (not run)", "  => 1: (not run)"]);

    // Assumed ternary `||` chain — `a || b || 'default'` flattens its left spine to one branch per
    // controlling operand. `b` is met only when `a` is falsy, so the routes are a truthy, a falsy + b
    // truthy, and both falsy: 3 cases, all on L2.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_OR_CHAIN}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("pick(a, b) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run pick("", "")',
      'not run pick("", "abc123")',
      'not run pick("abc123", "abc123")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 2: (not run)",
      "  => 2: (not run)",
      "  => 2: (not run)",
    ]);

    // Assumed ternary `&&` chain — the mirror: each operand's FALSY case short-circuits, the all-truthy
    // path falls through to the last operand. `b` is met only when `a` is truthy, so the routes are a
    // falsy, a truthy + b falsy, and both truthy: 3 cases, all on L2.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_AND_CHAIN}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("all(a, b, c) · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      "not run all(false, false, false)",
      "not run all(true, false, false)",
      "not run all(true, true, false)",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 2: (not run)",
      "  => 2: (not run)",
      "  => 2: (not run)",
    ]);

    // Assumed ternary `??` — the operand's non-nullishness is the branch: non-null returns it, null/undefined
    // falls through to the right operand.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SHORT_CIRCUIT_NULLISH}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("orElse(a, b) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      'not run orElse("abc123", "abc123")',
      'not run orElse(null, "abc123")',
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 2: (not run)", "  => 2: (not run)"]);

    // Value-position value-flow — `const label = n > 5 ? a : b; return label` collapses to the same split
    // an exit-position ternary gets, the binding never appearing.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${TERNARY_VALUE_BASIC}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("classify(n) · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run classify(5)", "not run classify(6)"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 2: (not run)", "  => 2: (not run)"]);
  });

  test("VALID: {one shared window, walk the module-scope + consumption entries} => each is a DRIVEN module entry labelled by export-or-filename, its case row carrying no args", async ({
    smokeWindow: window,
  }) => {
    await expect(window.getByTestId("FILE_TREE")).toBeVisible();

    // A module scope DRIVEN from `process.env` — labelled by its filename, no `()`, and its case rows
    // carry NO args (a module is reached by importing it, not calling it).
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_PURE_STATEMENT}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("pure-statement.ts · 2 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run pure-statement.ts", "not run pure-statement.ts"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)", "  => 6: (not run)"]);

    // The switch equivalent, DRIVEN from `Number(process.env.CODE)`.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${SWITCH_PURE_STATEMENT}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("pure-statement.ts · 3 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual([
      "not run pure-statement.ts",
      "not run pure-statement.ts",
      "not run pure-statement.ts",
    ]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual([
      "  => 11: (not run)",
      "  => 5: (not run)",
      "  => 8: (not run)",
    ]);

    // Consumption: calls a LOCAL import (`greeting()`), labelled by its single export `message`.
    await window
      .locator(
        `[data-testid="FILE_TREE_FILE"][data-relpath="${USES_GREETING}"]`,
      )
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("message · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run message"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)"]);

    // Consumption: binds a node BUILTIN as a value (`const separator = sep`), labelled `separator`.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_BUILTIN}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("separator · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run separator"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)"]);

    // Consumption: CALLS a node builtin (`join(...)`), labelled by its single export `full`.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${CALLS_JOIN}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("full · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run full"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)"]);

    // Consumption: calls an external PACKAGE (`greet(...)`), labelled by its single export `hello`.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_PACKAGE}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("hello · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run hello"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)"]);

    // Consumption: a side-effect `console.log(...)` with no export — labelled by its filename.
    await window
      .locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${USES_CONSOLE}"]`)
      .click();
    await expect(
      window.getByTestId("TEST_ENTRY").locator("> *").first(),
    ).toHaveText("uses-console.ts · 1 cases");
    expect(
      [...(await window.getByTestId("TEST_CASE_ROW").allTextContents())].sort(),
    ).toStrictEqual(["not run uses-console.ts"]);
    expect(
      [...(await window.getByTestId("CASE_RETURN").allTextContents())].sort(),
    ).toStrictEqual(["  => 4: (not run)"]);
  });
});
