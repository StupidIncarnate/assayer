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

  describe('boolean-literal types', () => {
    it('VALID: {true param} => literal fact carrying true', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: true): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: true }));
    });

    it('VALID: {false param} => literal fact carrying false', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: false): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: false }));
    });

    it('VALID: {string | boolean param} => union whose boolean halves are literal facts', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: string | boolean): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'union',
          members: [{ flavor: 'string' }, { flavor: 'literal', value: false }, { flavor: 'literal', value: true }],
          text: 'string | boolean',
        }),
      );
    });
  });

  describe('enum-literal types', () => {
    it('VALID: {an enum-member param} => literal fact carrying the member\'s underlying value', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport declare function f(m: Mode.Fast): void;\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 'fast' }));
    });
  });

  describe('callable types', () => {
    it('VALID: {function-typed param} => callable fact carrying the rendered signature, never a property-less object', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export declare function f(report: (message: string) => string): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('report').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(message: string) => string' }),
      );
    });

    it('VALID: {named interface carrying a call signature} => callable fact carrying the type NAME', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Hybrid { (n: number): string; tag: string }\nexport declare function f(h: Hybrid): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('h').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'callable', text: 'Hybrid' }));
    });

    it('VALID: {class with a method} => the method reads as a callable, never an object named after it', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare class Runner { run(n: number): void }\nexport declare function f(r: Runner): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('r').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Runner',
          properties: [{ name: 'run', fact: { flavor: 'callable', text: '(n: number) => void' } }],
        }),
      );
    });
  });

  describe('numeric-literal types', () => {
    it('VALID: {a numeric-literal param} => literal fact carrying the number', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(n: 7): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 7 }));
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

    // No name lands on the fact at all — `typeName` is omitted, never an empty string — so an
    // anonymous shape and a named-but-empty interface stay distinguishable downstream.
    it('VALID: {inline anonymous-object param} => a keyless object fact enumerating its properties', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export declare function f(o: { mode: string; retries: number }): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('o').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          properties: [
            { name: 'mode', fact: { flavor: 'string' } },
            { name: 'retries', fact: { flavor: 'number' } },
          ],
        }),
      );
    });

    // The mark travels with the truncation, exactly as it does in the walk reader: without it the
    // re-entered `Tree` is indistinguishable from an interface that really declares nothing.
    it('VALID: {self-referential interface param} => the recursive property truncates to a MARKED reference-only object', () => {
      readSignatureTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Tree { value: number; next: Tree }\nexport declare function f(t: Tree): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t').getType();

      expect(readSignatureTypeLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Tree',
          properties: [
            { name: 'next', fact: { flavor: 'object', typeName: 'Tree', truncated: true, properties: [] } },
            { name: 'value', fact: { flavor: 'number' } },
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
