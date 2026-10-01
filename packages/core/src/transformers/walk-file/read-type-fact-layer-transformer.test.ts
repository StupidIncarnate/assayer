import { Project, ScriptTarget } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { TypeFactStub } from '../../contracts/type-fact/type-fact.stub';
import { readTypeFactLayerTransformer } from './read-type-fact-layer-transformer';
import { readTypeFactLayerTransformerProxy } from './read-type-fact-layer-transformer.proxy';

const SYMBOL_KEYED_SOURCE =
  'const k: unique symbol = Symbol();\nexport interface Keyed { [k]: number; plain: string }\nexport declare function f(): Keyed;\nexport function g(n: Keyed): void {}\nconst x: Keyed = { [k]: 1, plain: "a" };\n';

describe('readTypeFactLayerTransformer', () => {
  describe('primitive types', () => {
    it('VALID: {string param} => string fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: string): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'string' }));
    });

    it('VALID: {number param} => number fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {boolean param} => boolean fact, never a true|false union', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: boolean): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'boolean' }));
    });
  });

  describe('boolean-literal types', () => {
    it('VALID: {true param} => literal fact carrying true', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: true): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: true }));
    });

    it('VALID: {false param} => literal fact carrying false', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: false): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: false }));
    });

    it('VALID: {string | boolean param} => union whose boolean halves are literal facts', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: string | boolean): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'void' }));
    });

    // `any` ABSORBS a union, so the checker alone answers `any` for a parameter whose signature says
    // `Db | string`. With the DECLARATION in hand the fact carries what the signature says — which is
    // what a P1 invoice quotes back to the reader.
    it('VALID: {Db | string with the declaration, Db imported} => the declared text, not the collapsed any', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db | string): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'other', text: 'Db | string' }),
      );
    });

    it('VALID: {Db | string with no declaration in hand} => the checker rendering, which is all there is', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db | string): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'any' }));
    });

    // The collapse happens at every depth, so the declaration travels to every depth: an array ELEMENT
    // and an object PROPERTY both read their own type node.
    it('VALID: {(Db | string)[] with the declaration} => the element carries the declared text', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(rows: (Db | string)[]): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('rows');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'other', text: 'Db | string' } }),
      );
    });

    // `Config` is a plain type REFERENCE (never a union), so the checker has nothing to say about it in
    // the hermetic walk — the declaration is the only handle on what the signature meant, and it is the
    // foreign key a consume-time overlay resolves against.
    it('VALID: {imported type declared as a plain reference} => the other fact carries typeRef, the reference NAME', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\nexport function f(db: Db): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'other', text: 'Db', typeRef: 'Db' }),
      );
    });

    // `Box`'s own shape is opaque (imported), but its type ARGUMENT `Config` is declared same-file, so
    // the argument recurses through this SAME reader and comes back a full object fact — what the
    // declaration's type parameter stands for.
    it('VALID: {imported generic reference with a same-file type argument} => typeArgs carries the argument\'s own fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Box } from './box';\ninterface Config { mode: string }\nexport function f(b: Box<Config>): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('b');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'other',
          text: 'Box<Config>',
          typeRef: 'Box',
          typeArgs: [{ flavor: 'object', typeName: 'Config', properties: [{ name: 'mode', fact: { flavor: 'string' } }] }],
        }),
      );
    });

    it('VALID: {an object property declared Db | string} => the property carries the declared text', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "import type { Db } from './db';\ninterface Wire { store: Db | string }\nexport function f(wire: Wire): void {}\n",
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('wire');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function f(n: 'open' | 'closed'): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport function f(m: Mode.Fast): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 'fast' }));
    });

    it('VALID: {the whole enum as the declared type} => union whose members are each an enum-literal fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport function f(m: Mode): void {}\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(items: number[]): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('items').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'number' } }),
      );
    });
  });

  describe('callable types', () => {
    it('VALID: {function-typed param} => callable fact carrying the signature text, never a property-less object', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function f(report: (message: string) => string): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('report').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(message: string) => string' }),
      );
    });

    it('VALID: {function-typed return} => callable fact carrying the signature text', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function f(): (n: number) => string { return (n) => String(n); }\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(n: number) => string' }),
      );
    });

    it('VALID: {named interface carrying a call signature} => callable fact carrying the type NAME', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Hybrid { (n: number): string; tag: string }\nexport function f(h: Hybrid): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('h').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'callable', text: 'Hybrid' }));
    });

    it('VALID: {class with a method} => the method reads as a callable, never an object named after it', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class Runner { run(n: number): void {} }\n');
      const type = sourceFile.getClassOrThrow('Runner').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string; retries: number }\nexport function f(cfg: Config): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'type Config = { mode: string; retries: number };\nexport function f(cfg: Config): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Sink { write: (line: string) => string }\nexport function f(sink: Sink): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('sink').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Sink',
          properties: [{ name: 'write', fact: { flavor: 'callable', text: '(line: string) => string' } }],
        }),
      );
    });

    it('VALID: {anonymous inline object param} => keyless object fact enumerating its properties', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(o: { a: string; b: number }): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('o').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Tree { value: number; next: Tree }\nexport function f(t: Tree): void {}\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'interface Config { mode?: string }\nexport function f(cfg: Config): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
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
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'interface Empty {}\nexport function f(e: Empty): void {}\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('e').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'object', typeName: 'Empty', properties: [] }),
      );
    });
  });

  describe('tuple types', () => {
    // A tuple is fixed-length and HETEROGENEOUS: read as its own `tuple` flavor, one fact per position,
    // BEFORE the object branch — never as an anonymous object enumerating `0`, `1`, `length` and every
    // inherited `ReadonlyArray` method, which is what the same param read as an object.
    it('VALID: {readonly [string, number] param} => a tuple fact with one element fact per position', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(pair: readonly [string, number]): void {}\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }),
      );
    });

    // The non-`readonly` spelling has no TypeOperator wrapper around its TupleTypeNode, so the element
    // node lookup has to unwrap only when the wrapper is actually there.
    it('VALID: {[string, number] param, no readonly} => the same tuple fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(pair: [string, number]): void {}\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }),
      );
    });
  });

  describe('intersection types', () => {
    // An intersection of two same-file interfaces reads through the SAME branch as a plain object: the
    // checker's own `getProperties()` on the intersection already returns the MERGED members, so no
    // separate merge logic is needed. Keyless, because an inline `Ay & Bee` names no symbol of its own.
    it('VALID: {v: Ay & Bee, both same-file interfaces} => an object fact merging both shapes, no typeName', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export interface Ay { a: string }\nexport interface Bee { b: number }\nexport function f(v: Ay & Bee): void {}\n',
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('v');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          properties: [
            { name: 'a', fact: { flavor: 'string' } },
            { name: 'b', fact: { flavor: 'number' } },
          ],
        }),
      );
    });

    // A NAMED intersection (`type AB = Ay & Bee`) hangs its name on the ALIAS symbol, exactly as a
    // `type Config = { … }` object alias does — the same split §3 documents for a plain object.
    it('VALID: {type AB = Ay & Bee, referenced by name} => an object fact carrying the alias as typeName', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export interface Ay { a: string }\nexport interface Bee { b: number }\nexport type AB = Ay & Bee;\nexport function f(v: AB): void {}\n',
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('v');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'AB',
          properties: [
            { name: 'a', fact: { flavor: 'string' } },
            { name: 'b', fact: { flavor: 'number' } },
          ],
        }),
      );
    });
  });

  describe('template literal types', () => {
    // A template literal type with at least one non-literal-union substitution reads as its own
    // `template` flavor: the literal segments in source order, and one fact per substitution.
    it(`VALID: {t: \`id-\${string}\`} => a template fact with the literal segments and the string substitution`, () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', `export function f(t: \`id-\${string}\`): void {}\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] }),
      );
    });

    // Two substitutions: `texts` still carries exactly one more segment than there are substitutions,
    // with the middle segment landing between them.
    it(`VALID: {t: \`\${string}-\${number}!\`} => texts and types both carry two entries in source order`, () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', `export function f(t: \`\${string}-\${number}!\`): void {}\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'template',
          texts: ['', '-', '!'],
          types: [{ flavor: 'string' }, { flavor: 'number' }],
        }),
      );
    });

    // A template whose every substitution is a closed set of literals collapses to a plain UNION before
    // this adapter ever sees a template literal type — proof the `isUnion()` check above still runs
    // first, exactly as the file's own PURPOSE doc says.
    it(`VALID: {t: \`\${'a'|'b'}-x\`} => a union fact of the two literal strings, never a template fact`, () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', `export function f(t: \`\${'a'|'b'}-x\`): void {}\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readTypeFactLayerTransformer({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'union',
          members: [
            { flavor: 'literal', value: 'a-x' },
            { flavor: 'literal', value: 'b-x' },
          ],
          text: '"a-x" | "b-x"',
        }),
      );
    });
  });

  describe('widened literal bindings', () => {
    it('VALID: {const n = 7 with widen} => number fact rather than the literal', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const n = 7;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type, widen: true })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {const n = 7 without widen} => literal fact', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const n = 7;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('n').getType();

      expect(readTypeFactLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 7 }));
    });
  });

  describe('symbol-keyed properties', () => {
    it('VALID: {the same source read in two projects in one process} => names a symbol key by its declaration, identically both times', () => {
      readTypeFactLayerTransformerProxy();
      const firstProject = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
      });
      const secondProject = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
      });
      const firstSource = firstProject.createSourceFile('src/f.ts', SYMBOL_KEYED_SOURCE);
      const secondSource = secondProject.createSourceFile('src/f.ts', SYMBOL_KEYED_SOURCE);
      const keyed = TypeFactStub({
        flavor: 'object',
        typeName: 'Keyed',
        properties: [
          { name: '[k]', fact: TypeFactStub({ flavor: 'number' }) },
          { name: 'plain', fact: TypeFactStub({ flavor: 'string' }) },
        ],
      });

      expect({
        first: readTypeFactLayerTransformer({ type: firstSource.getFunctionOrThrow('g').getParameterOrThrow('n').getType() }),
        second: readTypeFactLayerTransformer({ type: secondSource.getFunctionOrThrow('g').getParameterOrThrow('n').getType() }),
      }).toStrictEqual({ first: keyed, second: keyed });
    });
  });

  describe('default library types', () => {
    it('VALID: {counts: Map<string, number>, read under ES2022 and under the defaults} => the same opaque reference both times, never its members', () => {
      readTypeFactLayerTransformerProxy();
      const es2022Project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
      });
      const defaultProject = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const source = 'export function tally(counts: Map<string, number>) { return counts; }\n';
      const es2022Param = es2022Project.createSourceFile('src/f.ts', source).getFunctionOrThrow('tally').getParameterOrThrow('counts');
      const defaultParam = defaultProject.createSourceFile('src/f.ts', source).getFunctionOrThrow('tally').getParameterOrThrow('counts');
      const opaque = TypeFactStub({
        flavor: 'other',
        text: 'Map<string, number>',
        typeRef: 'Map',
        typeArgs: [TypeFactStub({ flavor: 'string' }), TypeFactStub({ flavor: 'number' })],
      });

      expect({
        es2022: readTypeFactLayerTransformer({ type: es2022Param.getType(), typeNode: es2022Param.getTypeNodeOrThrow() }),
        defaults: readTypeFactLayerTransformer({ type: defaultParam.getType(), typeNode: defaultParam.getTypeNodeOrThrow() }),
      }).toStrictEqual({ es2022: opaque, defaults: opaque });
    });

    it('VALID: {config: Partial<Config>, a library mapped type over a local interface} => enumerates the local properties', () => {
      readTypeFactLayerTransformerProxy();
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
      });
      const param = project
        .createSourceFile('src/f.ts', 'interface Config { mode: string }\nexport function f(config: Partial<Config>) { return config; }\n')
        .getFunctionOrThrow('f')
        .getParameterOrThrow('config');

      expect(readTypeFactLayerTransformer({ type: param.getType() })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Partial',
          properties: [{ name: 'mode', fact: TypeFactStub({ flavor: 'string' }) }],
        }),
      );
    });
  });
});
