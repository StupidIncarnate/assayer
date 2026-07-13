import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { RawBlobViewerWidget } from './raw-blob-viewer-widget';
import { RawBlobViewerWidgetProxy } from './raw-blob-viewer-widget.proxy';
import { CompiledFileViewStub } from '@assayer/shared/contracts';

describe('RawBlobViewerWidget', () => {
  describe('with a compiled file view', () => {
    it('VALID: {fileView} => renders the exact blob as pretty-printed JSON', () => {
      RawBlobViewerWidgetProxy();
      const fileView = CompiledFileViewStub();

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <RawBlobViewerWidget fileView={fileView} /> });

      expect(getByTestId('RAW_BLOB').textContent).toBe(JSON.stringify(fileView, null, '  '));
    });
  });

  describe('with no file selected', () => {
    it('EMPTY: {fileView: null} => renders the inspect prompt and no blob', () => {
      RawBlobViewerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <RawBlobViewerWidget fileView={null} />,
      });

      expect(getByTestId('RAW_EMPTY').textContent).toBe('Select a file to inspect its cache blob');
    });
  });
});
