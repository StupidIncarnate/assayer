import ts from '#gateway/npm/typescript';

import { collectNodesLayerTransformer } from './collect-nodes-layer-transformer';
import { nearestCallableLayerTransformer } from './nearest-callable-layer-transformer';

describe('nearestCallableLayerTransformer', () => {
    it.each([
      ['function declaration', 'const c = () => { function run() { marker(); } };', ts.SyntaxKind.FunctionDeclaration],
      ['function expression', 'const c = () => { const run = function () { marker(); }; };', ts.SyntaxKind.FunctionExpression],
      ['arrow function', 'const c = () => { const run = () => { marker(); }; };', ts.SyntaxKind.ArrowFunction],
      ['method', 'const c = () => { class K { run() { marker(); } } };', ts.SyntaxKind.MethodDeclaration],
      ['constructor', 'const c = () => { class K { constructor() { marker(); } } };', ts.SyntaxKind.Constructor],
      ['get accessor', 'const c = () => { class K { get run() { return marker(); } } };', ts.SyntaxKind.GetAccessor],
    ])('VALID: {marker inside a %s} => returns that node', (_label, source, kind) => {
      const sourceFile = ts.createSourceFile('a.ts', source, ts.ScriptTarget.ES2022, true);
      const arrows = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isArrowFunction }).slice(0, 1);
      const markers = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).slice(0, 1);

      const result = arrows.flatMap((arrow) =>
        markers.map((marker) => nearestCallableLayerTransformer({ node: marker, stop: arrow })?.kind),
      );

      expect(result).toStrictEqual([kind]);
    });

    it('VALID: {marker inside a function inside a function} => returns the inner function', () => {
      const sourceFile = ts.createSourceFile(
        'a.ts',
        'const c = () => { function outer() { function inner() { marker(); } } };',
        ts.ScriptTarget.ES2022,
        true,
      );
      const arrows = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isArrowFunction }).slice(0, 1);
      const markers = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).slice(0, 1);

      const result = arrows.flatMap((arrow) =>
        markers.map((marker) => nearestCallableLayerTransformer({ node: marker, stop: arrow })?.getText(sourceFile)),
      );

      expect(result).toStrictEqual(['function inner() { marker(); }']);
    });

    it('EMPTY: {marker directly in the stop arrow} => returns undefined', () => {
      const sourceFile = ts.createSourceFile('a.ts', 'const c = () => { marker(); };', ts.ScriptTarget.ES2022, true);
      const arrows = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isArrowFunction }).slice(0, 1);
      const markers = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).slice(0, 1);

      const result = arrows.flatMap((arrow) => markers.map((marker) => nearestCallableLayerTransformer({ node: marker, stop: arrow })));

      expect(result).toStrictEqual([undefined]);
    });

    it('EMPTY: {marker inside a block and a variable declaration, no function} => returns undefined', () => {
      const sourceFile = ts.createSourceFile('a.ts', 'const c = () => { if (true) { const x = marker(); } };', ts.ScriptTarget.ES2022, true);
      const arrows = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isArrowFunction }).slice(0, 1);
      const markers = collectNodesLayerTransformer({ node: sourceFile, matches: ts.isCallExpression }).slice(0, 1);

      const result = arrows.flatMap((arrow) => markers.map((marker) => nearestCallableLayerTransformer({ node: marker, stop: arrow })));

      expect(result).toStrictEqual([undefined]);
    });
});
