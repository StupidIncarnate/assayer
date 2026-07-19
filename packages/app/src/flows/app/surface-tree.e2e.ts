/**
 * PURPOSE: Playwright e2e for the Compiled Surface Explorer SHELL + FILE TREE. Compiles the smoke-repo
 *   syntax-repository into a PER-TEST temp cache via the built CLI precheck, launches the REAL built
 *   Electron desktop app at the '/' hash route, and asserts the shell handshake: the status header, the
 *   file tree rebuilt purely from the cache manifest relPaths, and that clicking a file renders its
 *   cached source in CodeMirror.
 *
 *   This is the ONLY surface e2e that enumerates the WHOLE catalogue — the header file counts, the
 *   FILE_TREE_FILE leaves, and the FILE_TREE_DIR nodes. It asserts them DISK-DERIVED via
 *   syntaxSurfaceHarness (the same inclusion rule the compiler uses), so a new specimen never forces an
 *   edit here. Every other surface e2e selects a single file by data-relpath and never re-asserts the
 *   catalogue.
 *
 * USAGE:
 * npm run ward -- --only e2e -- packages/app/src/flows/app/surface-tree.e2e.ts
 * // Boots the built dist + desktop-main; needs a display. Never touches the repo's own .assayer/cache.
 */
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { smokeRepoAppHarness } from '../../../test/harnesses/smoke-repo-app.harness';
import { syntaxSurfaceHarness } from '../../../test/harnesses/syntax-surface.harness';

const IF_ELSE_IN_FUNCTION = 'packages/syntax-repository/src/happy-path/if-else/in-function/in-function.ts';

test.describe('Compiled Surface Explorer — shell + file tree', () => {
  const app = smokeRepoAppHarness();
  wireHarnessLifecycle({ harness: app });
  const surface = syntaxSurfaceHarness();

  test('VALID: {compiled syntax-repository cache, window opens at /} => header handshake + file tree, and clicking happy-path/if-else/in-function/in-function.ts renders its cached source in CodeMirror', async () => {
    // Precondition: run the built CLI precheck, which compiles the syntax-repository into .assayer/cache.
    const exitCode = await app.compile();
    expect(exitCode).toBe(0);

    // window-open: the Electron window opens the renderer at the '/' hash route.
    const window = await app.launch();

    // obs-status-header (also proves obs-tree-bridge-call: header renders live cache data, so the
    // preload->IPC getCompiledTree() handshake resolved). Counts are the compiled surface, derived off
    // disk by the same inclusion rule the compiler uses (specimen .ts files; co-located *.test.ts
    // excluded). Branch segment is the current working-tree namespace (environment-dependent), so the
    // pattern pins the stable brand/root/repo prefix + exact counts and allows any non-space branch token.
    const header = window.getByTestId('EXPLORER_HEADER');
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header).toHaveText(surface.surfaceHeaderPattern());

    // obs-tree-render: the left tree is rebuilt purely from the cache manifest relPaths. Assert the
    // exact file leaves and the exact directory nodes derived from those relPaths — both walked off
    // disk, so this is the sole enumeration of the whole catalogue.
    await expect(window.getByTestId('FILE_TREE')).toBeVisible();
    const fileNames = await window.getByTestId('FILE_TREE_FILE').allTextContents();
    expect([...fileNames].sort()).toStrictEqual(surface.fileLeaves());
    const dirNames = await window.getByTestId('FILE_TREE_DIR').allTextContents();
    expect([...dirNames].sort()).toStrictEqual(surface.dirNames());

    // click-file -> request-file (obs-file-bridge-call): clicking the file (by its exact relPath, so
    // the two in-function.ts rungs never collide) calls getCompiledFile({ relPath }); the resulting
    // render proves the file bridge call resolved.
    await window.locator(`[data-testid="FILE_TREE_FILE"][data-relpath="${IF_ELSE_IN_FUNCTION}"]`).click();

    // code-shown: read-only CodeMirror 6 renders the cached blob — the click reached the code view.
    const codePanel = window.getByTestId('EXPLORER_CODE');
    await expect(codePanel.locator('.cm-editor')).toBeVisible();
  });
});
