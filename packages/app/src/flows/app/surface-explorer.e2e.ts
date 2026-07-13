/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer flow. Compiles the smoke-repo into
 *   .assayer/cache via the built CLI precheck, launches the REAL built Electron desktop app at the
 *   '/' hash route, and walks the flow graph window-open -> request-tree -> tree-shown -> click-file
 *   -> request-file -> code-shown, asserting each observable on the path (header handshake, file
 *   tree from cache relPaths, CodeMirror line-number gutter + syntax highlighting + cached source).
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/surface-explorer.e2e.ts
 * // Boots the built dist + desktop-main against this repo (repoRoot=./smoke-repo); needs a display.
 *
 * Both cache-present branches are covered, and the empty-state terminal is reached two distinct
 * ways: the [has files] path (compiled smoke-repo -> header + tree + code) via
 * electronAppHarness/assayerCompileHarness; the SEEDED [no files] path (a cache manifest listing a
 * working-tree namespace with ZERO files) via emptySurfaceAppHarness; and the true no-cache first-run
 * path (NO .assayer directory at all — the default `npm run dev` condition where the CLI compile
 * never ran) via noCacheAppHarness. A fourth scenario proves obs-no-source-read / obs-file-from-cache-blob:
 * a hermetic cache whose blob bytes DIVERGE from the on-disk source (plus a manifest path with no
 * on-disk file) renders the CACHED content, proving the tree + file view read only .assayer/cache and
 * never the repoRoot source, via cacheOnlySourceAppHarness. Each harness owns its own teardown.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { electronAppHarness } from '../../../test/harnesses/electron-app.harness';
import { emptySurfaceAppHarness } from '../../../test/harnesses/empty-surface-app.harness';
import { noCacheAppHarness } from '../../../test/harnesses/no-cache-app.harness';
import { cacheOnlySourceAppHarness } from '../../../test/harnesses/cache-only-source-app.harness';
import { assayerCompileHarness } from '../../../test/harnesses/assayer-compile.harness';

test.describe('Compiled Surface Explorer', () => {
  const app = electronAppHarness();
  wireHarnessLifecycle({ harness: app });
  const emptyApp = emptySurfaceAppHarness();
  wireHarnessLifecycle({ harness: emptyApp });
  const noCacheApp = noCacheAppHarness();
  wireHarnessLifecycle({ harness: noCacheApp });
  const cacheOnlyApp = cacheOnlySourceAppHarness();
  wireHarnessLifecycle({ harness: cacheOnlyApp });

  test('VALID: {compiled smoke-repo cache, window opens at /} => header handshake + file tree, and clicking format-greeting.ts renders its cached source in CodeMirror', async () => {
    // Precondition: run the built CLI precheck, which compiles smoke-repo into .assayer/cache.
    const exitCode = await assayerCompileHarness().compile();
    expect(exitCode).toBe(0);

    // window-open: the Electron window opens the renderer at the '/' hash route.
    const window = await app.launch();

    // obs-status-header (also proves obs-tree-bridge-call: header renders live cache data, so the
    // preload->IPC getCompiledTree() handshake resolved). Counts are the compiled surface: 5 ts +
    // 1 tsx. Branch segment is the current working-tree namespace (environment-dependent), so pin
    // the stable brand/root/repo prefix + exact counts and allow any non-space branch token.
    const header = window.getByTestId('EXPLORER_HEADER');
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header).toHaveText(/^Assayer \| smoke-repo assayer\/\S+ \| ts 5 tsx 1$/u);

    // obs-tree-render: the left tree is rebuilt purely from the cache manifest relPaths. Assert the
    // exact file leaves (6 = the compiled surface) and the exact directory nodes derived from those
    // relPaths (packages/{cli,server,shared,web}, four src/ dirs).
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 10_000 });
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual([
      'app.tsx',
      'format-greeting.ts',
      'index.ts',
      'index.ts',
      'index.ts',
      'run.ts',
    ]);
    const dirNames = await window.getByTestId('FILE_TREE_DIR').allTextContents();
    expect([...dirNames].sort()).toStrictEqual([
      'cli',
      'packages',
      'server',
      'shared',
      'src',
      'src',
      'src',
      'src',
      'web',
    ]);

    // click-file -> request-file (obs-file-bridge-call): clicking the file calls
    // getCompiledFile({ relPath }); the resulting render proves the file bridge call resolved.
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'format-greeting.ts' }).click();

    // code-shown: read-only CodeMirror 6 renders the cached blob.
    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible({ timeout: 15_000 });

    // obs-codemirror-linenumbers: a visible line-number gutter.
    await expect(codePanel.locator('.cm-lineNumbers')).toBeVisible({ timeout: 10_000 });

    // obs-codemirror-highlight: TS syntax highlighting wraps tokens in styled spans inside lines.
    await expect(codePanel.locator('.cm-line span').first()).toBeVisible({ timeout: 10_000 });

    // obs-code-from-cache: the rendered text equals the cached blob's lines[] for this relPath —
    // the exact bytes the compiler stored for smoke-repo/packages/shared/src/format-greeting.ts.
    // The source file ends with a trailing newline, so the compiler's per-line split records a
    // final empty line[] entry — the cached blob has 8 lines and the viewer renders all 8.
    const codeLines = await codePanel.locator('.cm-line').allTextContents();
    expect(codeLines).toStrictEqual([
      'export function formatGreeting(name: string): string {',
      '  if (name.length === 0) {',
      "    return 'Hello, stranger!';",
      '  }',
      '',
      "  return 'Hello, ' + name + '!';",
      '}',
      '',
    ]);
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
    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 10_000 });
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual(['format-greeting.ts', 'ghost.ts']);
    const dirNames = await window.getByTestId('FILE_TREE_DIR').allTextContents();
    expect([...dirNames].sort()).toStrictEqual(['src']);

    // click-file -> request-file: clicking the file that DOES exist on disk fetches its cache blob.
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'format-greeting.ts' }).click();

    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible({ timeout: 15_000 });

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
