import ts from '#gateway/npm/typescript';

import { collectNodesLayerTransformer } from './collect-nodes-layer-transformer';
import { readMarkerSlotLayerTransformer } from './read-marker-slot-layer-transformer';

describe('readMarkerSlotLayerTransformer', () => {
  describe('marker calls', () => {
    it('VALID: {call: $stmts("body"), markerName: "$stmts"} => returns the slot name', () => {
      const sourceFile = ts.createSourceFile('a.ts', "$stmts('body');\n", ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).map((call) =>
        readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }),
      );

      expect(result).toStrictEqual(['body']);
    });
  });

  describe('other calls', () => {
    it('EMPTY: {call: $expr("field"), markerName: "$stmts"} => returns undefined, since the marker is another one', () => {
      const sourceFile = ts.createSourceFile('a.ts', "$expr('field');\n", ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).map((call) =>
        readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }),
      );

      expect(result).toStrictEqual([undefined]);
    });

    it('EMPTY: {call: object.$stmts("body")} => returns undefined, since the callee is not a plain name', () => {
      const sourceFile = ts.createSourceFile('a.ts', "object.$stmts('body');\n", ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).map((call) =>
        readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }),
      );

      expect(result).toStrictEqual([undefined]);
    });

    it('EMPTY: {call: $stmts()} => returns undefined, since no slot is named', () => {
      const sourceFile = ts.createSourceFile('a.ts', '$stmts();\n', ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).map((call) =>
        readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }),
      );

      expect(result).toStrictEqual([undefined]);
    });

    it('EMPTY: {call: $stmts(name)} => returns undefined, since the slot is not a string literal', () => {
      const sourceFile = ts.createSourceFile('a.ts', '$stmts(name);\n', ts.ScriptTarget.ES2022, true);

      const result = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).map((call) =>
        readMarkerSlotLayerTransformer({ call, markerName: '$stmts' }),
      );

      expect(result).toStrictEqual([undefined]);
    });
  });
});
