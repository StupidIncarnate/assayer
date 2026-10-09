import { Project } from '#gateway/npm/ts-morph';
import type { Node, SourceFile } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readConstBindingLayerTransformer } from './read-const-binding-layer-transformer';
import { readConstBindingLayerTransformerProxy } from './read-const-binding-layer-transformer.proxy';

// A file parsed exactly as the walk parses: an in-memory project with the standard library only.
const parse = ({ source }: { source: string }): SourceFile =>
  new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() }).createSourceFile('src/x.ts', source);

// The initializer of the file's `subject` const: the identifier the test resolves.
const subjectOf = ({ sourceFile }: { sourceFile: SourceFile }): Node =>
  sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();

describe('readConstBindingLayerTransformer', () => {
  describe('a binding it follows', () => {
    it('VALID: {const raw = 1; subject = raw} => the declaration of raw', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'const raw = 1;\nconst subject = raw;' });

      const result = readConstBindingLayerTransformer({ node: subjectOf({ sourceFile }), seen: [] });

      expect(result).toBe(sourceFile.getVariableDeclarationOrThrow('raw'));
    });
  });

  describe('a binding it does not follow', () => {
    it('VALID: {let raw} => nothing, since a let could be reassigned', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'let raw = 1;\nconst subject = raw;' });

      const result = readConstBindingLayerTransformer({ node: subjectOf({ sourceFile }), seen: [] });

      expect(result).toBe(undefined);
    });

    it('VALID: {a declaration already seen} => nothing, so a cycle stops', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'const raw = 1;\nconst subject = raw;' });

      const result = readConstBindingLayerTransformer({
        node: subjectOf({ sourceFile }),
        seen: [sourceFile.getVariableDeclarationOrThrow('raw')],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a function parameter} => nothing', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'export function f(raw: number): number {\n  const subject = raw;\n  return subject;\n}' });
      const node = sourceFile.getFunctionOrThrow('f').getVariableDeclarationOrThrow('subject').getInitializerOrThrow();

      const result = readConstBindingLayerTransformer({ node, seen: [] });

      expect(result).toBe(undefined);
    });

    it('VALID: {a declared const with no initializer} => nothing', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'declare const raw: number;\nconst subject = raw;' });

      const result = readConstBindingLayerTransformer({ node: subjectOf({ sourceFile }), seen: [] });

      expect(result).toBe(undefined);
    });

    it('VALID: {an identifier with no declaration} => nothing', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'const subject = missing;' });

      const result = readConstBindingLayerTransformer({ node: subjectOf({ sourceFile }), seen: [] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {a node that is not an identifier} => nothing', () => {
      readConstBindingLayerTransformerProxy();
      const sourceFile = parse({ source: 'const subject = 1 + 2;' });

      const result = readConstBindingLayerTransformer({ node: subjectOf({ sourceFile }), seen: [] });

      expect(result).toBe(undefined);
    });
  });
});
