/**
 * PURPOSE: Wraps @uiw/react-codemirror as a read-only IDE-style code view — line-number gutter +
 *   TypeScript/TSX syntax highlighting — so widgets can render cached source without importing
 *   codemirror (only adapters may import npm packages).
 *
 * USAGE:
 * codemirrorViewAdapter({ value: 'const x = 1;' });
 * // Returns a read-only CodeMirror ReactElement with line numbers + TS highlighting
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

export const codemirrorViewAdapter = ({ value }: { value: string }): ReactElement =>
  createElement(CodeMirror, {
    value,
    editable: false,
    readOnly: true,
    extensions: [javascript({ jsx: true, typescript: true }), EditorView.editable.of(false)],
  });
