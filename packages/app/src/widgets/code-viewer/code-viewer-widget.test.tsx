import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { CodeViewerWidget } from './code-viewer-widget';
import { CodeViewerWidgetProxy } from './code-viewer-widget.proxy';
import { CompiledFileViewStub } from '@assayer/shared/contracts';

const STUB_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('CodeViewerWidget', () => {
  describe('rendering a compiled file view', () => {
    it('VALID: {fileView with 2 lines} => renders line-number gutter markers 1 and 2', () => {
      CodeViewerWidgetProxy();
      const fileView = CompiledFileViewStub({
        lines: [
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
        lines: [{ n: 1, text: 'export const foo = 1;', hash: STUB_HASH }],
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
        lines: [{ n: 1, text: 'const cached = true;', hash: STUB_HASH }],
      });

      const { getByRole } = testingLibraryRenderAdapter({
        ui: <CodeViewerWidget fileView={fileView} />,
      });

      expect(getByRole('textbox').textContent).toBe('const cached = true;');
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
