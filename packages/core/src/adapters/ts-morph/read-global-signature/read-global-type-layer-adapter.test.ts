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

  describe('a non-primitive object type', () => {
    it('VALID: {an interface reference} => an other fact carrying the checker text', () => {
      readGlobalTypeLayerAdapterProxy();

      expect(
        readGlobalTypeLayerAdapter({ type: typeOf({ source: 'interface Env { a: string }\nconst a: Env = { a: "x" };\n' }) }),
      ).toStrictEqual({ flavor: 'other', text: 'Env' });
    });
  });
});
