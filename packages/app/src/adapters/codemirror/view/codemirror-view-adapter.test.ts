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
});
