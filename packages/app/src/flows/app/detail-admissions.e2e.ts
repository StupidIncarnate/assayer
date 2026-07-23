/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer detail panel's ADMISSION rows — the
 *   UNDRIVEN and LINT lines that keep a file from reading as "nothing to test". Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache, launches the REAL built Electron app, selects a
 *   sad-path specimen, and asserts the admission sentence VERBATIM (core-authored P1 text that must
 *   cross core -> cache -> IPC intact). Covers the opaque-module UNDRIVEN, the dead-surface LINT, the
 *   loop DARK SPOT, and the welded-arg unreachable-exit LINT.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/detail-admissions.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect } from '../../../test/harnesses/e2e-fixtures';

const UNDRIVEN_OPAQUE_MODULE = 'packages/syntax-repository/src/sad-path/undriven/opaque-module/opaque-module.ts';
const DEAD_SURFACE_UNCALLED = 'packages/syntax-repository/src/sad-path/dead-surface/dead-surface.ts';
const UNREACHABLE_WELDED_ARG = 'packages/syntax-repository/src/sad-path/unreachable/welded-arg/welded-arg.ts';
const LOOP_IN_FUNCTION = 'packages/syntax-repository/src/sad-path/loop/in-function/in-function.ts';

// The exact line the panel shows for sad-path/undriven/opaque-module/opaque-module.ts — `UNDRIVEN
// <scope> — <reason>`, with the reason authored in core's undrivenProjectionTransformer. Asserted whole
// for the same reason the namespace message is: this sentence is the entire content of the admission,
// and it is the only thing standing between the reader and a file that reads as having nothing to test.
const UNDRIVEN_OPAQUE_MODULE_LINE =
  'UNDRIVEN opaque-module.ts — nothing about it varies, so no case could drive its branches anywhere they do ' +
  'not already go: it runs at import time, and its top-level branching turns on a value the analyzer ' +
  'can neither set nor resolve — not a parameter, not read from the environment, and not a literal ' +
  'constant it can fold, but an opaque one (a call result, an imported value, a computed expression). ' +
  'Read an operand from the environment instead and Assayer drives it: a top-level ' +
  '`const x = Number(process.env.X)` makes X an input, and each arm becomes a case that sets it and ' +
  'imports the module fresh.';

// The exact line the panel shows for sad-path/dead-surface/dead-surface.ts — `LINT <name> — <message>`,
// with the message authored in core's followCallsTransformer. Asserted whole for the reason the
// undriven line is: the sentence IS the admission, and it must cross core -> cache -> IPC intact.
const DEAD_SURFACE_LINT_LINE =
  'LINT unused — nothing in this file calls it, so it is dead surface: an unexported helper is ' +
  'reachable only from its own file, and nothing here reaches it. Delete it, or consume it from a ' +
  'caller that passes an input straight through — which the follower would then drive.';

// The welded-ARGUMENT unreachable-exit LINT — `LINT <name> — <message>`, the message authored in core's
// unreachableLintTransformer. Following `report(){ return decide(3) }` welds `3` into `decide`'s `value`,
// so `decide`'s `> 5` arm is dead: `decide` is a DRIVEN through-caller entry and its dead arm rides the
// LINT channel, the through-caller twin of the welded-CONST unreachable-exit (welded in a caller's
// argument rather than the scope's own source). Asserted whole for the same reason — the sentence IS the
// finding, and it must cross core -> cache -> IPC intact.
const UNREACHABLE_WELDED_ARG_LINE =
  'LINT decide — `decide` can never reach the exit on line 3: `value` is welded to `3`, so the branch ' +
  'on line 2 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm ' +
  'should be deleted.';

// The exact DARK SPOT line for sad-path/loop/in-function/in-function.ts — `DARK <kind> at L<a>-L<b> in <scope> — …`, worded by
// core's dark-spot channel (the loop ratchet: no handler exists for `for…of` yet, so it is ADMITTED, not
// skipped). The scope path joins with slashes, so it cannot be written in a doc comment.
const LOOP_DARK_SPOT_LINE =
  'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it ' +
  'is covered';

test.describe('Compiled Surface Explorer — admission rows', () => {
  test('VALID: {sad-path/undriven/opaque-module/opaque-module.ts selected} => the panel states the UNDRIVEN admission verbatim instead of reading as a file with nothing to test', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${UNDRIVEN_OPAQUE_MODULE}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // The whole assertion is the exactness, and only a REAL window can make it. The panel's own unit
    // test hands the widget an UndrivenEntryStub carrying a reason the test itself wrote, so it would
    // stay green if the admission never left the analyzer: `undriven` is derived in core, serialized
    // into the cache blob, contract-parsed back out, and carried over Electron IPC before any pixel
    // renders. Drop it at any one of those hops and every unit test still passes. This asserts the
    // sentence core authored arrived intact across all of them.
    const undriven = window.getByTestId('UNDRIVEN');
    await expect(undriven).toBeVisible();
    await expect(undriven).toHaveText(UNDRIVEN_OPAQUE_MODULE_LINE);

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

  test('VALID: {sad-path/dead-surface/dead-surface.ts selected} => the panel states the dead-surface LINT verbatim, beside the driven exported greet', async ({ smokeWindow: window }) => {
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

  test('VALID: {sad-path/loop/in-function/in-function.ts selected} => the panel states the ForOfStatement DARK SPOT verbatim, and no other admission channel co-renders', async ({ smokeWindow: window }) => {
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

  test('VALID: {sad-path/unreachable/welded-arg/welded-arg.ts selected} => the panel states the welded-ARGUMENT unreachable-exit LINT verbatim, beside two driven entries, with no other channel co-rendering', async ({ smokeWindow: window }) => {
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${UNREACHABLE_WELDED_ARG}"]`).click();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Following the welded call EVALUATES `decide`: its dead `> 5` arm rides the LINT channel (the repo's
    // debt), worded exactly as `assayer unit` prints it, and it must arrive verbatim across core -> cache
    // -> IPC. This is the through-caller twin of the welded-const unreachable-exit.
    const lint = window.getByTestId('LINT');
    await expect(lint).toBeVisible();
    await expect(lint).toHaveText(UNREACHABLE_WELDED_ARG_LINE);

    // An unreachable-exit is a LINT, never an undriven admission, a dark spot, or a run gap: welded-arg is
    // no longer undriven, so those channels stay empty. Both `report` (named) and `decide` (the driven
    // through-caller entry whose dead arm the lint names) list their cases beside it — two driven entries.
    await expect(window.getByTestId('UNDRIVEN')).toHaveCount(0);
    await expect(window.getByTestId('DARK_SPOT')).toHaveCount(0);
    await expect(window.getByTestId('RUN_GAP')).toHaveCount(0);
    await expect(window.getByTestId('TEST_ENTRY')).toHaveCount(2);
  });
});
