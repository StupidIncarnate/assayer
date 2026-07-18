import type { Node} from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';

import { readCallArgsLayerAdapter } from './read-call-args-layer-adapter';
import { readCallArgsLayerAdapterProxy } from './read-call-args-layer-adapter.proxy';

const argsOf = ({ source }: { source: string }): Node[] =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
    .getArguments();

describe('readCallArgsLayerAdapter', () => {
  describe('a parameter passed straight through', () => {
    it('VALID: {a call passing the caller`s own param} => a param-ref naming it', () => {
      readCallArgsLayerAdapterProxy();

      const result = readCallArgsLayerAdapter({
        args: argsOf({ source: 'function inner(n: number): void {}\nexport function outer(value: number): void {\n  inner(value);\n}\n' }),
      });

      expect(result).toStrictEqual([{ kind: 'param-ref', paramName: 'value' }]);
    });
  });

  describe('a mix of literals and opaque expressions', () => {
    it('VALID: {number, string, true, an expression, a non-param identifier} => each projected by what it is', () => {
      readCallArgsLayerAdapterProxy();

      const result = readCallArgsLayerAdapter({
        args: argsOf({
          source:
            'const g = 1;\nfunction f(): void {}\n' +
            'export function outer(value: number): void {\n  f(3, "x", true, value + 1, g);\n}\n',
        }),
      });

      expect(result).toStrictEqual([
        { kind: 'literal', value: 3 },
        { kind: 'literal', value: 'x' },
        { kind: 'literal', value: true },
        { kind: 'opaque' },
        { kind: 'opaque' },
      ]);
    });

    it('VALID: {a false literal} => a literal carrying false, distinct from an absent argument', () => {
      readCallArgsLayerAdapterProxy();

      const result = readCallArgsLayerAdapter({
        args: argsOf({ source: 'function f(): void {}\nexport function outer(): void {\n  f(false);\n}\n' }),
      });

      expect(result).toStrictEqual([{ kind: 'literal', value: false }]);
    });
  });

  describe('a call with no arguments', () => {
    it('EMPTY: {a call taking nothing} => no argument projections', () => {
      readCallArgsLayerAdapterProxy();

      const result = readCallArgsLayerAdapter({
        args: argsOf({ source: 'function f(): void {}\nexport function outer(): void {\n  f();\n}\n' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
