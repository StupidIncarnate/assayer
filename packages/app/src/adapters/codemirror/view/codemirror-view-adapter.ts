/**
 * PURPOSE: Wraps @uiw/react-codemirror as a read-only IDE-style code view — line-number gutter +
 *   TypeScript/TSX syntax highlighting — plus an optional test-count gutter that shows, beside each
 *   line, how many generated test cases run through it. So widgets can render cached source with
 *   coverage counts without importing codemirror (only adapters may import npm packages).
 *
 * USAGE:
 * codemirrorViewAdapter({ value: 'const x = 1;', markers: [{ line: 1, count: 2 }] });
 * // Returns a read-only CodeMirror ReactElement with line numbers, TS highlighting, and a '2' count on line 1
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';

class TestCountGutterMarker extends GutterMarker {
  private readonly node: Text;

  public constructor(label: string) {
    super();
    this.node = globalThis.document.createTextNode(label);
  }

  public eq(other: TestCountGutterMarker): boolean {
    return other.node.textContent === this.node.textContent;
  }

  public toDOM(): Node {
    return this.node;
  }
}

export const codemirrorViewAdapter = ({
  value,
  height,
  markers,
  onLineHover,
}: {
  value: string;
  height?: string;
  markers?: readonly { line: number; count: number }[];
  onLineHover?: (line: number | null) => void;
}): ReactElement => {
  const countByLine = new Map((markers ?? []).map((marker) => [marker.line, marker.count]));

  return createElement(CodeMirror, {
    value,
    theme: 'dark',
    ...(height === undefined ? {} : { height }),
    editable: false,
    readOnly: true,
    extensions: [
      javascript({ jsx: true, typescript: true }),
      EditorView.editable.of(false),
      gutter({
        class: 'cm-test-counts',
        lineMarker: (view, line) => {
          const count = countByLine.get(view.state.doc.lineAt(line.from).number);
          return count === undefined ? null : new TestCountGutterMarker(String(count));
        },
      }),
      ...(onLineHover === undefined
        ? []
        : [
            EditorView.domEventHandlers({
              mousemove: (event, view) => {
                const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
                onLineHover(pos === null ? null : view.state.doc.lineAt(pos).number);
                return false;
              },
              mouseleave: () => {
                onLineHover(null);
                return false;
              },
            }),
          ]),
    ],
  });
};
