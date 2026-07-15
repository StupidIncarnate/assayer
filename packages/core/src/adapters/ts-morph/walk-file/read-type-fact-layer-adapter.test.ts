import { Project } from 'ts-morph';

import { TypeFactStub } from '../../../contracts/type-fact/type-fact.stub';
import { readTypeFactLayerAdapter } from './read-type-fact-layer-adapter';
import { readTypeFactLayerAdapterProxy } from './read-type-fact-layer-adapter.proxy';

describe('readTypeFactLayerAdapter', () => {
  describe('primitive types', () => {
    it('VALID: {string param} => string fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: string): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'string' }));
    });

    it('VALID: {number param} => number fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {boolean param} => boolean fact, never a true|false union', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: boolean): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'boolean' }));
    });
  });

  describe('opaque types', () => {
    it('VALID: {void return} => other fact carrying the type text', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'void' }));
    });
  });

  describe('literal-union types', () => {
    it('VALID: {union param} => union fact whose members are literal facts', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function f(n: 'open' | 'closed'): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'union',
          members: [
            { flavor: 'literal', value: 'open' },
            { flavor: 'literal', value: 'closed' },
          ],
          text: '"open" | "closed"',
        }),
      );
    });
  });

  describe('widened literal bindings', () => {
    it('VALID: {const n = 7 with widen} => number fact rather than the literal', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const n = 7;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type, widen: true })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {const n = 7 without widen} => literal fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const n = 7;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 7 }));
    });
  });
});
