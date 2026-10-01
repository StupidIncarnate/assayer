import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import type { Type, TypeNode } from '#gateway/npm/ts-morph';

import { readGlobalTypeLayerBroker } from './read-global-type-layer-broker';
import { readGlobalTypeLayerBrokerProxy } from './read-global-type-layer-broker.proxy';

// The type of the first declared const in the source — the reader's input.
const typeOf = ({ source }: { source: string }): Type =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration)
    .getType();

// The type AND the declaring type node of the first declared const — what a real caller threads in for
// a called global's parameter/return, or a member access's own declaration.
const typeAndNodeOf = ({ source }: { source: string }): { type: Type; typeNode: TypeNode } => {
  const declaration = new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);

  return { type: declaration.getType(), typeNode: declaration.getTypeNodeOrThrow() };
};

describe('readGlobalTypeLayerBroker', () => {
  describe('primitive types', () => {
    it('VALID: {a string} => a string fact', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: "const a: string = 'x';\n" }) })).toStrictEqual({ flavor: 'string' });
    });

    it('VALID: {a number} => a number fact', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: number = 1;\n' }) })).toStrictEqual({ flavor: 'number' });
    });
  });

  describe('a numeric-literal type', () => {
    it('VALID: {7} => a literal fact carrying the number', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: 7 = 7;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: 7,
      });
    });
  });

  describe('a union of string literals', () => {
    it('VALID: {"a" | "b"} => a union of literal facts', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: "const a: 'a' | 'b' = 'a';\n" }) })).toStrictEqual({
        flavor: 'union',
        members: [
          { flavor: 'literal', value: 'a' },
          { flavor: 'literal', value: 'b' },
        ],
        text: '"a" | "b"',
      });
    });
  });

  describe('boolean-literal types', () => {
    it('VALID: {true} => a literal fact carrying true', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: true = true;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: true,
      });
    });

    it('VALID: {false} => a literal fact carrying false', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: false = false;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: false,
      });
    });

    it('VALID: {string | boolean} => a union whose boolean halves are literal facts', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: "const a: string | boolean = 'x';\n" }) })).toStrictEqual({
        flavor: 'union',
        members: [{ flavor: 'string' }, { flavor: 'literal', value: false }, { flavor: 'literal', value: true }],
        text: 'string | boolean',
      });
    });

    it('VALID: {boolean} => a boolean fact, never a true|false union', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: boolean = true;\n' }) })).toStrictEqual({
        flavor: 'boolean',
      });
    });
  });

  describe('an enum-literal type', () => {
    it('VALID: {Mode.Fast} => a literal fact carrying the member\'s underlying value', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(
        readGlobalTypeLayerBroker({
          type: typeOf({ source: "enum Mode { Fast = 'fast', Slow = 'slow' }\nconst a: Mode.Fast = Mode.Fast;\n" }),
        }),
      ).toStrictEqual({ flavor: 'literal', value: 'fast' });
    });
  });

  describe('callable types', () => {
    it('VALID: {a function-typed binding} => a callable fact carrying the rendered signature', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(
        readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: (m: string) => string = (m) => m;\n' }) }),
      ).toStrictEqual({ flavor: 'callable', text: '(m: string) => string' });
    });

    it('VALID: {a named interface carrying a call signature} => a callable fact carrying the type NAME', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(
        readGlobalTypeLayerBroker({
          type: typeOf({ source: 'interface Hybrid { (n: number): string; tag: string }\nconst a: Hybrid = null as never;\n' }),
        }),
      ).toStrictEqual({ flavor: 'callable', text: 'Hybrid' });
    });
  });

  describe('a non-primitive object type', () => {
    it('VALID: {an interface reference} => an other fact carrying the checker text', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(
        readGlobalTypeLayerBroker({ type: typeOf({ source: 'interface Env { a: string }\nconst a: Env = { a: "x" };\n' }) }),
      ).toStrictEqual({ flavor: 'other', text: 'Env' });
    });

    // An intersection reads as an object to the checker, and an ambient OBJECT shape is deliberately not
    // enumerated here (see the file's own PURPOSE doc), so an intersection stays opaque too, with no
    // separate branch needed — the same reason a plain interface reference stays opaque above.
    it('VALID: {v: Ay & Bee} => an other fact carrying the checker text, never a merged object', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(
        readGlobalTypeLayerBroker({
          type: typeOf({ source: 'interface Ay { a: string }\ninterface Bee { b: number }\nconst v: Ay & Bee = { a: "x", b: 1 };\n' }),
        }),
      ).toStrictEqual({ flavor: 'other', text: 'Ay & Bee' });
    });
  });

  // An array carries one homogeneous element, never a set of members that would need their own probe,
  // so it is enumerated here despite the sibling doc's object policy — unlike an object, refusing to
  // enumerate it would make a builtin's plain `...args: string[]` unfillable (`unknown`) for no reason
  // the type itself gives.
  describe('an array type', () => {
    it('VALID: {a string array} => an array fact whose element is a string fact', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: string[] = [];\n' }) })).toStrictEqual({
        flavor: 'array',
        element: { flavor: 'string' },
      });
    });

    it('VALID: {a nested number array} => an array fact recursing into the nested element', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'const a: number[][] = [];\n' }) })).toStrictEqual({
        flavor: 'array',
        element: { flavor: 'array', element: { flavor: 'number' } },
      });
    });
  });

  // A tuple is fixed-length and bounded, the same reason an array carries no per-member probe cost —
  // `process.hrtime()` really does return `[number, number]` in @types/node, so this is not hypothetical.
  describe('a tuple type', () => {
    it('VALID: {readonly [number, number], typeNode threaded} => a tuple fact with one element fact per position', () => {
      readGlobalTypeLayerBrokerProxy();
      const { type, typeNode } = typeAndNodeOf({ source: 'declare const a: readonly [number, number];\n' });

      expect(readGlobalTypeLayerBroker({ type, typeNode })).toStrictEqual({
        flavor: 'tuple',
        elements: [{ flavor: 'number' }, { flavor: 'number' }],
      });
    });

    it('VALID: {readonly [number, number], no typeNode threaded} => still a tuple fact', () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: 'declare const a: readonly [number, number];\n' }) })).toStrictEqual({
        flavor: 'tuple',
        elements: [{ flavor: 'number' }, { flavor: 'number' }],
      });
    });
  });

  describe('a template literal type', () => {
    // Needs the type NODE threaded in: the checker's `Type` API has nothing that decomposes a template
    // literal type's segments on its own — see the file's own PURPOSE doc.
    it(`VALID: {\`id-\${string}\`, typeNode threaded} => a template fact with the literal segments and the string substitution`, () => {
      readGlobalTypeLayerBrokerProxy();
      const { type, typeNode } = typeAndNodeOf({ source: `declare const a: \`id-\${string}\`;\n` });

      expect(readGlobalTypeLayerBroker({ type, typeNode })).toStrictEqual({
        flavor: 'template',
        texts: ['id-', ''],
        types: [{ flavor: 'string' }],
      });
    });

    it(`VALID: {\`id-\${string}\`, no typeNode threaded} => an opaque other fact carrying the checker text`, () => {
      readGlobalTypeLayerBrokerProxy();

      expect(readGlobalTypeLayerBroker({ type: typeOf({ source: `declare const a: \`id-\${string}\`;\n` }) })).toStrictEqual({
        flavor: 'other',
        text: `\`id-\${string}\``,
      });
    });

    // A template whose every substitution is a closed set of literals collapses to a plain UNION before
    // this adapter ever sees a template literal type — proof the `isUnion()` check runs first.
    it(`VALID: {\`\${'a'|'b'}-x\`} => a union fact of the two literal strings, never a template fact`, () => {
      readGlobalTypeLayerBrokerProxy();
      const { type, typeNode } = typeAndNodeOf({ source: `declare const a: \`\${'a'|'b'}-x\`;\n` });

      expect(readGlobalTypeLayerBroker({ type, typeNode })).toStrictEqual({
        flavor: 'union',
        members: [
          { flavor: 'literal', value: 'a-x' },
          { flavor: 'literal', value: 'b-x' },
        ],
        text: '"a-x" | "b-x"',
      });
    });
  });
});
