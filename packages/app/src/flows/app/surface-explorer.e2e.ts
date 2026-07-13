/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer flow. Compiles the smoke-repo into a
 *   PER-TEST temp cache via the built CLI precheck, launches the REAL built Electron desktop app at
 *   the '/' hash route, and walks the flow graph window-open -> request-tree -> tree-shown -> click-file
 *   -> request-file -> code-shown, asserting each observable on the path (header handshake, file
 *   tree from cache relPaths, CodeMirror line-number gutter + syntax highlighting + cached source).
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/surface-explorer.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 *
 * Both cache-present branches are covered, and the empty-state terminal is reached two distinct
 * ways: the [has files] path (compiled smoke-repo -> header + tree + code) via smokeRepoAppHarness
 * (each test compiles into + reads its OWN temp cache dir — never the repo's shared .assayer/cache);
 * the SEEDED [no files] path (a cache manifest listing a
 * working-tree namespace with ZERO files) via emptySurfaceAppHarness; and the true no-cache first-run
 * path (NO .assayer directory at all — the default `npm run dev` condition where the CLI compile
 * never ran) via noCacheAppHarness. A fourth scenario proves obs-no-source-read / obs-file-from-cache-blob:
 * a hermetic cache whose blob bytes DIVERGE from the on-disk source (plus a manifest path with no
 * on-disk file) renders the CACHED content, proving the tree + file view read only .assayer/cache and
 * never the repoRoot source, via cacheOnlySourceAppHarness. Each harness owns its own teardown.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';
import { emptySurfaceAppHarness } from '../../../test/harnesses/empty-surface-app.harness';
import { noCacheAppHarness } from '../../../test/harnesses/no-cache-app.harness';
import { cacheOnlySourceAppHarness } from '../../../test/harnesses/cache-only-source-app.harness';

test.describe('Compiled Surface Explorer', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });
  const emptyApp = emptySurfaceAppHarness();
  wireHarnessLifecycle({ harness: emptyApp });
  const noCacheApp = noCacheAppHarness();
  wireHarnessLifecycle({ harness: noCacheApp });
  const cacheOnlyApp = cacheOnlySourceAppHarness();
  wireHarnessLifecycle({ harness: cacheOnlyApp });

  test('VALID: {compiled smoke-repo cache, window opens at /} => header handshake + file tree, and clicking format-greeting.ts renders its cached source in CodeMirror', async () => {
    // Precondition: run the built CLI precheck, which compiles smoke-repo into .assayer/cache.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    // window-open: the Electron window opens the renderer at the '/' hash route.
    const window = await app.launch();

    // obs-status-header (also proves obs-tree-bridge-call: header renders live cache data, so the
    // preload->IPC getCompiledTree() handshake resolved). Counts are the compiled surface: 6 ts +
    // 1 tsx. Branch segment is the current working-tree namespace (environment-dependent), so pin
    // the stable brand/root/repo prefix + exact counts and allow any non-space branch token.
    const header = window.getByTestId('EXPLORER_HEADER');
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header).toHaveText(/^Assayer \| smoke-repo assayer\/\S+ \| ts 6 tsx 1$/u);

    // obs-tree-render: the left tree is rebuilt purely from the cache manifest relPaths. Assert the
    // exact file leaves (7 = the compiled surface) and the exact directory nodes derived from those
    // relPaths (packages/{cli,server,shared,web}, four src/ dirs).
    await expect(window.getByTestId('FILE_TREE')).toBeVisible();
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual([
      'app.tsx',
      'format-greeting.ts',
      'index.ts',
      'index.ts',
      'index.ts',
      'route-label.ts',
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
    await expect(codePanel.locator('.cm-editor')).toBeVisible();

    // obs-codemirror-linenumbers: a visible line-number gutter.
    await expect(codePanel.locator('.cm-lineNumbers')).toBeVisible();

    // obs-codemirror-highlight: TS syntax highlighting wraps tokens in styled spans inside lines.
    await expect(codePanel.locator('.cm-line span').first()).toBeVisible();

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

  test('VALID: {format-greeting.ts selected} => the detail panel lists the 2 derived cases, the gutter shows counts 2/1/1, hovering L3 highlights the then-case, and the Enrichment tab lists the per-line facts', async () => {
    // Precondition: compile smoke-repo into .assayer/cache, then open the file's compiled view.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'format-greeting.ts' }).click();

    // code-shown: the read-only CodeMirror renders the cached blob, and the right detail panel is up.
    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
    await expect(window.getByTestId('DETAIL_PANEL')).toBeVisible();

    // Tests tab (the default active tab): the single entry, plus one derived case per reachable exit.
    // TEST_ENTRY wraps the title AND the case rows, so assert the entry TITLE (its first child) exactly.
    const entryTitle = window.getByTestId('TEST_ENTRY').locator('> *').first();
    await expect(entryTitle).toHaveText('formatGreeting(name) · 2 cases');
    const caseRows = await window.getByTestId('TEST_CASE_ROW').allTextContents();
    expect([...caseRows].sort()).toStrictEqual([
      'formatGreeting("") → reaches L3',
      'formatGreeting("a") → reaches L6',
    ]);

    // Gutter: the .cm-test-counts gutter marks L2 (the shared `if` guard, on both cases' path) with 2,
    // and each exit line (L3 then-return, L6 fall-through return) with 1. Unmarked lines render empty
    // cells; the non-empty cells, in document order (2 < 3 < 6), read 2, 1, 1.
    const gutterTexts = await codePanel.locator('.cm-test-counts .cm-gutterElement').allTextContents();
    expect(gutterTexts.filter((text) => text.trim() !== '')).toStrictEqual(['2', '1', '1']);

    // Hover transition — before hover: no case row is highlighted.
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveCount(0);

    // Hover code line 3 (the then-return): its case row highlights (data-match=true); the L6 case dims.
    await codePanel.locator('.cm-line').nth(2).hover();
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="true"]')).toHaveText(
      'formatGreeting("") → reaches L3',
    );
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveText(
      'formatGreeting("a") → reaches L6',
    );

    // Enrichment tab: the per-line data facts — L1 the param symbol + type, L2 the branch operand's
    // representative value range { "", "a" }.
    await window.getByTestId('TAB_ENRICHMENT').click();
    const enrichmentRows = await window.getByTestId('ENRICHMENT_ROW').allTextContents();
    expect([...enrichmentRows].sort()).toStrictEqual([
      'L1  name: string',
      'L2  name: string  → { "", "a" }',
    ]);
  });

  test('VALID: {route-label.ts selected} => the switch over a 3-member union derives 3 exhaustive cases (one per label + the default\'s single uncovered member) and hovering the default return highlights only that case', async () => {
    // Precondition: compile smoke-repo into .assayer/cache, then open the switch file's compiled view.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'route-label.ts' }).click();

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
      'routeLabel("delete") → reaches L8',
      'routeLabel("get") → reaches L4',
      'routeLabel("post") → reaches L6',
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
      'routeLabel("delete") → reaches L8',
    );
    await expect(window.locator('[data-testid="TEST_CASE_ROW"][data-match="false"]')).toHaveCount(2);
  });

  test('VALID: {format-greeting.ts selected, switch to Raw JSON tab} => shows the full cache blob (relPath + contentHash + derived analysis) at full width and hides the right detail panel', async () => {
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    const window = await app.launch();

    await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
    await window.getByTestId('FILE_TREE_FILE').filter({ hasText: 'format-greeting.ts' }).click();

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
    await expect(rawBlob).toContainText('"relPath": "packages/shared/src/format-greeting.ts"');
    await expect(rawBlob).toContainText('"contentHash":');
    await expect(rawBlob).toContainText('formatGreeting/return@if-then');
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
