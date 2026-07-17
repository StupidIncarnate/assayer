import { render, screen } from '@testing-library/react';

import { codemirrorViewAdapter } from './codemirror-view-adapter';
import { codemirrorViewAdapterProxy } from './codemirror-view-adapter.proxy';

describe('codemirrorViewAdapter', () => {
  describe('rendering source', () => {
    it('VALID: {value: "const x = 1;"} => renders the value as read-only editor content', () => {
      codemirrorViewAdapterProxy();
      render(codemirrorViewAdapter({ value: 'const x = 1;' }));

      const editorContent = screen.getByRole('textbox');

      expect(editorContent.textContent).toBe('const x = 1;');
    });

    it('VALID: {value: "const x = 1;"} => renders a visible line-number gutter for line 1', () => {
      codemirrorViewAdapterProxy();
      render(codemirrorViewAdapter({ value: 'const x = 1;' }));

      const editorContent = screen.getByRole('textbox');
      const scroller = editorContent.parentElement;
      const lineNumbersGutter = scroller?.querySelector('.cm-lineNumbers');

      expect(lineNumbersGutter?.className).toBe('cm-gutter cm-lineNumbers');

      const activeLineNumberElement = scroller?.querySelector(
        '.cm-lineNumbers .cm-gutterElement.cm-activeLineGutter',
      );

      expect(activeLineNumberElement?.textContent).toBe('1');
    });

    it('VALID: {value: "const x = 1;"} => renders syntax-highlighted token spans, not one plain text node', () => {
      codemirrorViewAdapterProxy();
      render(codemirrorViewAdapter({ value: 'const x = 1;' }));

      const editorContent = screen.getByRole('textbox');
      const highlightedTokens = editorContent.querySelectorAll('.cm-line span');

      expect(highlightedTokens.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('dark spots', () => {
    it('VALID: {a L2-L3 dark spot} => shades every line of the span and only those', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfor (const x of xs) {\n}\nconst b = 2;',
          darkSpots: [{ startLine: 2, endLine: 3, label: 'DARK ForOfStatement' }],
        }),
      );

      const shaded = Array.from(document.querySelectorAll('.cm-dark-spot')).map((element) => element.textContent);

      expect(shaded).toStrictEqual(['for (const x of xs) {', '}']);
    });

    it('VALID: {a dark spot} => the icon carries its label as the hover explanation', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfor (const x of xs) {\n}',
          darkSpots: [{ startLine: 2, endLine: 3, label: 'DARK ForOfStatement — Assayer has no handler for it' }],
        }),
      );

      const icons = Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]')).map((element) =>
        element.getAttribute('title'),
      );

      expect(icons).toStrictEqual(['DARK ForOfStatement — Assayer has no handler for it']);
    });

    // The icon marks where the region STARTS; the shading carries how far it runs. Repeating it down
    // every line would say the same thing three times.
    it('VALID: {a 3-line dark spot} => renders exactly one icon, on the span start', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfor (const x of xs) {\n  sum += x;\n}',
          darkSpots: [{ startLine: 2, endLine: 4, label: 'DARK ForOfStatement' }],
        }),
      );

      const icons = Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]')).map(
        (element) => element.textContent,
      );

      expect(icons).toStrictEqual(['ⓘ']);
    });

    // The two gutters answer different questions and neither may silence the other. The walk DESCENDS
    // an unhandled node, so a `return` inside an unfollowed loop is found and owes its count — while
    // the loop around it is still syntax nobody parsed.
    it('VALID: {a counted line inside a dark spot} => keeps its count and its shading', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfor (const x of xs) {\n  return x;\n}',
          markers: [{ line: 3, count: 2 }],
          darkSpots: [{ startLine: 2, endLine: 4, label: 'DARK ForOfStatement' }],
        }),
      );

      const counts = Array.from(document.querySelectorAll('.cm-test-counts .cm-gutterElement')).map(
        (element) => element.textContent,
      );
      const shaded = Array.from(document.querySelectorAll('.cm-dark-spot')).map((element) => element.textContent);

      expect(counts).toStrictEqual(['', '2']);
      expect(shaded).toStrictEqual(['for (const x of xs) {', '  return x;', '}']);
    });

    it('EDGE: {endLine past the last line} => shades to the end of the document rather than throwing', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfor (const x of xs) {',
          darkSpots: [{ startLine: 2, endLine: 99, label: 'DARK ForOfStatement' }],
        }),
      );

      const shaded = Array.from(document.querySelectorAll('.cm-dark-spot')).map((element) => element.textContent);

      expect(shaded).toStrictEqual(['for (const x of xs) {']);
    });

    it('EMPTY: {no dark spots} => nothing is shaded and no icon renders', () => {
      codemirrorViewAdapterProxy();
      render(codemirrorViewAdapter({ value: 'const x = 1;' }));

      expect(Array.from(document.querySelectorAll('.cm-dark-spot'))).toStrictEqual([]);
      expect(Array.from(document.querySelectorAll('[data-testid="DARK_SPOT_ICON"]'))).toStrictEqual([]);
    });
  });

  describe('undriven spans', () => {
    it('VALID: {a L2-L3 undriven span} => shades every line of the span and only those', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfunction inner() {\n}\nconst b = 2;',
          undriven: [{ startLine: 2, endLine: 3, label: 'UNDRIVEN inner' }],
        }),
      );

      const shaded = Array.from(document.querySelectorAll('.cm-undriven')).map((element) => element.textContent);

      expect(shaded).toStrictEqual(['function inner() {', '}']);
    });

    it('VALID: {an undriven span} => the icon carries its label as the hover explanation', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfunction inner() {\n}',
          undriven: [{ startLine: 2, endLine: 3, label: 'UNDRIVEN inner — it is not exported' }],
        }),
      );

      const icons = Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]')).map((element) =>
        element.getAttribute('title'),
      );

      expect(icons).toStrictEqual(['UNDRIVEN inner — it is not exported']);
    });

    it('VALID: {a 3-line undriven span} => renders exactly one icon, on the span start', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfunction inner() {\n  return 1;\n}',
          undriven: [{ startLine: 2, endLine: 4, label: 'UNDRIVEN inner' }],
        }),
      );

      const icons = Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]')).map(
        (element) => element.textContent,
      );

      expect(icons).toStrictEqual(['▷']);
    });

    // The two admissions are opposite claims about the analyzer, so their treatments share nothing: a
    // reader who cannot tell them apart either doubts an analysis that is sound, or trusts one that is
    // blind. Both channels in one document, neither bleeding into the other.
    it('VALID: {a dark spot and an undriven span} => each keeps its own shading class and glyph', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'function inner() {\n}\nfor (const x of xs) {\n}',
          darkSpots: [{ startLine: 3, endLine: 4, label: 'DARK ForOfStatement' }],
          undriven: [{ startLine: 1, endLine: 2, label: 'UNDRIVEN inner' }],
        }),
      );

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
        undrivenShaded: ['function inner() {', '}'],
        darkShaded: ['for (const x of xs) {', '}'],
        undrivenIcons: ['▷'],
        darkIcons: ['ⓘ'],
      });
    });

    it('EDGE: {endLine past the last line} => shades to the end of the document rather than throwing', () => {
      codemirrorViewAdapterProxy();
      render(
        codemirrorViewAdapter({
          value: 'const a = 1;\nfunction inner() {',
          undriven: [{ startLine: 2, endLine: 99, label: 'UNDRIVEN inner' }],
        }),
      );

      const shaded = Array.from(document.querySelectorAll('.cm-undriven')).map((element) => element.textContent);

      expect(shaded).toStrictEqual(['function inner() {']);
    });

    it('EMPTY: {no undriven spans} => nothing is shaded and no icon renders', () => {
      codemirrorViewAdapterProxy();
      render(codemirrorViewAdapter({ value: 'const x = 1;' }));

      expect(Array.from(document.querySelectorAll('.cm-undriven'))).toStrictEqual([]);
      expect(Array.from(document.querySelectorAll('[data-testid="UNDRIVEN_ICON"]'))).toStrictEqual([]);
    });
  });
});
