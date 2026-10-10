import ts from '#gateway/npm/typescript';

import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { outcomeLiteralLayerTransformer } from './outcome-literal-layer-transformer';

describe('outcomeLiteralLayerTransformer', () => {
  it('VALID: {every array empty} => prints each field in contract order', () => {
    const prediction = SpecimenOutcomeStub({ branches: [] });
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.createSourceFile('x.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const node = outcomeLiteralLayerTransformer({ prediction });

    expect(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)).toBe(
      ['{', '    branches: [],', '    caseFailures: [],', '    lints: [],', '    undriven: [],', '    darkSpots: [],', '    gaps: []', '}'].join('\n'),
    );
  });

  it('VALID: {one row in every array} => prints each row with its keys in contract order', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [{ kind: 'switch', arm: 'case-1', line: 4, driven: 'never' }],
      caseFailures: [{ status: 'errored', message: 'boom' }],
      lints: [{ rule: 'dead-surface', startLine: 7 }],
      undriven: [{ startLine: 1 }],
      darkSpots: [{ startLine: 2 }],
      gaps: [{ name: 'limit' }],
    });
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.createSourceFile('x.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const node = outcomeLiteralLayerTransformer({ prediction });

    expect(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)).toBe(
      [
        '{',
        "    branches: [{ kind: 'switch', arm: 'case-1', line: 4, driven: 'never' }],",
        "    caseFailures: [{ status: 'errored', message: 'boom' }],",
        "    lints: [{ rule: 'dead-surface', startLine: 7 }],",
        '    undriven: [{ startLine: 1 }],',
        '    darkSpots: [{ startLine: 2 }],',
        "    gaps: [{ name: 'limit' }]",
        '}',
      ].join('\n'),
    );
  });
});
