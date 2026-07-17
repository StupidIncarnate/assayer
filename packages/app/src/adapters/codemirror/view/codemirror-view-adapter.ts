/**
 * PURPOSE: Wraps @uiw/react-codemirror as a read-only IDE-style code view — line-number gutter +
 *   TypeScript/TSX syntax highlighting — plus an optional test-count gutter that shows, beside each
 *   line, how many generated test cases run through it, and two independent span treatments that
 *   shade the source regions Assayer could not follow and the ones nothing drives. So widgets can
 *   render cached source with coverage counts without importing codemirror (only adapters may import
 *   npm packages).
 *
 *   Both admissions are marked ON THE SOURCE because that is what they are facts about — each carries
 *   a line span, and the reader is looking straight at those lines. Listed only in a side panel, the
 *   code itself still reads as understood, which is the impression the channels exist to break.
 *
 *   The two treatments must never be mistaken for each other, so they share no colour, no glyph and
 *   no column. A DARK SPOT is syntax Assayer never parsed and no feature is promised for; an UNDRIVEN
 *   span is syntax it parsed perfectly and cannot yet reach. A reader who reads one as the other
 *   either doubts an analysis that is sound, or trusts one that is blind.
 *
 *   Every gutter is a SEPARATE column, and none suppresses another. They answer different questions —
 *   "how many cases run through this line", "is this line inside a region Assayer never parsed", "is
 *   it inside a scope nothing calls" — and all can be true at once: the walk descends an unhandled
 *   node, so a `return` inside an unfollowed loop is still found and still owes its count. Blanking
 *   that count inside a marked region would trade one lie for another.
 *
 * USAGE:
 * codemirrorViewAdapter({ value: 'const x = 1;', markers: [{ line: 1, count: 2 }] });
 * // Returns a read-only CodeMirror ReactElement with line numbers, TS highlighting, and a '2' count on line 1
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Decoration, EditorView, gutter, GutterMarker } from '@codemirror/view';

const DARK_SPOT_ACCENT = '#da77f2';
const UNDRIVEN_ACCENT = '#3bc9db';

const darkSpotLineDecoration = Decoration.line({ class: 'cm-dark-spot' });
const undrivenLineDecoration = Decoration.line({ class: 'cm-undriven' });

// One marker renders both gutter columns. Only the DOM mechanism is shared: what each column MEANS
// is decided by the two gutter() calls below, which stay separate on purpose.
class GutterLabelMarker extends GutterMarker {
  private readonly node: HTMLElement;

  public constructor({ text, className, title, testId }: { text: string; className?: string; title?: string; testId?: string }) {
    super();
    this.node = globalThis.document.createElement('span');
    this.node.textContent = text;

    if (className !== undefined) {
      this.node.className = className;
    }

    if (title !== undefined) {
      this.node.title = title;
    }

    if (testId !== undefined) {
      this.node.setAttribute('data-testid', testId);
    }
  }

  public eq(other: GutterLabelMarker): boolean {
    return other.node.textContent === this.node.textContent && other.node.title === this.node.title;
  }

  public toDOM(): Node {
    return this.node;
  }
}

export const codemirrorViewAdapter = ({
  value,
  height,
  markers,
  darkSpots,
  undriven,
  onLineHover,
}: {
  value: string;
  height?: string;
  markers?: readonly { line: number; count: number }[];
  darkSpots?: readonly { startLine: number; endLine: number; label: string }[];
  undriven?: readonly { startLine: number; endLine: number; label: string }[];
  onLineHover?: (line: number | null) => void;
}): ReactElement => {
  const countByLine = new Map((markers ?? []).map((marker) => [marker.line, marker.count]));
  const spots = darkSpots ?? [];
  const labelByStartLine = new Map(spots.map((spot) => [spot.startLine, spot.label]));
  const undrivenSpans = undriven ?? [];
  const undrivenLabelByStartLine = new Map(undrivenSpans.map((span) => [span.startLine, span.label]));

  return createElement(CodeMirror, {
    value,
    theme: 'dark',
    ...(height === undefined ? {} : { height }),
    editable: false,
    readOnly: true,
    extensions: [
      javascript({ jsx: true, typescript: true }),
      EditorView.editable.of(false),
      // Darker, not lighter: the theme puts light text on a dark ground, so shading a region DEEPENS
      // its contrast rather than washing it out. The code inside a dark spot is still code the reader
      // has to read — and "dark spot" is what the region literally looks like.
      //
      // Undriven shades the other way, in its own hue. A second black wash separated from the first by
      // a stripe colour alone would make the two admissions one treatment with a detail, and they are
      // opposite claims about the analyzer: blind here, sound there. Hue, glyph and column all differ,
      // so telling them apart never rests on any single channel.
      EditorView.theme({
        '.cm-dark-spot': {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          boxShadow: `inset 2px 0 0 ${DARK_SPOT_ACCENT}`,
        },
        '.cm-dark-spots': { width: '1.1em' },
        '.cm-dark-spot-icon': { color: DARK_SPOT_ACCENT, cursor: 'help' },
        '.cm-undriven': {
          backgroundColor: 'rgba(34, 184, 207, 0.10)',
          boxShadow: `inset 2px 0 0 ${UNDRIVEN_ACCENT}`,
        },
        '.cm-undriven-marks': { width: '1.1em' },
        '.cm-undriven-icon': { color: UNDRIVEN_ACCENT, cursor: 'help' },
      }),
      EditorView.decorations.of((view) =>
        Decoration.set(
          [
            ...spots.flatMap((spot) => {
              const first = Math.max(1, spot.startLine);
              const last = Math.min(spot.endLine, view.state.doc.lines);

              return Array.from({ length: Math.max(0, last - first + 1) }, (_ignored, offset) =>
                darkSpotLineDecoration.range(view.state.doc.line(first + offset).from),
              );
            }),
            ...undrivenSpans.flatMap((span) => {
              const first = Math.max(1, span.startLine);
              const last = Math.min(span.endLine, view.state.doc.lines);

              return Array.from({ length: Math.max(0, last - first + 1) }, (_ignored, offset) =>
                undrivenLineDecoration.range(view.state.doc.line(first + offset).from),
              );
            }),
          ],
          true,
        ),
      ),
      gutter({
        class: 'cm-test-counts',
        lineMarker: (view, line) => {
          const count = countByLine.get(view.state.doc.lineAt(line.from).number);
          return count === undefined ? null : new GutterLabelMarker({ text: String(count) });
        },
      }),
      // The region's FIRST line carries the icon; the shading carries its extent. An icon repeated
      // down every line of the span would say the same thing four times. The label rides as the
      // icon's tooltip, because an icon whose meaning lives somewhere else is a puzzle — and this one
      // has to say that ASSAYER owes the work, not the reader.
      //
      // The column exists only where a dark spot does: a file Assayer read completely reserves no
      // empty strip for an admission it has none of.
      ...(spots.length === 0
        ? []
        : [
            gutter({
              class: 'cm-dark-spots',
              lineMarker: (view, line) => {
                const label = labelByStartLine.get(view.state.doc.lineAt(line.from).number);
                return label === undefined
                  ? null
                  : new GutterLabelMarker({
                      text: 'ⓘ',
                      className: 'cm-dark-spot-icon',
                      title: label,
                      testId: 'DARK_SPOT_ICON',
                    });
              },
            }),
          ]),
      // Its own column beside the dark spots, never a shared one: a file can hold both, and a single
      // column would have to pick which admission to show on a line they overlap. The glyph is a
      // hollow play — this is code that never runs — where a dark spot's is an info mark, so the two
      // stay apart for a reader who cannot tell grape from cyan.
      ...(undrivenSpans.length === 0
        ? []
        : [
            gutter({
              class: 'cm-undriven-marks',
              lineMarker: (view, line) => {
                const label = undrivenLabelByStartLine.get(view.state.doc.lineAt(line.from).number);
                return label === undefined
                  ? null
                  : new GutterLabelMarker({
                      text: '▷',
                      className: 'cm-undriven-icon',
                      title: label,
                      testId: 'UNDRIVEN_ICON',
                    });
              },
            }),
          ]),
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
