/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's ADMISSION rows — the
 *   UNDRIVEN and LINT lines that keep a file from reading as "nothing to test". Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects a
 *   sad-path specimen, and asserts the admission sentence VERBATIM (core-authored P1 text that must
 *   cross core -> cache -> IPC intact). Covers the welded-const UNDRIVEN and the dead-surface LINT.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/detail-admissions.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';

const UNDRIVEN_WELDED_OPERAND = 'packages/syntax-repository/src/sad-path/undriven/welded-const/welded-const.ts';
const DEAD_SURFACE_UNCALLED = 'packages/syntax-repository/src/sad-path/dead-surface/dead-surface.ts';
const UNDRIVEN_WELDED_ARG = 'packages/syntax-repository/src/sad-path/undriven/welded-arg/welded-arg.ts';
const LOOP_IN_FUNCTION = 'packages/syntax-repository/src/sad-path/loop/in-function/in-function.ts';

// The exact line the panel shows for sad-path/undriven/welded-const/welded-const.ts — `UNDRIVEN <scope> — <reason>`, with
// the reason authored in core's undrivenProjectionTransformer. Asserted whole for the same reason the
// namespace message is: this sentence is the entire content of the admission, and it is the only
// thing standing between the reader and a file that reads as having nothing to test.
const UNDRIVEN_WELDED_OPERAND_LINE =
  'UNDRIVEN welded-const.ts — nothing about it varies, so no case could drive its branches anywhere they do ' +
  'not already go: it runs at import time, and every operand its top-level branching turns on is ' +
  'welded to a value written in this file. No harness closes this and no feature will — a branch with ' +
  'one possible outcome is decided here, in the source, not at run time. Read an operand from the ' +
  'environment instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X ' +
  'an input, and each arm becomes a case that sets it and imports the module fresh.';

// The exact line the panel shows for sad-path/dead-surface/dead-surface.ts — `LINT <name> — <message>`,
// with the message authored in core's followCallsTransformer. Asserted whole for the reason the
// undriven line is: the sentence IS the admission, and it must cross core -> cache -> IPC intact.
const DEAD_SURFACE_LINT_LINE =
  'LINT unused — nothing in this file calls it, so it is dead surface: an unexported helper is ' +
  'reachable only from its own file, and nothing here reaches it. Delete it, or consume it from a ' +
  'caller that passes an input straight through — which the follower would then drive.';

// The SECOND undriven shape, on its own row and worded by the same undrivenProjectionTransformer — a
// private (`decide`) reached only through an argument FIXED in the source (`decide(3)`), so its branch
// has one possible outcome decided at authoring time. Distinct from the welded-CONST shape above: the
// const runs at import time, this is welded into a call argument. Asserted whole for the same reason.
const UNDRIVEN_WELDED_ARG_LINE =
  'UNDRIVEN decide — it is reached only through arguments fixed in the source, so no case can steer it ' +
  'to another branch: a caller welds a value into the call, and a branch with one possible outcome is ' +
  'decided there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

// The exact DARK SPOT line for sad-path/loop/in-function/in-function.ts — `DARK <kind> at L<a>-L<b> in <scope> — …`, worded by
// core's dark-spot channel (the loop ratchet: no handler exists for `for…of` yet, so it is ADMITTED, not
// skipped). The scope path joins with slashes, so it cannot be written in a doc comment.
const LOOP_DARK_SPOT_LINE =
  'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it ' +
  'is covered';

test.describe('Compiled Surface Explorer — admission rows', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {sad-path/undriven/welded-const/welded-const.ts selected} => the panel states the UNDRIVEN admission verbatim instead of reading as a file with nothing to test', async () => {
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

  test('VALID: {sad-path/dead-surface/dead-surface.ts selected} => the panel states the dead-surface LINT verbatim, beside the driven exported greet', async () => {
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

  test('VALID: {sad-path/loop/in-function/in-function.ts selected} => the panel states the ForOfStatement DARK SPOT verbatim, and no other admission channel co-renders', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${LOOP_IN_FUNCTION}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The loop ratchet's ONLY UI proof: `for…of` has no handler, so the walk admits it as a dark spot
    // rather than skipping it — and that admission must cross core -> cache -> IPC to a reader intact, or
    // the file reads as fully understood while a whole loop body is uncovered. Grape channel, on its row.
    const darkSpot = window.getByTestId('DARK_SPOT');
    await expect(darkSpot).toBeVisible();
    await expect(darkSpot).toHaveText(LOOP_DARK_SPOT_LINE);

    // A dark spot is ASSAYER's debt and none of the other three: the file's own driven `sumAll` entry
    // still lists its case beside it, but no undriven, no lint, and no run gap ever share the panel.
    await expect(window.getByTestId('UNDRIVEN')).toHaveCount(0);
    await expect(window.getByTestId('LINT')).toHaveCount(0);
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);
    await expect(window.getByTestId('TEST_ENTRY')).toHaveCount(1);
  });

  test('VALID: {sad-path/undriven/welded-arg/welded-arg.ts selected} => the panel states the welded-ARGUMENT UNDRIVEN admission verbatim, distinct from the welded-const shape, with no other channel co-rendering', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${UNDRIVEN_WELDED_ARG}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The second UNDRIVEN shape: `decide` is reached only through a FIXED argument (`decide(3)`), so its
    // branch is decided in the source. It rides beside the driven `report` entry (which passes a welded
    // value, not its own input), and its sentence must arrive verbatim.
    const undriven = window.getByTestId('UNDRIVEN');
    await expect(undriven).toBeVisible();
    await expect(undriven).toHaveText(UNDRIVEN_WELDED_ARG_LINE);

    // An undriven entry is neither a dark spot, a lint, nor a run gap: only its channel renders, beside
    // the file's one driven entry.
    await expect(window.getByTestId('DARK_SPOT')).toHaveCount(0);
    await expect(window.getByTestId('LINT')).toHaveCount(0);
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);
    await expect(window.getByTestId('TEST_ENTRY')).toHaveCount(1);
  });
});
