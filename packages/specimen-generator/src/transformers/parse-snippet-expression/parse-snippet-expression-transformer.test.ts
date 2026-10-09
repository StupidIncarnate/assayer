import ts from '#gateway/npm/typescript';

import { parseSnippetExpressionTransformer } from './parse-snippet-expression-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseSnippetExpressionTransformer', () => {
  it('VALID: {text: "Number(process.argv[2])"} => returns a node that prints the same text', () => {
    const node = parseSnippetExpressionTransformer({ text: 'Number(process.argv[2])' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('Number(process.argv[2])');
  });

  it('VALID: {text: "value > 5"} => returns a node that prints the same text', () => {
    const node = parseSnippetExpressionTransformer({ text: 'value > 5' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('value > 5');
  });

  it('VALID: {text with a double-quoted string} => prints the string with single quotes', () => {
    const node = parseSnippetExpressionTransformer({ text: 'process.env.A ?? ""' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe("process.env.A ?? ''");
  });

  it('VALID: {text with KEY, rename KEY to RECEIVER} => prints the renamed identifier', () => {
    const node = parseSnippetExpressionTransformer({
      text: "(process.env.KEY ?? '').split(',').map(Number)",
      rename: { from: 'KEY', to: 'RECEIVER' },
    });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe(
      "(process.env.RECEIVER ?? '').split(',').map(Number)",
    );
  });

  it('VALID: {text: "a === b ? 1 : 2"} => keeps the conditional as one expression', () => {
    const node = parseSnippetExpressionTransformer({ text: 'a === b ? 1 : 2' });

    expect(ts.isConditionalExpression(node)).toBe(true);
  });
});
