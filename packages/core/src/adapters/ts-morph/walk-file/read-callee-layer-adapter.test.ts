import type { Node} from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';

import { readCalleeLayerAdapter } from './read-callee-layer-adapter';
import { readCalleeLayerAdapterProxy } from './read-callee-layer-adapter.proxy';

// The expression of the file's first call, parsed exactly as the walk parses — an in-memory project
// with the standard library and NOTHING else, which is why imports resolve only to their in-file
// specifier and never to another file.
const calleeOf = ({ source }: { source: string }): Node =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
    .getExpression();

describe('readCalleeLayerAdapter', () => {
  describe('a same-file function declaration', () => {
    it('VALID: {a call to a function declared in this file} => a local link matched by name and line', () => {
      readCalleeLayerAdapterProxy();

      const result = readCalleeLayerAdapter({
        callee: calleeOf({
          source:
            'function inner(n: number): string {\n  return "x";\n}\n' +
            'export function outer(v: number): string {\n  return inner(v);\n}\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 1 });
    });
  });

  describe('callees the single-file parse cannot resolve to a same-file function', () => {
    it('VALID: {an imported callee} => unresolved, since the callee lives in another file', () => {
      readCalleeLayerAdapterProxy();

      const result = readCalleeLayerAdapter({
        callee: calleeOf({ source: "import { foo } from './other';\nexport const q = 1;\nfoo();\n" }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('VALID: {a method call} => unresolved, since the callee is not a plain identifier', () => {
      readCalleeLayerAdapterProxy();

      const result = readCalleeLayerAdapter({
        callee: calleeOf({ source: 'export const q = 1;\nconst obj = { foo(): void {} };\nobj.foo();\n' }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('VALID: {an arrow bound to a const} => unresolved, a shape v1 does not drive through its caller', () => {
      readCalleeLayerAdapterProxy();

      const result = readCalleeLayerAdapter({
        callee: calleeOf({ source: 'const f = (): void => {};\nexport const q = 1;\nf();\n' }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('EMPTY: {a callee that resolves to nothing} => unresolved', () => {
      readCalleeLayerAdapterProxy();

      const result = readCalleeLayerAdapter({ callee: calleeOf({ source: 'export function outer(): void {\n  bar();\n}\n' }) });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });
  });
});
