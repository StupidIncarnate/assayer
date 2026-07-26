import { Project, SyntaxKind } from 'ts-morph';
import type { Type } from 'ts-morph';

import { readGlobalTypeLayerAdapter } from './read-global-type-layer-adapter';
import { readGlobalTypeLayerAdapterProxy } from './read-global-type-layer-adapter.proxy';

// The type of the first declared const in the source — the reader's input.
const typeOf = ({ source }: { source: string }): Type =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration)
    .getType();

describe('readGlobalTypeLayerAdapter', () => {
  describe('primitive types', () => {
    it('VALID: {a string} => a string fact', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: "const a: string = 'x';\n" }) })).toStrictEqual({ flavor: 'string' });
    });

    it('VALID: {a number} => a number fact', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: number = 1;\n' }) })).toStrictEqual({ flavor: 'number' });
    });
  });

  describe('a numeric-literal type', () => {
    it('VALID: {7} => a literal fact carrying the number', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: 7 = 7;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: 7,
      });
    });
  });

  describe('a union of string literals', () => {
    it('VALID: {"a" | "b"} => a union of literal facts', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: "const a: 'a' | 'b' = 'a';\n" }) })).toStrictEqual({
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
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: true = true;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: true,
      });
    });

    it('VALID: {false} => a literal fact carrying false', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: false = false;\n' }) })).toStrictEqual({
        flavor: 'literal',
        value: false,
      });
    });

    it('VALID: {string | boolean} => a union whose boolean halves are literal facts', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: "const a: string | boolean = 'x';\n" }) })).toStrictEqual({
        flavor: 'union',
        members: [{ flavor: 'string' }, { flavor: 'literal', value: false }, { flavor: 'literal', value: true }],
        text: 'string | boolean',
      });
    });

    it('VALID: {boolean} => a boolean fact, never a true|false union', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: boolean = true;\n' }) })).toStrictEqual({
        flavor: 'boolean',
      });
    });
  });

  describe('an enum-literal type', () => {
    it('VALID: {Mode.Fast} => a literal fact carrying the member\'s underlying value', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(
        readGlobalTypeLayerAdapter({
          type: typeOf({ source: "enum Mode { Fast = 'fast', Slow = 'slow' }\nconst a: Mode.Fast = Mode.Fast;\n" }),
        }),
      ).toStrictEqual({ flavor: 'literal', value: 'fast' });
    });
  });

  describe('callable types', () => {
    it('VALID: {a function-typed binding} => a callable fact carrying the rendered signature', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(
        readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: (m: string) => string = (m) => m;\n' }) }),
      ).toStrictEqual({ flavor: 'callable', text: '(m: string) => string' });
    });

    it('VALID: {a named interface carrying a call signature} => a callable fact carrying the type NAME', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(
        readGlobalTypeLayerAdapter({
          type: typeOf({ source: 'interface Hybrid { (n: number): string; tag: string }\nconst a: Hybrid = null as never;\n' }),
        }),
      ).toStrictEqual({ flavor: 'callable', text: 'Hybrid' });
    });
  });

  describe('a non-primitive object type', () => {
    it('VALID: {an interface reference} => an other fact carrying the checker text', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(
        readGlobalTypeLayerAdapter({ type: typeOf({ source: 'interface Env { a: string }\nconst a: Env = { a: "x" };\n' }) }),
      ).toStrictEqual({ flavor: 'other', text: 'Env' });
    });
  });

  // An array carries one homogeneous element, never a set of members that would need their own probe,
  // so it is enumerated here despite the sibling doc's object policy — unlike an object, refusing to
  // enumerate it would make a builtin's plain `...args: string[]` unfillable (`unknown`) for no reason
  // the type itself gives.
  describe('an array type', () => {
    it('VALID: {a string array} => an array fact whose element is a string fact', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: string[] = [];\n' }) })).toStrictEqual({
        flavor: 'array',
        element: { flavor: 'string' },
      });
    });

    it('VALID: {a nested number array} => an array fact recursing into the nested element', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(readGlobalTypeLayerAdapter({ type: typeOf({ source: 'const a: number[][] = [];\n' }) })).toStrictEqual({
        flavor: 'array',
        element: { flavor: 'array', element: { flavor: 'number' } },
      });
    });
  });
});
