/**
 * PURPOSE: Renders a compiled file's cached source in a read-only CodeMirror editor (line numbers +
 *   TS/TSX highlighting) inside the EXPLORER_CODE panel; renders an empty panel when no file is
 *   selected.
 *
 * USAGE:
 * <CodeViewerWidget fileView={fileView} />
 * // Renders the file's lines; renders nothing inside the panel when fileView is null
 */
import type { ReactElement } from 'react';
import type { CompiledFileView } from '@assayer/shared/contracts';

import { codemirrorViewAdapter } from '../../adapters/codemirror/view/codemirror-view-adapter';

export interface CodeViewerWidgetProps {
  fileView: CompiledFileView | null;
}

export const CodeViewerWidget = ({ fileView }: CodeViewerWidgetProps): ReactElement => (
  <div data-testid="EXPLORER_CODE">
    {fileView === null
      ? null
      : codemirrorViewAdapter({ value: fileView.lines.map((line) => line.text).join('\n') })}
  </div>
);
