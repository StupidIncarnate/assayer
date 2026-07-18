/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer flow. Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache via the built CLI precheck, launches the REAL built
 *   Electron desktop app at the '/' hash route, and walks the flow graph window-open -> request-tree
 *   -> tree-shown -> click-file -> request-file -> code-shown, asserting each observable on the path
 *   (header handshake, file tree from cache relPaths, CodeMirror gutter + highlighting + cached source,
 *   and the derived-analysis detail panel). Files are clicked by their exact data-relpath so the two
 *   constructs' identically-named rungs (if-else/in-function.ts vs switch/in-function.ts) never collide.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/surface-explorer.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 *
 * The compiled surface is the granular syntax-repository: if-else and switch across three containment
 * rungs (pure-statement, in-function, in-class), the composition specimens, the loop dark-spot ratchet,
 * the `sad-path/` dead-end specimens (two undriven shapes + a dead-surface lint), and the boolean
 * connectives (and, or, not, mixed) = ts 18 tsx 0. Adding a specimen changes the three surface
 * assertions below (header count, file leaves, dirs) — see packages/core/CLAUDE.md.
 * The empty-state terminal is reached three ways via seeded/hermetic harnesses (emptySurfaceAppHarness,
 * noCacheAppHarness) and a cache-only-source proof (cacheOnlySourceAppHarness) — none depend on the
 * syntax-repository source. Each harness owns its own teardown.
 * The tree-fetch FAILURE terminal sits beside them (unresolvableNamespaceAppHarness) and is the one
 * scenario that can prove a resolver's P1 message reaches a reader intact: it asserts the exact
 * sentence, so Electron's `Error invoking remote method` prefix reappearing fails the run. A unit test
 * handing an Error straight to the widget cannot see that crossing at all.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';
import { emptySurfaceAppHarness } from '../../../test/harnesses/empty-surface-app.harness';
import { noCacheAppHarness } from '../../../test/harnesses/no-cache-app.harness';
import { cacheOnlySourceAppHarness } from '../../../test/harnesses/cache-only-source-app.harness';
import { unresolvableNamespaceAppHarness } from '../../../test/harnesses/unresolvable-namespace-app.harness';

// The exact sentence currentNamespaceTransformer raises for the seeded two-working-tree manifest.
// Asserted whole and unprefixed: this is the resolver's own text, and the reader acts on it.
const UNRESOLVABLE_NAMESPACE_MESSAGE =
  'Cannot resolve current namespace: expected exactly one working-tree entry without a commit among [branch-a, branch-b]';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/if-else/in-function.ts';
const SWITCH_IN_FUNCTION = 'packages/syntax-repository/src/switch/in-function.ts';
const BOOLEAN_AND = 'packages/syntax-repository/src/boolean/and.ts';
const UNDRIVEN_WELDED_OPERAND = 'packages/syntax-repository/src/sad-path/undriven-welded-const.ts';
const NESTED_FUNCTION = 'packages/syntax-repository/src/composition/nested-function.ts';
const DEAD_SURFACE_UNCALLED = 'packages/syntax-repository/src/sad-path/dead-surface.ts';

// The exact line the panel shows for sad-path/dead-surface.ts — `LINT <name> — <message>`,
// with the message authored in core's followCallsTransformer. Asserted whole for the reason the
// undriven line is: the sentence IS the admission, and it must cross core -> cache -> IPC intact.
const DEAD_SURFACE_LINT_LINE =
  'LINT unused — nothing in this file calls it, so it is dead surface: an unexported helper is ' +
  'reachable only from its own file, and nothing here reaches it. Delete it, or consume it from a ' +
  'caller that passes an input straight through — which the follower would then drive.';

// The exact line the panel shows for sad-path/undriven-welded-const.ts — `UNDRIVEN <scope> — <reason>`, with
// the reason authored in core's undrivenProjectionTransformer. Asserted whole for the same reason the
// namespace message above is: this sentence is the entire content of the admission, and it is the only
// thing standing between the reader and a file that reads as having nothing to test.
const UNDRIVEN_WELDED_OPERAND_LINE =
  'UNDRIVEN *module* — nothing about it varies, so no case could drive its branches anywhere they do ' +
  'not already go: it runs at import time, and every operand its top-level branching turns on is ' +
  'welded to a value written in this file. No harness closes this and no feature will — a branch with ' +
  'one possible outcome is decided here, in the source, not at run time. Read an operand from the ' +
  'environment instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X ' +
  'an input, and each arm becomes a case that sets it and imports the module fresh.';

test.describe('Compiled Surface Explorer', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });
  const emptyApp = emptySurfaceAppHarness();
  wireHarnessLifecycle({ harness: emptyApp });
  const noCacheApp = noCacheAppHarness();
  wireHarnessLifecycle({ harness: noCacheApp });
  const cacheOnlyApp = cacheOnlySourceAppHarness();
  wireHarnessLifecycle({ harness: cacheOnlyApp });
  const unresolvableApp = unresolvableNamespaceAppHarness();
  wireHarnessLifecycle({ harness: unresolvableApp });

  test('VALID: {compiled syntax-repository cache, window opens at /} => header handshake + file tree, and clicking if-else/in-function.ts renders its cached source in CodeMirror', async () => {
    // Precondition: run the built CLI precheck, which compiles the syntax-repository into .assayer/cache.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    // window-open: the Electron window opens the renderer at the '/' hash route.
    const window = await app.launch();

    // obs-status-header (also proves obs-tree-bridge-call: header renders live cache data, so the
    // preload->IPC getCompiledTree() handshake resolved). Counts are the compiled surface: 18 ts +
    // 0 tsx (the specimen .ts files; the co-located *.test.ts are excluded from the surface).
    // Branch segment is the current working-tree namespace (environment-dependent), so pin the stable
    // brand/root/repo prefix + exact counts and allow any non-space branch token.
    const header = window.getByTestId('EXPLORER_HEADER');
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header).toHaveText(/^Assayer \| smoke-repo assayer\/\S+ \| ts 18 tsx 0$/u);

    // obs-tree-render: the left tree is rebuilt purely from the cache manifest relPaths. Assert the
    // exact file leaves (if-else and switch × three rungs each, plus the composition and loop
    // specimens) and the exact directory nodes derived from those relPaths.
    await expect(window.getByTestId('FILE_TREE')).toBeVisible();
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual([
      'and.ts',
      'dead-surface.ts',
      'fallthrough-in-if.ts',
      'if-in-switch.ts',
      'in-class.ts',
      'in-class.ts',
      'in-function.ts',
      'in-function.ts',
      'in-function.ts',
      'mixed.ts',
      'nested-function.ts',
      'not.ts',
      'or.ts',
      'pure-statement.ts',
      'pure-statement.ts',
      'switch-in-if.ts',
      'undriven-welded-arg.ts',
      'undriven-welded-const.ts',
    ]);
    const dirNames = await window.getByTestId('FILE_TREE_DIR').allTextContents();
    expect([...dirNames].sort()).toStrictEqual([
      'boolean',
      'composition',
      'if-else',
      'loop',
      'packages',
      'sad-path',
      'src',
      'switch',
      'syntax-repository',
    ]);

    // click-file -> request-file (obs-file-bridge-call): clicking the file (by its exact relPath, so
    // the two in-function.ts rungs never collide) calls getCompiledFile({ relPath }); the resulting
    // render proves the file bridge call resolved.
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
  });

  test('VALID: {if-else/in-function.ts selected} => the detail panel lists the 2 derived cases, the gutter shows counts 2/1/1, hovering L3 highlights the then-case, and the Enrichment tab lists the per-line facts', async () => {
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

    // Gutter: the .cm-test-counts gutter marks L2 (the `if` guard, on both cases' path) with 2, and
    // each exit line (L3 then-return, L6 fall-through return) with 1. Unmarked lines render empty
    // cells; the non-empty cells, in document order (2 < 3 < 6), read 2, 1, 1.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['2', '1', '1']);

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

    // Enrichment tab: the per-line data facts — L1 the param symbol + type, L2 the branch operand's
    // representative value range { 6, 5 }.
    await window.getByTestId('TAB_ENRICHMENT').click();
    const enrichmentRows = await window.getByTestId('ENRICHMENT_ROW').allTextContents();
    expect([...enrichmentRows].sort()).toStrictEqual([
      'L1  value: number',
      'L2  value: number  → { 6, 5 }',
    ]);
  });

  test('VALID: {switch/in-function.ts selected} => the switch over a 3-member union derives 3 exhaustive cases (one per label + the default\'s single uncovered member) and hovering the default return highlights only that case', async () => {
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

    // Gutter: each discriminant test line (L3 `case 'get'`, L5 `case 'post'`) is on 2 cases' paths (its
    // own case + the default, which must fail every case); each exit line (L4/L6/L8) is on 1. In
    // document order 3 < 4 < 5 < 6 < 8 the non-empty count cells read 2, 1, 2, 1, 1.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['2', '1', '2', '1', '1']);

    // Hover the default return (L8): only the default's case (reaches L8) runs through it, so exactly
    // that one row highlights and the two labelled cases dim.
    await codePanel.locator('.cm-line').nth(7).hover();
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveText(
      'not run routeLabel("delete") → reaches L8',
    );
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveCount(2);
  });

  test('VALID: {boolean/and.ts selected} => the compound condition derives one case per CAUSE (1 then + 2 else), and the gutter counts every case through the guard line', async () => {
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
      'not run grade(5, 0) → reaches L6',
      // score passes, so bonus is the operand that decides.
      'not run grade(6, 1) → reaches L6',
      'not run grade(6, 2) → reaches L3',
    ]);

    // Gutter: L2 (the `if`) is on all 3 cases' paths; L3 (then-return) on 1; L6 (else-return) on 2.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['3', '1', '2']);

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

  test('VALID: {boolean/and.ts open, click Run} => the run finishes and every derived case reads the CLI verdict, with no run error', async () => {
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

  test('VALID: {if-else/in-function.ts selected, switch to Raw JSON tab} => shows the full cache blob (relPath + contentHash + derived analysis) at full width and hides the right detail panel', async () => {
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
    await expect(rawBlob).toContainText('"relPath": "packages/syntax-repository/src/if-else/in-function.ts"');
    await expect(rawBlob).toContainText('"contentHash":');
    // The exit ID names the BRANCH it crossed, not just the arm — two sibling `then`-returns in one
    // scope would otherwise key identically, and the ref-to-ref diff keys on exactly this.
    await expect(rawBlob).toContainText(
      'classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
    );
  });

  test('VALID: {sad-path/undriven-welded-const.ts selected} => the panel states the UNDRIVEN admission verbatim instead of reading as a file with nothing to test', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${UNDRIVEN_WELDED_OPERAND}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The whole assertion is the exactness, and only a REAL window can make it. The panel's own unit
    // test hands the widget an UndrivenEntryStub carrying a reason the test itself wrote, so it would
    // stay green if the admission never left the analyzer: `undriven` is derived in core, serialized
    // into the cache blob, contract-parsed back out, and carried over Electron IPC before any pixel
    // renders. Drop it at any one of those hops and every unit test still passes. This asserts the
    // sentence core authored arrived intact across all of them.
    const undriven = window.getByTestId('UNDRIVEN');
    await expect(undriven).toBeVisible();
    await expect(undriven).toHaveText(UNDRIVEN_WELDED_OPERAND_LINE);

    // What dropping it would actually look like, and why it must be asserted rather than assumed.
    // This file's ONLY entry is the undriven module scope, so with the admission gone the panel has
    // no entries to list and falls to "No entries in this file" — a file of live top-level branching
    // reported as having nothing to test. That is the reads-as-complete lie, and these two states are
    // one `undriven.length` apart.
    await expect(window.getByTestId('TESTS_EMPTY')).toHaveCount(0);

    // The derived cases are real analyzer output and nothing will ever execute them, so the panel
    // must not advertise them as pending tests, nor offer a Run whose verdict it already states in
    // full. Both controls are absent because there is nothing here to drive.
    await expect(window.getByTestId('TEST_CASE_ROW')).toHaveCount(0);
    await expect(window.getByTestId('RUN_BUTTON')).toHaveCount(0);
  });

  test('VALID: {composition/nested-function.ts selected} => the private inner is DRIVEN through outer, its branch covered by cases arranged in the caller param', async () => {
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
      'not run outer(0) → reaches L10',
    ]);
    await expect(window.getByTestId('UNDRIVEN')).toHaveCount(0);
  });

  test('VALID: {sad-path/dead-surface.ts selected} => the panel states the dead-surface LINT verbatim, beside the driven exported greet', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${DEAD_SURFACE_UNCALLED}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Stage C across the real crossing: `unused` is a private nothing consumes, so it is a dead-surface
    // LINT — the repo's debt, on its own row, worded exactly as `assayer unit` prints it. Like the
    // undriven admission, only a real window proves the sentence survived core -> cache -> IPC intact.
    const lint = window.getByTestId('LINT');
    await expect(lint).toBeVisible();
    await expect(lint).toHaveText(DEAD_SURFACE_LINT_LINE);

    // It is a LINT, not an undriven admission and not a dark spot: the other channels stay empty, and
    // the exported `greet` beside it is still a driven entry.
    await expect(window.getByTestId('UNDRIVEN')).toHaveCount(0);
    await expect(window.getByTestId('DARK_SPOT')).toHaveCount(0);
    await expect(window.getByTestId('TEST_ENTRY')).toHaveCount(1);
  });

  test('EMPTY: {cache manifest lists zero files, window opens at /} => explorer shows the "No compiled surface — run assayer" empty state and no file tree', async () => {
    // Precondition (seeded by the harness): a temp config dir whose cache manifest lists a single
    // working-tree namespace with ZERO files. window-open -> request-tree resolves an empty tree.
    const window = await emptyApp.launch();

    // cache-present [no files] -> empty-state (obs-empty-state): the panel renders the exact prompt.
    const emptyState = window.getByTestId('SURFACE_EMPTY');
    await expect(emptyState).toBeVisible({ timeout: 30_000 });
    await expect(emptyState).toHaveText('No compiled surface — run assayer');

    // The [has files] branch is NOT taken: the header + file tree never render.
    await expect(window.getByTestId('EXPLORER_HEADER')).toHaveCount(0);
    await expect(window.getByTestId('FILE_TREE')).toHaveCount(0);
  });

  test('EMPTY: {NO .assayer cache directory at all, window opens at /} => explorer shows the "No compiled surface — run assayer" empty state and no file tree, without desktop main throwing ENOENT', async () => {
    // Precondition (seeded by the harness): a temp config dir with NO .assayer directory — the true
    // first-run / dev condition (`npm run dev` launches the app but never runs the CLI compile, so no
    // manifest exists). window-open -> request-tree resolves a contract-valid EMPTY tree from the
    // MISSING manifest via the compiled-tree resolve broker's existence check, instead of the desktop
    // main throwing ENOENT out of the IPC handler (regression this scenario guards).
    const window = await noCacheApp.launch();

    // cache-present [no files] -> empty-state (obs-empty-state): the panel renders the exact prompt.
    const emptyState = window.getByTestId('SURFACE_EMPTY');
    await expect(emptyState).toBeVisible({ timeout: 30_000 });
    await expect(emptyState).toHaveText('No compiled surface — run assayer');

    // The [has files] branch is NOT taken: the header + file tree never render.
    await expect(window.getByTestId('EXPLORER_HEADER')).toHaveCount(0);
    await expect(window.getByTestId('FILE_TREE')).toHaveCount(0);
  });

  test('ERROR: {cache manifest has two working-tree namespaces, window opens at /} => the explorer prints the resolver\'s own message verbatim and unprefixed, and never the empty prompt', async () => {
    // Precondition (seeded by the harness): a contract-valid manifest with TWO commitless namespace
    // entries, so the desktop's currentNamespaceTransformer cannot resolve a current namespace.
    // window-open -> request-tree REJECTS. This is the failure terminal beside the empty one above,
    // and it must never be reachable through the same prompt: a reader told to "run assayer" here
    // runs it and sees the identical sentence forever, because compiling is not what is broken.
    const window = await unresolvableApp.launch();

    // The whole assertion is the exactness. `toHaveText` with the full string proves three things at
    // once that no unit test can: the resolver's sentence survived the IPC crossing intact, Electron's
    // `Error invoking remote method '<channel>': ` prefix is ABSENT (the reply travelled as data, per
    // ipcReplyTransformer), and the widget added no heading of its own. Naming the two conflicting
    // namespaces is what makes it actionable — that detail is the reason verbatim matters.
    const surfaceError = window.getByTestId('SURFACE_ERROR');
    await expect(surfaceError).toBeVisible({ timeout: 30_000 });
    await expect(surfaceError).toHaveText(UNRESOLVABLE_NAMESPACE_MESSAGE);

    // The three no-tree states are distinct surfaces. A failure that also rendered the empty prompt
    // would be the collapse this test exists to forbid.
    await expect(window.getByTestId('SURFACE_EMPTY')).toHaveCount(0);
    await expect(window.getByTestId('SURFACE_LOADING')).toHaveCount(0);

    // The [has files] branch is NOT taken: there is no tree, so no shell to explore it with.
    await expect(window.getByTestId('EXPLORER_HEADER')).toHaveCount(0);
    await expect(window.getByTestId('FILE_TREE')).toHaveCount(0);
  });

  test('VALID: {cache blob diverges from on-disk source, window opens at /} => the tree and CodeMirror render the CACHED bytes, never the repoRoot source — proving cache-only reads (obs-no-source-read / obs-file-from-cache-blob)', async () => {
    // Precondition (seeded by the harness): a hermetic config dir (repoRoot='.') where the cache and
    // the on-disk source DISAGREE. On disk src/format-greeting.ts returns 'FROM-ON-DISK-SOURCE'; its
    // cache blob returns 'FROM-CACHE-BLOB'. A second manifest entry src/ghost.ts has NO on-disk file.
    const window = await cacheOnlyApp.launch();

    // obs-tree-render + obs-no-source-read (tree): the header + tree render purely from the manifest.
    // Counts come from the two cached .ts relPaths (ts 2 tsx 0), and rootFolderName/repoName/branch
    // are the seeded manifest values — no filesystem scan feeds this.
    const header = window.getByTestId('EXPLORER_HEADER');
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header).toHaveText('Assayer | fixture-root assayer/master | ts 2 tsx 0');

    // The tree lists BOTH relPaths — including src/ghost.ts, which has no on-disk file at all — so the
    // tree can only have been rebuilt from cache manifest relPaths, never a repoRoot directory scan.
    await expect(window.getByTestId('FILE_TREE')).toBeVisible();
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual(['format-greeting.ts', 'ghost.ts']);
    const dirNames = await window.getByTestId('FILE_TREE_DIR').allTextContents();
    expect([...dirNames].sort()).toStrictEqual(['src']);

    // click-file -> request-file: clicking the file that DOES exist on disk fetches its cache blob.
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'format-greeting.ts' }).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // obs-file-from-cache-blob + obs-code-from-cache + obs-no-source-read (file): the rendered text is
    // the CACHED blob's lines[] ('FROM-CACHE-BLOB'), NOT the altered on-disk source ('FROM-ON-DISK-
    // SOURCE'). Altering the repoRoot source left the served content unaffected — cache is the sole
    // source of what the explorer shows.
    const codeLines = await codePanel.locator('.cm-line').allTextContents();
    expect(codeLines).toStrictEqual([
      'export function formatGreeting(name: string): string {',
      "  return 'FROM-CACHE-BLOB';",
      '}',
    ]);
  });
});
