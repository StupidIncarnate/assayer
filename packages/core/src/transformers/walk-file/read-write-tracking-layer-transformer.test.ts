import type { Node} from '#gateway/npm/ts-morph';
import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readWriteTrackingLayerTransformer } from './read-write-tracking-layer-transformer';
import { readWriteTrackingLayerTransformerProxy } from './read-write-tracking-layer-transformer.proxy';

// The declaration the source names, whether it is a variable or a parameter.
const declarationOf = ({ source, name }: { source: string; name: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);
  const found = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.Parameter),
  ].find((declaration) => declaration.getName() === name);

  if (found === undefined) {
    throw new Error(`no declaration named ${name}`);
  }

  return found;
};

describe('readWriteTrackingLayerTransformer', () => {
  describe('a variable no write can change', () => {
    it('VALID: {a const} => followed, since a const has no writes', () => {
      readWriteTrackingLayerTransformerProxy();

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source: 'const level = 7;', name: 'level' }) });

      expect(result).toBe(true);
    });

    it('VALID: {a let never written again} => followed', () => {
      readWriteTrackingLayerTransformerProxy();

      const result = readWriteTrackingLayerTransformer({
        declaration: declarationOf({ source: 'function f(n: number) { let data = n; return data; }', name: 'data' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('a write the walk follows', () => {
    it('VALID: {an assignment statement in an arm of an if} => followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = "function f(n: string) { let data = n; if (n === 'a') { data = 'b'; } return data; }";

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(true);
    });

    it('VALID: {a parameter assigned in the function body} => followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = "function f(n: string) { if (n === 'a') n = 'b'; return n; }";

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'n' }) });

      expect(result).toBe(true);
    });
  });

  describe('a write the walk does not follow', () => {
    it('VALID: {a write inside a loop} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = 'function f(n: number) { let data = n; for (let i = 0; i < 3; i += 1) { data = i; } return data; }';

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(false);
    });

    it('VALID: {a compound assignment} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = 'function f(n: number) { let data = n; data += 1; return data; }';

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(false);
    });

    it('VALID: {a write from a nested function} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = 'function f(n: number) { let data = n; const reset = () => { data = 0; }; reset(); return data; }';

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(false);
    });

    it('VALID: {an increment} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = 'function f(n: number) { let data = n; data++; return data; }';

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(false);
    });

    it('VALID: {a write inside a switch clause} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();
      const source = 'function f(n: number) { let data = n; switch (n) { case 1: data = 2; break; default: break; } return data; }';

      const result = readWriteTrackingLayerTransformer({ declaration: declarationOf({ source, name: 'data' }) });

      expect(result).toBe(false);
    });

    it('VALID: {a var} => not followed', () => {
      readWriteTrackingLayerTransformerProxy();

      const result = readWriteTrackingLayerTransformer({
        declaration: declarationOf({ source: 'function f(n: number) { var data = n; return data; }', name: 'data' }),
      });

      expect(result).toBe(false);
    });
  });
});
