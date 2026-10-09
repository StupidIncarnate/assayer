import ts from '#gateway/npm/typescript';
import { SourceFileStub } from '#gateway/npm/typescript/source-file/source-file.stub';

import { findAllLayerTransformer } from './find-all-layer-transformer';

describe('findAllLayerTransformer', () => {
  describe('matches', () => {
    it('VALID: {two return statements} => returns both in source order', () => {
      const sourceFile = SourceFileStub({ code: 'const a = () => { return 1; };\nconst b = () => { return 2; };\n' });

      const result = findAllLayerTransformer({ node: sourceFile, predicate: ts.isReturnStatement });

      expect(result.map((node) => node.getText(sourceFile))).toStrictEqual(['return 1;', 'return 2;']);
    });

    it('VALID: {a return inside a nested arrow} => finds the nested one too', () => {
      const sourceFile = SourceFileStub({ code: 'const a = () => () => { return 1; };\n' });

      const result = findAllLayerTransformer({ node: sourceFile, predicate: ts.isReturnStatement });

      expect(result.map((node) => node.getText(sourceFile))).toStrictEqual(['return 1;']);
    });

    it('VALID: {predicate accepts the root} => the root is in the result', () => {
      const sourceFile = SourceFileStub({ code: 'const a = 1;\n' });

      const result = findAllLayerTransformer({ node: sourceFile, predicate: ts.isSourceFile });

      expect(result).toStrictEqual([sourceFile]);
    });
  });

  describe('no matches', () => {
    it('EMPTY: {no return statements} => returns an empty list', () => {
      const sourceFile = SourceFileStub({ code: 'const a = 1;\n' });

      const result = findAllLayerTransformer({ node: sourceFile, predicate: ts.isReturnStatement });

      expect(result).toStrictEqual([]);
    });
  });
});
