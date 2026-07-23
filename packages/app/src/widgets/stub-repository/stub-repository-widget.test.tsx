import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { StubRepositoryWidget } from './stub-repository-widget';
import { StubRepositoryWidgetProxy } from './stub-repository-widget.proxy';
import { StubViewStub, ObjectStubStub, EnvStubStub } from '@assayer/shared/contracts';

const CROSS_FILE_TYPES = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/types.ts';
const READER_A = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/cross-file-shape.ts';
const READER_B = 'packages/syntax-repository/src/happy-path/object/cross-file-shape/reader-b.ts';
const MULTI_READ = 'packages/syntax-repository/src/sad-path/env-object/multi-read/multi-read.ts';

describe('StubRepositoryWidget', () => {
  describe('with a merged stub view', () => {
    it('VALID: {an object stub} => renders its key, per-property values, an unknown property, and readers', async () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.setupView({
        view: StubViewStub({
          objectStubs: [
            ObjectStubStub({
              key: `${CROSS_FILE_TYPES}#Config`,
              definitionRelPath: CROSS_FILE_TYPES,
              typeName: 'Config',
              properties: [
                { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
                { name: 'region', demand: { kind: 'demanded', values: ['abc123', 'us'] } },
                { name: 'retries', demand: { kind: 'unknown' } },
              ],
              readers: [READER_A, READER_B],
            }),
          ],
          envStubs: [],
        }),
      });

      const { getByTestId, getAllByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STUB_UNKNOWN').textContent).toBe('unknown');
        },
      });

      expect(getByTestId('STUB_KEY').textContent).toBe(`${CROSS_FILE_TYPES}#Config`);
      expect(getAllByTestId('STUB_PROPERTY').map((element) => element.getAttribute('data-propname'))).toStrictEqual([
        'mode',
        'region',
        'retries',
      ]);
      expect(getAllByTestId('STUB_PROPERTY_VALUE').map((element) => element.textContent)).toStrictEqual([
        'a',
        'abc123',
        'abc123',
        'us',
      ]);
      expect(getAllByTestId('STUB_READER').map((element) => element.textContent)).toStrictEqual([READER_A, READER_B]);
    });

    it('VALID: {an env stub} => renders its process.env key, its guessed values, and its readers', async () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.setupView({
        view: StubViewStub({
          objectStubs: [],
          envStubs: [
            EnvStubStub({ key: 'process.env#CODE', property: 'CODE', values: [1, 2, 7], guessed: true, readers: [MULTI_READ] }),
          ],
        }),
      });

      const { getByTestId, getAllByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STUB_GUESSED').textContent).toBe('guessed');
        },
      });

      expect(getByTestId('STUB_KEY').textContent).toBe('process.env#CODE');
      expect(getAllByTestId('STUB_PROPERTY_VALUE').map((element) => element.textContent)).toStrictEqual(['1', '2', '7']);
      expect(getAllByTestId('STUB_READER').map((element) => element.textContent)).toStrictEqual([MULTI_READ]);
    });

    it('VALID: {env stub with guessed false} => badges the values corrected, not guessed', async () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.setupView({
        view: StubViewStub({
          objectStubs: [],
          envStubs: [EnvStubStub({ key: 'process.env#MODE', property: 'MODE', values: ['prod'], guessed: false, readers: [] })],
        }),
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STUB_CARD')).toBeInTheDocument();
        },
      });

      expect(getByTestId('STUB_CORRECTED').textContent).toBe('corrected');
      expect(queryByTestId('STUB_GUESSED')).toBe(null);
      expect(getByTestId('STUB_NO_READERS').textContent).toBe('No readers');
    });
  });

  describe('with no stubs', () => {
    it('EMPTY: {empty stub view} => renders the empty prompt, and neither loading nor error', async () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.setupView({ view: StubViewStub({ objectStubs: [], envStubs: [] }) });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STUB_EMPTY')).toBeInTheDocument();
        },
      });

      expect(getByTestId('STUB_EMPTY').textContent).toBe('No stubs — run assayer');
      expect(queryByTestId('STUB_LOADING')).toBe(null);
      expect(queryByTestId('STUB_ERROR')).toBe(null);
    });

    it('EMPTY: {the stub fetch still in flight} => renders the loading surface, not the empty prompt', () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.setupView({ view: StubViewStub({ objectStubs: [], envStubs: [] }) });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      expect(getByTestId('STUB_LOADING').textContent).toBe('Reading the stub repository…');
      expect(queryByTestId('STUB_EMPTY')).toBe(null);
      expect(queryByTestId('STUB_ERROR')).toBe(null);
    });
  });

  describe('when the fetch fails', () => {
    it('ERROR: {the stub fetch rejects} => prints the resolver message verbatim, and never the empty prompt', async () => {
      const proxy = StubRepositoryWidgetProxy();
      proxy.failView({
        message: 'assayer: cannot read /repo/assayer.config.json. Run `assayer status` in that repo to generate one.',
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({ ui: <StubRepositoryWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STUB_ERROR')).toBeInTheDocument();
        },
      });

      expect(getByTestId('STUB_ERROR').textContent).toBe(
        'assayer: cannot read /repo/assayer.config.json. Run `assayer status` in that repo to generate one.',
      );
      expect(queryByTestId('STUB_EMPTY')).toBe(null);
      expect(queryByTestId('STUB_LOADING')).toBe(null);
    });
  });
});
