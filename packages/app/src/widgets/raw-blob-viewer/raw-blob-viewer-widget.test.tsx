import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { RawBlobViewerWidget } from './raw-blob-viewer-widget';
import { RawBlobViewerWidgetProxy } from './raw-blob-viewer-widget.proxy';
import { CompiledFileViewStub } from '@assayer/shared/contracts/compiled-file-view/compiled-file-view.stub';

describe('RawBlobViewerWidget', () => {
  describe('with a compiled file view', () => {
    it('VALID: {fileView} => renders the exact blob as pretty-printed JSON', () => {
      RawBlobViewerWidgetProxy();
      const fileView = CompiledFileViewStub();

      const { getByTestId } = render(<RawBlobViewerWidget fileView={fileView} />, { wrapper: MantineProvider });

      expect(getByTestId('RAW_BLOB').textContent).toBe(JSON.stringify(fileView, null, '  '));
    });
  });

  describe('with no file selected', () => {
    it('EMPTY: {fileView: null} => renders the inspect prompt and no blob', () => {
      RawBlobViewerWidgetProxy();

      const { getByTestId } = render(<RawBlobViewerWidget fileView={null} />, { wrapper: MantineProvider });

      expect(getByTestId('RAW_EMPTY').textContent).toBe('Select a file to inspect its cache blob');
    });
  });
});
