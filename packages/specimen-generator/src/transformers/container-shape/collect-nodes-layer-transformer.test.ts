import ts from '#gateway/npm/typescript';

import { collectNodesLayerTransformer } from './collect-nodes-layer-transformer';

describe('collectNodesLayerTransformer', () => {
  describe('matching nodes', () => {
    it('VALID: {source: nested calls, matches: isCallExpression} => returns outer calls before the calls inside them', () => {
      const sourceFile = ts.createSourceFile('a.ts', 'one(two(), 3);\nconst x = () => { four(); };\n', ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression });

      expect(result.map((call) => call.getText(sourceFile))).toStrictEqual(['one(two(), 3)', 'two()', 'four()']);
    });

    it('VALID: {node: the outer call, matches: isCallExpression} => leaves out the starting node itself', () => {
      const sourceFile = ts.createSourceFile('a.ts', 'one(two());\n', ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression })
        .slice(0, 1)
        .flatMap((outer) => collectNodesLayerTransformer({ node: outer, matches: ts.isCallExpression }));

      expect(result.map((call) => call.getText(sourceFile))).toStrictEqual(['two()']);
    });
  });

  describe('no matching nodes', () => {
    it('EMPTY: {source: no calls, matches: isCallExpression} => returns an empty list', () => {
      const sourceFile = ts.createSourceFile('a.ts', 'const x = 1;\n', ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression });

      expect(result).toStrictEqual([]);
    });
  });
});
