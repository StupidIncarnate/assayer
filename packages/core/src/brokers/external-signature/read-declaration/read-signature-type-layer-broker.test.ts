import { Project } from '#gateway/npm/ts-morph';

import { TypeFactStub } from '../../../contracts/type-fact/type-fact.stub';
import { readSignatureTypeLayerBroker } from './read-signature-type-layer-broker';
import { readSignatureTypeLayerBrokerProxy } from './read-signature-type-layer-broker.proxy';

describe('readSignatureTypeLayerBroker', () => {
  describe('primitive types', () => {
    it('VALID: {string return} => string fact', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): string;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'string' }));
    });

    it('VALID: {number return} => number fact', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): number;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {boolean return} => boolean fact', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): boolean;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'boolean' }));
    });
  });

  describe('boolean-literal types', () => {
    it('VALID: {true param} => literal fact carrying true', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: true): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: true }));
    });

    it('VALID: {false param} => literal fact carrying false', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: false): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: false }));
    });

    it('VALID: {string | boolean param} => union whose boolean halves are literal facts', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(flag: string | boolean): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('flag').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "enum Mode { Fast = 'fast', Slow = 'slow' }\nexport declare function f(m: Mode.Fast): void;\n",
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('m').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 'fast' }));
    });
  });

  describe('callable types', () => {
    it('VALID: {function-typed param} => callable fact carrying the rendered signature, never a property-less object', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export declare function f(report: (message: string) => string): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('report').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(message: string) => string' }),
      );
    });

    it('VALID: {named interface carrying a call signature} => callable fact carrying the type NAME', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Hybrid { (n: number): string; tag: string }\nexport declare function f(h: Hybrid): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('h').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'callable', text: 'Hybrid' }));
    });

    it('VALID: {class with a method} => the method reads as a callable, never an object named after it', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare class Runner { run(n: number): void }\nexport declare function f(r: Runner): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('r').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(n: 7): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 7 }));
    });
  });

  describe('literal-union types', () => {
    it('VALID: {"open" | "closed" return} => union fact whose members are literal facts', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): "open" | "closed";\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(items: string[]): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('items').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'string' } }),
      );
    });
  });

  describe('object types', () => {
    it('VALID: {locally-declared interface param} => object fact carrying the type name and sorted properties', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string; retries: number }\nexport declare function f(cfg: Config): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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

    // A `type X = { … }` alias names an ANONYMOUS `__type` object symbol and hangs the real name on the
    // ALIAS symbol instead — the same split the walk reader (`read-type-fact-layer-transformer`) resolves.
    // Reading only the raw symbol would spell every alias-declared external shape keyless and drop it
    // out of the stub index, which keys on `typeName`.
    it('VALID: {a type-alias object param} => the ALIAS name, not the anonymous __type symbol', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'type Config = { mode: string; retries: number };\nexport declare function f(cfg: Config): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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

    // `optional` is a fact about the PROPERTY's declaration, never about its type — the checker widens
    // `retries?: number` to the same `number` a required property declares. The walk reader carries it
    // through; this sibling must too, or a truly-optional external property reads as required and an
    // otherwise-fillable object gets refused over a property nobody owes a value.
    it('VALID: {an optional property} => carries optional: true, a required sibling carries nothing', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: { strict: false } });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode?: string; retries: number }\nexport declare function f(cfg: Config): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cfg').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Config',
          properties: [
            { name: 'mode', fact: { flavor: 'string' }, optional: true },
            { name: 'retries', fact: { flavor: 'number' } },
          ],
        }),
      );
    });

    // No name lands on the fact at all — `typeName` is omitted, never an empty string — so an
    // anonymous shape and a named-but-empty interface stay distinguishable downstream.
    it('VALID: {inline anonymous-object param} => a keyless object fact enumerating its properties', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export declare function f(o: { mode: string; retries: number }): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('o').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Tree { value: number; next: Tree }\nexport declare function f(t: Tree): void;\n',
      );
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
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

  describe('tuple types', () => {
    // A tuple is fixed-length and HETEROGENEOUS: read as its own `tuple` flavor, one fact per position,
    // BEFORE the object branch. Without this branch the same param would read as an anonymous object
    // enumerating `0`, `1`, `length` and every inherited `ReadonlyArray` method — a multi-thousand-
    // character dump, both here and in the P1 message `input-gap` builds from this fact.
    it('VALID: {readonly [string, number] param} => a tuple fact with one element fact per position', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(pair: readonly [string, number]): void;\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair');

      expect(readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }),
      );
    });

    // The non-`readonly` spelling has no TypeOperator wrapper around its TupleTypeNode, so the element
    // node lookup has to unwrap only when the wrapper is actually there.
    it('VALID: {[string, number] param, no readonly} => the same tuple fact', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(pair: [string, number]): void;\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair');

      expect(readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }),
      );
    });

    // Without the type node threaded (a caller that has not been updated to supply one) a tuple still
    // reads as a tuple fact: `getTupleElements()` comes off the TYPE alone, unlike the template-literal
    // branch below which genuinely needs the node.
    it('VALID: {readonly [string, number] param, no typeNode threaded} => still a tuple fact', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(pair: readonly [string, number]): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('pair').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }),
      );
    });
  });

  describe('intersection types', () => {
    // An intersection of two same-file interfaces reads through the SAME branch as a plain object: the
    // checker's own `getProperties()` on the intersection already returns the MERGED members, so no
    // separate merge logic is needed. Keyless, because an inline `Ay & Bee` names no symbol of its own.
    it('VALID: {v: Ay & Bee, both same-file interfaces} => an object fact merging both shapes, no typeName', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Ay { a: string }\ninterface Bee { b: number }\nexport declare function f(v: Ay & Bee): void;\n',
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('v');

      expect(readSignatureTypeLayerBroker({ type: param.getType() })).toStrictEqual(
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
    // `type Config = { … }` object alias does.
    it('VALID: {type AB = Ay & Bee, referenced by name} => an object fact carrying the alias as typeName', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Ay { a: string }\ninterface Bee { b: number }\ntype AB = Ay & Bee;\nexport declare function f(v: AB): void;\n',
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('v');

      expect(readSignatureTypeLayerBroker({ type: param.getType() })).toStrictEqual(
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
    // `template` flavor: the literal segments in source order, and one fact per substitution. This needs
    // the type NODE threaded in, because the checker's `Type` API has nothing that decomposes a template
    // literal type's segments on its own — see the file's own PURPOSE doc.
    it(`VALID: {t: \`id-\${string}\`} => a template fact with the literal segments and the string substitution`, () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', `export declare function f(t: \`id-\${string}\`): void;\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] }),
      );
    });

    // Two substitutions: `texts` still carries exactly one more segment than there are substitutions,
    // with the middle segment landing between them.
    it(`VALID: {t: \`\${string}-\${number}!\`} => texts and types both carry two entries in source order`, () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', `export declare function f(t: \`\${string}-\${number}!\`): void;\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
        TypeFactStub({
          flavor: 'template',
          texts: ['', '-', '!'],
          types: [{ flavor: 'string' }, { flavor: 'number' }],
        }),
      );
    });

    // A template whose every substitution is a closed set of literals collapses to a plain UNION before
    // this adapter ever sees a template literal type — proof the `isUnion()` check runs first.
    it(`VALID: {t: \`\${'a'|'b'}-x\`} => a union fact of the two literal strings, never a template fact`, () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', `export declare function f(t: \`\${'a'|'b'}-x\`): void;\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t');

      expect(readSignatureTypeLayerBroker({ type: param.getType(), typeNode: param.getTypeNodeOrThrow() })).toStrictEqual(
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

    // Without a type node (a position nothing threads one into, such as a union member) the checker's
    // `Type` alone cannot decompose a template literal type, so it stays opaque rather than guessing.
    it(`VALID: {t: \`id-\${string}\`, no typeNode threaded} => an opaque other fact carrying the checker text`, () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', `export declare function f(t: \`id-\${string}\`): void;\n`);
      const type = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('t').getType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: `\`id-\${string}\`` }));
    });
  });

  describe('opaque types', () => {
    it('VALID: {void return} => other fact carrying the type text', () => {
      readSignatureTypeLayerBrokerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export declare function f(): void;\n');
      const type = sourceFile.getFunctionOrThrow('f').getReturnType();

      expect(readSignatureTypeLayerBroker({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'void' }));
    });
  });
});
