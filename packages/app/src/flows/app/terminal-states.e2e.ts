/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer's NO-TREE terminal surfaces — the states
 *   reached without the syntax-repository source, each via its own seeded/hermetic harness. Covers the
 *   empty-manifest and missing-manifest empty states (emptySurfaceAppHarness, noCacheAppHarness), the
 *   tree-fetch FAILURE terminal whose resolver message must arrive verbatim and unprefixed
 *   (unresolvableNamespaceAppHarness), and the cache-only-source proof that the tree + CodeMirror serve
 *   the CACHED bytes, never the on-disk source (cacheOnlySourceAppHarness). Each harness owns its own
 *   teardown.
 *
 *   The tree-fetch FAILURE terminal is the one scenario that can prove a resolver's P1 message reaches
 *   a reader intact: it asserts the exact sentence, so Electron's `Error invoking remote method` prefix
 *   reappearing fails the run. A unit test handing an Error straight to the widget cannot see that
 *   crossing at all.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/terminal-states.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { emptySurfaceAppHarness } from '../../../test/harnesses/empty-surface-app.harness';
import { noCacheAppHarness } from '../../../test/harnesses/no-cache-app.harness';
import { cacheOnlySourceAppHarness } from '../../../test/harnesses/cache-only-source-app.harness';
import { unresolvableNamespaceAppHarness } from '../../../test/harnesses/unresolvable-namespace-app.harness';

// The exact sentence currentNamespaceTransformer raises for the seeded two-working-tree manifest.
// Asserted whole and unprefixed: this is the resolver's own text, and the reader acts on it.
const UNRESOLVABLE_NAMESPACE_MESSAGE =
  'Cannot resolve current namespace: expected exactly one working-tree entry without a commit among [branch-a, branch-b]';

test.describe('Compiled Surface Explorer — no-tree terminal surfaces', () => {
  const emptyApp = emptySurfaceAppHarness();
  wireHarnessLifecycle({ harness: emptyApp });
  const noCacheApp = noCacheAppHarness();
  wireHarnessLifecycle({ harness: noCacheApp });
  const cacheOnlyApp = cacheOnlySourceAppHarness();
  wireHarnessLifecycle({ harness: cacheOnlyApp });
  const unresolvableApp = unresolvableNamespaceAppHarness();
  wireHarnessLifecycle({ harness: unresolvableApp });

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
