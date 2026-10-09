import ts from '#gateway/npm/typescript';

import { parseSnippetStatementsTransformer } from './parse-snippet-statements-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseSnippetStatementsTransformer', () => {
  it('VALID: {one declaration} => returns that statement', () => {
    const statements = parseSnippetStatementsTransformer({ text: 'const value: number = 3;' });

    expect(statements.map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE))).toStrictEqual([
      'const value: number = 3;',
    ]);
  });

  it('VALID: {an if with return arms and a final return} => returns each top-level statement', () => {
    const statements = parseSnippetStatementsTransformer({
      text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
    });

    expect(statements.map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE))).toStrictEqual([
      "if (value > 5) {\n    return 'then';\n}",
      "return 'else';",
    ]);
  });

  it('VALID: {yield statements} => accepts yield, because the text is parsed inside a generator', () => {
    const statements = parseSnippetStatementsTransformer({ text: 'yield "then";' });

    expect(statements.map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE))).toStrictEqual([
      "yield 'then';",
    ]);
  });

  it('EMPTY: {text: ""} => returns no statements', () => {
    const statements = parseSnippetStatementsTransformer({ text: '' });

    expect(statements.map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE))).toStrictEqual(
      [],
    );
  });
});
