import { Project } from 'ts-morph';

import { TypeFactStub } from '../../../contracts/type-fact/type-fact.stub';
import { readSignatureTypeLayerAdapter } from './read-signature-type-layer-adapter';
import { readSignatureTypeLayerAdapterProxy } from './read-signature-type-layer-adapter.proxy';

describe('readSignatureTypeLayerAdapter', () => {
  describe('primitive types', () => {
    it('VALID: {string return} => string fact', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): string;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'string' }));
    });

    it('VALID: {number return} => number fact', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): number;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {boolean return} => boolean fact', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): boolean;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'boolean' }));
    });
  });

  describe('literal-union types', () => {
    it('VALID: {"open" | "closed" return} => union fact whose members are literal facts', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): "open" | "closed";\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
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

  describe('array types', () => {
    it('VALID: {string[] param} => array fact whose element is a string fact', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(items: string[]): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('items').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'string' } }),
      );
    });
  });

  describe('object types', () => {
    it('VALID: {locally-declared interface param} => object fact carrying the type name and sorted properties', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string; retries: number }\nexport declare function f(cfg: Config): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Config',
          properties: [
            { name: 'mode', fact: { flavor: 'string' } },
            { name: 'retries', fact: { flavor: 'number' } },
          ],
        }),
      );
    });
  });

  describe('opaque types', () => {
    it('VALID: {void return} => other fact carrying the type text', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'void' }));
    });
  });
});
