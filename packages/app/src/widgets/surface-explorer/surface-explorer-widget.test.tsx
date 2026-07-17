import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { SurfaceExplorerWidget } from './surface-explorer-widget';
import { SurfaceExplorerWidgetProxy } from './surface-explorer-widget.proxy';
import { CompiledTreeStub, CompiledFileViewStub, FileAnalysisStub } from '@assayer/shared/contracts';

const STUB_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('SurfaceExplorerWidget', () => {
  describe('with a compiled surface', () => {
    it('VALID: {tree with summary} => renders the explorer header with the exact summary line', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({
          summary: {
            repoName: 'assayer',
            branchName: 'master',
            rootFolderName: 'smoke-repo',
            tsCount: 12,
            tsxCount: 4,
          },
        }),
      });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('EXPLORER_HEADER')).toBeInTheDocument();
        },
      });

      expect(getByTestId('EXPLORER_HEADER').textContent).toBe(
        'Assayer | smoke-repo assayer/master | ts 12 tsx 4',
      );
    });
  });

  // The three ways to have no tree. They reach this widget identically and ask the reader for
  // opposite things, so each owns a surface of its own — and each test below asserts the OTHER two
  // are absent, since a shared prompt is exactly how they collapsed into one.
  describe('with no compiled surface', () => {
    it('EMPTY: {tree with no nodes} => renders the empty-surface prompt, and neither the loading nor the error surface', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({ tree: CompiledTreeStub({ nodes: [] }) });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('SURFACE_EMPTY')).toBeInTheDocument();
        },
      });

      expect(getByTestId('SURFACE_EMPTY').textContent).toBe('No compiled surface — run assayer');
      expect(queryByTestId('SURFACE_LOADING')).toBe(null);
      expect(queryByTestId('SURFACE_ERROR')).toBe(null);
    });

    // Asserted synchronously, before the fetch's microtask resolves — the one moment `loading` is the
    // whole truth. "Run assayer" here would be an instruction the reader cannot act on and does not
    // need to: the app is working and simply has not answered yet.
    it('EMPTY: {the tree fetch still in flight} => renders the loading surface, not the empty prompt', () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({ tree: CompiledTreeStub({ nodes: [] }) });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      expect(getByTestId('SURFACE_LOADING').textContent).toBe('Reading the compiled surface…');
      expect(queryByTestId('SURFACE_EMPTY')).toBe(null);
      expect(queryByTestId('SURFACE_ERROR')).toBe(null);
    });

    // The bug this surface exists for: a corrupt manifest told the reader to run assayer, which cannot
    // fix it, forever. The resolver's sentence names both namespaces in conflict — VERBATIM, because it
    // was written to be acted on without a human.
    it('ERROR: {the tree fetch rejects} => prints the resolver message verbatim, and never the empty prompt', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.failTree({
        message:
          'Cannot resolve current namespace: expected exactly one working-tree entry without a commit among [branch-a, branch-b]',
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('SURFACE_ERROR')).toBeInTheDocument();
        },
      });

      expect(getByTestId('SURFACE_ERROR').textContent).toBe(
        'Cannot resolve current namespace: expected exactly one working-tree entry without a commit among [branch-a, branch-b]',
      );
      expect(queryByTestId('SURFACE_EMPTY')).toBe(null);
      expect(queryByTestId('SURFACE_LOADING')).toBe(null);
    });

    // A failure must not be reachable through the empty prompt either: the explorer shell is what the
    // reader would otherwise try to use to fix it, and there is no tree to hang it on.
    it('ERROR: {the tree fetch rejects} => renders no header and no file tree', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.failTree({ message: 'Assayer preload bridge unavailable: window.assayerBridge was not exposed.' });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('SURFACE_ERROR')).toBeInTheDocument();
        },
      });

      expect(queryByTestId('EXPLORER_HEADER')).toBe(null);
      expect(queryByTestId('FILE_TREE')).toBe(null);
    });
  });

  describe('file click behavior', () => {
    it('VALID: {click app.tsx} => shows that file in the code viewer, not the other registered file', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({
          nodes: [
            {
              name: 'packages',
              path: 'packages',
              kind: 'dir',
              children: [
                {
                  name: 'web',
                  path: 'packages/web',
                  kind: 'dir',
                  children: [
                    { name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' },
                    { name: 'other.tsx', path: 'packages/web/other.tsx', kind: 'file' },
                  ],
                },
              ],
            },
          ],
        }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({
          relPath: 'packages/web/app.tsx',
          displayLines: [{ n: 1, text: 'const appModule = 1;', hash: STUB_HASH }],
        }),
      });
      proxy.setupFile({
        relPath: 'packages/web/other.tsx',
        fileView: CompiledFileViewStub({
          relPath: 'packages/web/other.tsx',
          displayLines: [{ n: 1, text: 'const otherModule = 2;', hash: STUB_HASH }],
        }),
      });

      const { getByTestId, getByRole } = testingLibraryRenderAdapter({
        ui: <SurfaceExplorerWidget />,
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('EXPLORER_HEADER')).toBeInTheDocument();
        },
      });

      await proxy.clickFile({ label: 'app.tsx' });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByRole('textbox')).toBeInTheDocument();
        },
      });

      expect(getByRole('textbox').textContent).toBe('const appModule = 1;');
    });

    it('ERROR: {file fetch rejects on click} => logs the failure and leaves the code panel empty', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({
          nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }],
        }),
      });
      proxy.failFile();

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });

      await proxy.clickFile({ label: 'app.tsx' });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.errorLogged()).toBe(true);
        },
      });

      expect(getByTestId('EXPLORER_CODE').textContent).toBe('Select a file to view its compiled source');
    });
  });

  describe('the run console', () => {
    // Opening the app must not run the repo, and a console standing open on startup would say a run
    // had begun when none had. The panel is the Run action's own output, so it starts absent.
    it('EMPTY: {app opened, nothing clicked} => no run console', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });

      expect(queryByTestId('RUN_CONSOLE')).toBe(null);
    });

    // Opening a file LOADS its last run. If merely selecting a file opened the console, clicking
    // through a tree would look like it was executing the repo.
    it('EMPTY: {a file opened, Run not clicked} => still no run console', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({ relPath: 'packages/web/app.tsx', analysis: FileAnalysisStub() }),
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });

      expect(queryByTestId('RUN_CONSOLE')).toBe(null);
    });

    it('VALID: {click Run} => opens the console showing the CLI output as it is written', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({ relPath: 'packages/web/app.tsx', analysis: FileAnalysisStub() }),
      });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });
      await proxy.clickRun();
      proxy.emitRunOutput({ chunk: 'app.tsx  1/1 passed\n' });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('RUN_CONSOLE_OUTPUT')).toBeInTheDocument();
        },
      });

      expect(getByTestId('RUN_CONSOLE_OUTPUT').textContent).toBe('app.tsx  1/1 passed\n');
    });

    // ADDITIVE: the console is a new panel, not a new screen. The tree and the code it sits under
    // stay mounted and readable, so a run never costs the reader the surface they were reading.
    it('VALID: {console open} => the file tree and code viewer are still shown', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({
          relPath: 'packages/web/app.tsx',
          displayLines: [{ n: 1, text: 'const appModule = 1;', hash: STUB_HASH }],
          analysis: FileAnalysisStub(),
        }),
      });

      const { getByTestId, getByRole } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });
      await proxy.clickRun();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('RUN_CONSOLE')).toBeInTheDocument();
        },
      });

      expect(getByTestId('FILE_TREE')).toBeInTheDocument();
      expect(getByRole('textbox').textContent).toBe('const appModule = 1;');
    });

    // Both panels are mounted with the SAME fileRun.error, so this is the only level at which the
    // one-copy rule can be checked at all — either widget alone looks correct in isolation.
    it('ERROR: {a run that could not happen} => the reason is printed once, by the detail panel', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({ relPath: 'packages/web/app.tsx', analysis: FileAnalysisStub() }),
      });
      proxy.failRun({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      const { getByTestId, queryAllByText } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });
      await proxy.clickRun();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('RUN_ERROR')).toBeInTheDocument();
        },
      });

      // Asserts WHICH surfaces carry the text, not merely that it appears: a second copy anywhere
      // lands in this array and fails, naming the offender.
      expect(
        queryAllByText('assayer: the CLI is not built, so nothing can be run.').map((element) =>
          element.getAttribute('data-testid'),
        ),
      ).toStrictEqual(['RUN_ERROR']);
    });

    // Not printing the reason must not make the console lie about the run being over.
    it('ERROR: {a run that could not happen} => the console states Failed without repeating the reason', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({ relPath: 'packages/web/app.tsx', analysis: FileAnalysisStub() }),
      });
      proxy.failRun({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });
      await proxy.clickRun();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('RUN_CONSOLE_STATUS').textContent).toBe('Failed');
        },
      });

      expect(getByTestId('RUN_CONSOLE_EMPTY').textContent).toBe(
        'The CLI wrote nothing — the Tests panel has the reason.',
      );
    });

    it('VALID: {hide the console} => the console closes and the explorer stays as it was', async () => {
      const proxy = SurfaceExplorerWidgetProxy();
      proxy.setupTree({
        tree: CompiledTreeStub({ nodes: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }] }),
      });
      proxy.setupFile({
        relPath: 'packages/web/app.tsx',
        fileView: CompiledFileViewStub({ relPath: 'packages/web/app.tsx', analysis: FileAnalysisStub() }),
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <SurfaceExplorerWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('FILE_TREE')).toBeInTheDocument();
        },
      });
      await proxy.clickFile({ label: 'app.tsx' });
      await proxy.clickRun();
      await proxy.hideRunConsole();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(queryByTestId('RUN_CONSOLE')).toBe(null);
        },
      });

      expect(getByTestId('FILE_TREE')).toBeInTheDocument();
    });
  });
});
