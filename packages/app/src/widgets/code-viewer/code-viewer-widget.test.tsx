import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { CodeViewerWidget } from './code-viewer-widget';
import { CodeViewerWidgetProxy } from './code-viewer-widget.proxy';
import {
  CompiledFileViewStub,
  DarkSpotStub,
  EntrySignatureStub,
  FileAnalysisStub,
  FunctionAnalysisStub,
  UndrivenEntryStub,
} from '@assayer/shared/contracts';

// The real module-scope shape: nothing can call it, and it takes no params.
const MODULE_ENTRY = EntrySignatureStub({
  name: '*module*',
  scopePath: ['*module*'],
  params: [],
  access: { kind: 'unreachable' },
});

const STUB_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// The loop specimen: a for-of Assayer has no handler for, spanning L4-L6, inside an entry it fully
// understands. The lines around it must stay ordinary — a treatment that marks the whole file says
// nothing.
const LOOP_DISPLAY_LINES = [
  'export function sumAll(items: number[]): number {',
  '  let total = 0;',
  '',
  '  for (const item of items) {',
  '    total = total + item;',
  '  }',
  '',
  '  return total;',
  '}',
].map((text, index) => ({ n: index + 1, text, hash: STUB_HASH }));

const LOOP_DARK_SPOT = DarkSpotStub({
  kind: 'ForOfStatement',
  scopePath: ['*module*', 'sumAll'],
  startLine: 4,
  endLine: 6,
});

// The nested-function specimen: `inner` is read perfectly and nothing can call it, so its span is a
// real REGION of the file — the case that separates an undriven mark from a whole-file one.
const NESTED_DISPLAY_LINES = [
  'export function outer(value: number): string {',
  '  function inner(n: number): string {',
  '    if (n > 5) {',
  "      return 'inner big';",
  '    }',
  '',
  "    return 'inner small';",
  '  }',
  '',
  '  return inner(value);',
  '}',
].map((text, index) => ({ n: index + 1, text, hash: STUB_HASH }));

const NESTED_UNDRIVEN = UndrivenEntryStub({
  name: 'inner',
  reason: 'it is not exported, so nothing outside the module can call it',
  startLine: 2,
  endLine: 8,
});

describe('CodeViewerWidget', () => {
  describe('rendering a compiled file view', () => {
    it('VALID: {fileView with 2 lines} => renders line-number gutter markers 1 and 2', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: [
          { n: 1, text: 'const a = 1;', hash: STUB_HASH },
          { n: 2, text: 'const b = 2;', hash: STUB_HASH },
        ],
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const gutterElementTexts = Array.from(
        document.querySelectorAll('.cm-lineNumbers .cm-gutterElement'),
      ).map((element) => element.textContent);

      expect(gutterElementTexts).toStrictEqual(['9', '1', '2']);
    });

    it('VALID: {fileView with a TS code line} => renders syntax-highlighted token spans', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: [{ n: 1, text: 'export const foo = 1;', hash: STUB_HASH }],
      });

      const { getByRole } = testingLibraryRenderAdapter({
        ui: <CodeViewerWidget fileView={fileView} />,
      });

      const editor = getByRole('textbox');
      const highlightedTokens = editor.querySelectorAll('.cm-line span');

      expect(highlightedTokens.length).toBeGreaterThanOrEqual(1);
    });

    it('VALID: {fileView with a single line} => renders its text exactly', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: [{ n: 1, text: 'const cached = true;', hash: STUB_HASH }],
      });

      const { getByRole } = testingLibraryRenderAdapter({
        ui: <CodeViewerWidget fileView={fileView} />,
      });

      expect(getByRole('textbox').textContent).toBe('const cached = true;');
    });
  });

  describe('dark spots', () => {
    // The mark lands on the SOURCE, not just in a panel. Every line of the span, and only those: the
    // reader is looking at the loop, and the editor has to say Assayer is blind to it.
    it('VALID: {analysis with a L4-L6 dark spot} => shades exactly the lines of the span', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: LOOP_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], enrichment: [], darkSpots: [LOOP_DARK_SPOT] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const shaded = Array.from(document.querySelectorAll('.cm-dark-spot')).map((element) => element.textContent);

      expect(shaded).toStrictEqual(['  for (const item of items) {', '    total = total + item;', '  }']);
    });

    // No run has happened here — a dark spot is a fact about the file, so opening it is enough.
    it('VALID: {analysis with a dark spot, no run} => flags the span start with the icon and the CLI wording', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: LOOP_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], enrichment: [], darkSpots: [LOOP_DARK_SPOT] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const icons = Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]')).map((element) => ({
        text: element.textContent,
        title: element.getAttribute('title'),
      }));

      expect(icons).toStrictEqual([
        {
          text: 'ⓘ',
          title:
            'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it is covered',
        },
      ]);
    });

    it('EMPTY: {analysis with no dark spots} => nothing is shaded and no icon is rendered', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: LOOP_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], enrichment: [], darkSpots: [] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      expect(Array.from(document.querySelectorAll('.cm-dark-spot'))).toStrictEqual([]);
      expect(Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]'))).toStrictEqual([]);
    });

    // A file whose analysis never arrived must not invent a dark spot — silence here is honest,
    // because nothing was analyzed to be blind to.
    it('EMPTY: {fileView with no analysis} => renders the source unshaded', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({ displayLines: LOOP_DISPLAY_LINES });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      expect(Array.from(document.querySelectorAll('.cm-dark-spot'))).toStrictEqual([]);
    });
  });

  describe('undriven entries', () => {
    // The pure-statement shape: a module scope whose derived cases nothing executes. Counting them
    // would mark its branches as covered while the run reports 0/0.
    it('VALID: {an undriven entry with derived cases} => its cases are not counted in the gutter', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: LOOP_DISPLAY_LINES,
        analysis: FileAnalysisStub({
          functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
          undriven: [UndrivenEntryStub({ name: '*module*', startLine: 1, endLine: 9 })],
        }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const counts = Array.from(document.querySelectorAll('.cm-test-counts .cm-gutterElement')).map(
        (element) => element.textContent,
      );

      expect(counts).toStrictEqual(['']);
    });

    // The mark lands on the SOURCE, exactly as a dark spot's does. `inner` is a whole function body
    // with a branch and two returns, and rendered like any other code it reads as covered.
    it('VALID: {an undriven entry spanning L2-L8} => shades exactly the lines of the span', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: NESTED_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], darkSpots: [], undriven: [NESTED_UNDRIVEN] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const shaded = Array.from(document.querySelectorAll('.cm-undriven')).map((element) => element.textContent);

      expect(shaded).toStrictEqual([
        '  function inner(n: number): string {',
        '    if (n > 5) {',
        "      return 'inner big';",
        '    }',
        '',
        "    return 'inner small';",
        '  }',
      ]);
    });

    // Read from the ANALYSIS, so opening the file is enough — no run has happened here.
    it('VALID: {an undriven entry, no run} => flags the span start with the icon and the CLI wording', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: NESTED_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], darkSpots: [], undriven: [NESTED_UNDRIVEN] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      const icons = Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]')).map((element) => ({
        text: element.textContent,
        title: element.getAttribute('title'),
      }));

      expect(icons).toStrictEqual([
        {
          text: '▷',
          title: 'UNDRIVEN inner — it is not exported, so nothing outside the module can call it',
        },
      ]);
    });

    // The two admissions are opposite claims about the analyzer — blind here, sound there — so an
    // undriven span must never pick up the dark spot's treatment. Same file, both channels, no bleed.
    it('VALID: {an undriven span beside a dark spot} => each gets its own treatment, never the other', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: NESTED_DISPLAY_LINES,
        analysis: FileAnalysisStub({
          functions: [],
          darkSpots: [DarkSpotStub({ kind: 'ForOfStatement', scopePath: ['*module*'], startLine: 10, endLine: 10 })],
          undriven: [NESTED_UNDRIVEN],
        }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      expect({
        undrivenShaded: Array.from(document.querySelectorAll('.cm-undriven')).map((element) => element.textContent),
        darkShaded: Array.from(document.querySelectorAll('.cm-dark-spot')).map((element) => element.textContent),
        undrivenIcons: Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]')).map(
          (element) => element.textContent,
        ),
        darkIcons: Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]')).map(
          (element) => element.textContent,
        ),
      }).toStrictEqual({
        undrivenShaded: [
          '  function inner(n: number): string {',
          '    if (n > 5) {',
          "      return 'inner big';",
          '    }',
          '',
          "    return 'inner small';",
          '  }',
        ],
        darkShaded: ['  return inner(value);'],
        undrivenIcons: ['▷'],
        darkIcons: ['ⓘ'],
      });
    });

    // A span with no rest of the file to differ from draws no distinction, so the treatment is not
    // spent on it. Gated on the EXTENT — a module scope simply IS its file — never on the name.
    it('EDGE: {an undriven span covering every line} => not shaded, since it marks nothing out', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: LOOP_DISPLAY_LINES,
        analysis: FileAnalysisStub({
          functions: [],
          darkSpots: [],
          undriven: [UndrivenEntryStub({ name: '*module*', startLine: 1, endLine: 9 })],
        }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      expect(Array.from(document.querySelectorAll('.cm-undriven'))).toStrictEqual([]);
      expect(Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]'))).toStrictEqual([]);
    });

    it('EMPTY: {analysis with no undriven entries} => nothing is shaded and no icon is rendered', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        displayLines: NESTED_DISPLAY_LINES,
        analysis: FileAnalysisStub({ functions: [], darkSpots: [], undriven: [] }),
      });

      testingLibraryRenderAdapter({ ui: <CodeViewerWidget fileView={fileView} /> });

      expect(Array.from(document.querySelectorAll('.cm-undriven'))).toStrictEqual([]);
      expect(Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]'))).toStrictEqual([]);
    });
  });

  describe('with no file selected', () => {
    it('EMPTY: {fileView: null} => renders the placeholder prompt in EXPLORER_CODE with no editor', () => {
      CodeViewerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <CodeViewerWidget fileView={null} />,
      });

      expect(getByTestId('EXPLORER_CODE').textContent).toBe('Select a file to view its compiled source');
      expect(Array.from(document.querySelectorAll('[role="textbox"]'))).toStrictEqual([]);
    });
  });
});
