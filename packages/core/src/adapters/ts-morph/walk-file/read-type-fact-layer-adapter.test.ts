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

  describe('boolean-literal types', () => {
    it('VALID: {true param} => literal fact carrying true', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: true): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: true }));
    });

    it('VALID: {false param} => literal fact carrying false', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: false): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: false }));
    });

    it('VALID: {string | boolean param} => union whose boolean halves are literal facts', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: string | boolean): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'union',
          members: [{ flavor: 'string' }, { flavor: 'literal', value: false }, { flavor: 'literal', value: true }],
          text: 'string | boolean',
        }),
      );
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

    // `any` ABSORBS a union, so the checker alone answers `any` for a parameter whose signature says
    // `Db | string`. With the DECLARATION in hand the fact carries what the signature says — which is
    // what a P1 invoice quotes back to the reader.
    it('VALID: {Db | string with the declaration, Db imported} => the declared text, not the collapsed any', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db | string): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'other', text: 'Db | string' }),
      );
    });

    it('VALID: {Db | string with no declaration in hand} => the checker rendering, which is all there is', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db | string): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'any' }));
    });

    // The collapse happens at every depth, so the declaration travels to every depth: an array ELEMENT
    // and an object PROPERTY both read their own type node.
    it('VALID: {(Db | string)[] with the declaration} => the element carries the declared text', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(rows: (Db | string)[]): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('rows');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'other', text: 'Db | string' } }),
      );
    });

    // `Config` is a plain type REFERENCE (never a union), so the checker has nothing to say about it in
    // the hermetic walk — the declaration is the only handle on what the signature meant, and it is the
    // foreign key a consume-time overlay resolves against.
    it('VALID: {imported type declared as a plain reference} => the other fact carries typeRef, the reference NAME', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'other', text: 'Db', typeRef: 'Db' }),
      );
    });

    // `Box`'s own shape is opaque (imported), but its type ARGUMENT `Config` is declared same-file, so
    // the argument recurses through this SAME reader and comes back a full object fact — what the
    // declaration's type parameter stands for.
    it('VALID: {imported generic reference with a same-file type argument} => typeArgs carries the argument\'s own fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Box } from './box';\ninterface Config { mode: string }\nexport function f(b: Box<Config>): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('b');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'other',
          text: 'Box<Config>',
          typeRef: 'Box',
          typeArgs: [{ flavor: 'object', typeName: 'Config', properties: [{ name: 'mode', fact: { flavor: 'string' } }] }],
        }),
      );
    });

    it('VALID: {an object property declared Db | string} => the property carries the declared text', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\ninterface Wire { store: Db | string }\nexport function f(wire: Wire): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('wire');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Wire',
          properties: [{ name: 'store', fact: { flavor: 'other', text: 'Db | string' } }],
        }),
      );
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

  describe('enum-literal types', () => {
    it('VALID: {a single enum member as the declared type} => literal fact carrying its value', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport function f(m: Mode.Fast): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 'fast' }));
    });

    it('VALID: {the whole enum as the declared type} => union whose members are each an enum-literal fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport function f(m: Mode): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'union',
          members: [
            { flavor: 'literal', value: 'fast' },
            { flavor: 'literal', value: 'slow' },
          ],
          text: 'Mode',
        }),
      );
    });
  });

  describe('array types', () => {
    it('VALID: {number[] param} => array fact whose element is a number fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(items: number[]): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('items').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'number' } }),
      );
    });
  });

  describe('callable types', () => {
    it('VALID: {function-typed param} => callable fact carrying the signature text, never a property-less object', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function f(report: (message: string) => string): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('report').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(message: string) => string' }),
      );
    });

    it('VALID: {function-typed return} => callable fact carrying the signature text', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function f(): (n: number) => string { return (n) => String(n); }\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(n: number) => string' }),
      );
    });

    it('VALID: {named interface carrying a call signature} => callable fact carrying the type NAME', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Hybrid { (n: number): string; tag: string }\nexport function f(h: Hybrid): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('h').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(TypeFactStub({ flavor: 'callable', text: 'Hybrid' }));
    });

    it('VALID: {class with a method} => the method reads as a callable, never an object named after it', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class Runner { run(n: number): void {} }\n');
      const type = sourceFile.getClassOrThrow('Runner').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Runner',
          properties: [{ name: 'run', fact: { flavor: 'callable', text: '(n: number) => void' } }],
        }),
      );
    });
  });

  describe('object types', () => {
    it('VALID: {locally-declared interface param} => object fact carrying the type name and sorted properties', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string; retries: number }\nexport function f(cfg: Config): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
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

    // The two spellings of one concept. An alias hangs its name on the ALIAS symbol and leaves its
    // object symbol the anonymous `__type`, so reading only the object symbol spells it keyless — and a
    // keyless shape is the not-stubbed signal, which would make `type Config` behave unlike
    // `interface Config` for no reason a reader could see.
    it('VALID: {type-alias-to-object param} => the SAME named object fact the interface spelling gives', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'type Config = { mode: string; retries: number };\nexport function f(cfg: Config): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
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

    it('VALID: {interface with a function-typed member} => the member reads as a callable fact', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Sink { write: (line: string) => string }\nexport function f(sink: Sink): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('sink').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Sink',
          properties: [{ name: 'write', fact: { flavor: 'callable', text: '(line: string) => string' } }],
        }),
      );
    });

    it('VALID: {anonymous inline object param} => keyless object fact enumerating its properties', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(o: { a: string; b: number }): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('o').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          properties: [
            { name: 'a', fact: { flavor: 'string' } },
            { name: 'b', fact: { flavor: 'number' } },
          ],
        }),
      );
    });

    it('VALID: {self-referential interface param} => the recursive property truncates to a MARKED reference-only object', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Tree { value: number; next: Tree }\nexport function f(t: Tree): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
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

    // The checker WIDENS `mode?: string` to the same `string` a required property declares, so only the
    // DECLARATION can answer whether the shape marks it optional — the same reason a parameter's own
    // optionality is read off the parameter rather than its type.
    it('VALID: {interface with an optional property} => the property fact carries optional: true', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'interface Config { mode?: string }\nexport function f(cfg: Config): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Config',
          properties: [{ name: 'mode', fact: { flavor: 'string' }, optional: true }],
        }),
      );
    });

    // The mark is the WHOLE difference between the two property-less shapes: `Empty` declares no
    // properties and `{}` is a complete value of it, while the truncated `Tree` above declares two.
    it('EMPTY: {an empty interface param} => a property-less object fact carrying NO truncation mark', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'interface Empty {}\nexport function f(e: Empty): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('e').getType();

      expect(readTypeFactLayerAdapter({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'object', typeName: 'Empty', properties: [] }),
      );
    });
  });

  describe('tuple types', () => {
    // A tuple's numeric-index properties (`0`, `1`) and `length` carry no declaration of their own —
    // the checker synthesizes them structurally — AND the tuple type itself carries no symbol to fall
    // back to, so `declaration` stays undefined for exactly these three. `unknown` is what the reader
    // answers for a property with nowhere to read a type from; every inherited `ReadonlyArray` method
    // DOES carry its own declaration (in `lib.es5.d.ts`) and reads as a normal callable.
    it('VALID: {readonly [string, number] param} => the index and length properties read as unknown, the inherited methods as callables', () => {
      readTypeFactLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(pair: readonly [string, number]): void {}\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair');

      expect(readTypeFactLayerAdapter({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          properties: [
            { name: '0', fact: { flavor: 'other', text: 'unknown' } },
            { name: '1', fact: { flavor: 'other', text: 'unknown' } },
            {
              name: 'concat',
              fact: {
                flavor: 'callable',
                text: '{ (...items: ConcatArray<string | number>[]): (string | number)[]; (...items: (string | number | ConcatArray<string | number>)[]): (string | number)[]; }',
              },
            },
            {
              name: 'every',
              fact: {
                flavor: 'callable',
                text: '{ <S>(predicate: (value: string | number, index: number, array: readonly (string | number)[]) => value is S, thisArg?: any): this is readonly S[]; (predicate: (value: string | number, index: number, array: readonly (string | number)[]) => unknown, thisArg?: any): boolean; }',
              },
            },
            {
              name: 'filter',
              fact: {
                flavor: 'callable',
                text: '{ <S>(predicate: (value: string | number, index: number, array: readonly (string | number)[]) => value is S, thisArg?: any): S[]; (predicate: (value: string | number, index: number, array: readonly (string | number)[]) => unknown, thisArg?: any): (string | number)[]; }',
              },
            },
            {
              name: 'forEach',
              fact: {
                flavor: 'callable',
                text: '(callbackfn: (value: string | number, index: number, array: readonly (string | number)[]) => void, thisArg?: any) => void',
              },
            },
            {
              name: 'indexOf',
              fact: { flavor: 'callable', text: '(searchElement: string | number, fromIndex?: number) => number' },
            },
            { name: 'join', fact: { flavor: 'callable', text: '(separator?: string) => string' } },
            {
              name: 'lastIndexOf',
              fact: { flavor: 'callable', text: '(searchElement: string | number, fromIndex?: number) => number' },
            },
            { name: 'length', fact: { flavor: 'other', text: 'unknown' } },
            {
              name: 'map',
              fact: {
                flavor: 'callable',
                text: '<U>(callbackfn: (value: string | number, index: number, array: readonly (string | number)[]) => U, thisArg?: any) => U[]',
              },
            },
            {
              name: 'reduce',
              fact: {
                flavor: 'callable',
                text: '{ (callbackfn: (previousValue: string | number, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => string | number): string | number; (callbackfn: (previousValue: string | number, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => string | number, initialValue: string | number): string | number; <U>(callbackfn: (previousValue: U, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => U, initialValue: U): U; }',
              },
            },
            {
              name: 'reduceRight',
              fact: {
                flavor: 'callable',
                text: '{ (callbackfn: (previousValue: string | number, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => string | number): string | number; (callbackfn: (previousValue: string | number, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => string | number, initialValue: string | number): string | number; <U>(callbackfn: (previousValue: U, currentValue: string | number, currentIndex: number, array: readonly (string | number)[]) => U, initialValue: U): U; }',
              },
            },
            { name: 'slice', fact: { flavor: 'callable', text: '(start?: number, end?: number) => (string | number)[]' } },
            {
              name: 'some',
              fact: {
                flavor: 'callable',
                text: '(predicate: (value: string | number, index: number, array: readonly (string | number)[]) => unknown, thisArg?: any) => boolean',
              },
            },
            { name: 'toLocaleString', fact: { flavor: 'callable', text: '() => string' } },
            { name: 'toString', fact: { flavor: 'callable', text: '() => string' } },
          ],
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
