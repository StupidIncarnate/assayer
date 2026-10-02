import type { Node} from '#gateway/npm/ts-morph';
import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readCalleeLayerTransformer } from './read-callee-layer-transformer';
import { readCalleeLayerTransformerProxy } from './read-callee-layer-transformer.proxy';

// The expression of the file's first call, parsed exactly as the walk parses — an in-memory project
// with the standard library and NOTHING else, which is why imports resolve only to their in-file
// specifier and never to another file.
const calleeOf = ({ source }: { source: string }): Node =>
  new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
    .getExpression();

describe('readCalleeLayerTransformer', () => {
  describe('a same-file function declaration', () => {
    it('VALID: {a call to a function declared in this file} => a local link matched by name and line', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({
          source:
            'function inner(n: number): string {\n  return "x";\n}\n' +
            'export function outer(v: number): string {\n  return inner(v);\n}\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 1 });
    });

    it('VALID: {a call to a const-bound arrow} => a local link, the dominant function style resolving like any other', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({
          source:
            'const inner = (n: number): string => "x";\n' +
            'export const outer = (v: number): string => inner(v);\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 1 });
    });

    it('VALID: {a call to a const-bound function expression} => a local link on the same terms', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({
          source:
            'const inner = function (n: number): string {\n  return "x";\n};\n' +
            'export const outer = (v: number): string => inner(v);\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 1 });
    });

    // The scope the walk opened sits on the ARROW, not on the binding, so the line the link carries has
    // to be read there — otherwise a follower's `name + startLine` join finds no scope record at all.
    it('VALID: {a binding whose arrow starts on the next line} => the line of the arrow, not of the binding', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({
          source:
            'const inner =\n  (n: number): string => "x";\n' +
            'export const outer = (v: number): string => inner(v);\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'local', name: 'inner', startLine: 2 });
    });
  });

  describe('a call to an imported name', () => {
    it('VALID: {a named import} => an import link carrying the specifier and the imported name', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: "import { foo } from './other';\nexport const q = 1;\nfoo();\n" }),
      });

      expect(result).toStrictEqual({ target: 'import', specifier: './other', importedName: 'foo' });
    });

    it('VALID: {an aliased import} => the imported SOURCE name, never the local alias', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: "import { bar as baz } from './other';\nexport const q = 1;\nbaz();\n" }),
      });

      expect(result).toStrictEqual({ target: 'import', specifier: './other', importedName: 'bar' });
    });

    it('VALID: {a default import} => an import link with the imported name "default"', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: "import qux from './other';\nexport const q = 1;\nqux();\n" }),
      });

      expect(result).toStrictEqual({ target: 'import', specifier: './other', importedName: 'default' });
    });

    it('VALID: {a bare package import} => an import link carrying the package specifier', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: "import { readFileSync } from 'fs';\nexport const q = 1;\nreadFileSync('x');\n" }),
      });

      expect(result).toStrictEqual({ target: 'import', specifier: 'fs', importedName: 'readFileSync' });
    });
  });

  describe('callees the single-file parse cannot resolve', () => {
    it('VALID: {a namespace-member call} => unresolved, since the callee is not a plain identifier', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: "import * as ns from './other';\nexport const q = 1;\nns.member();\n" }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('VALID: {a method call} => unresolved, since the callee is not a plain identifier', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: 'export const q = 1;\nconst obj = { foo(): void {} };\nobj.foo();\n' }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('VALID: {a const bound to a non-function} => unresolved, calling it is not a call to a scope', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: 'const f = 5;\nexport const q = 1;\nf();\n' }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('VALID: {a let declared with no initializer} => unresolved, there is no function-like node to key on', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({ source: 'let f: () => void;\nexport const q = 1;\nf();\n' }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    it('EMPTY: {a callee that resolves to nothing} => unresolved', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({ callee: calleeOf({ source: 'export function outer(): void {\n  bar();\n}\n' }) });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    // Overload signatures share one SYMBOL across several declaration nodes, so `getDeclarations()`
    // returns more than one and there is no single declaration to resolve a link from.
    it('EDGE: {a call to an overloaded function} => unresolved, since its symbol carries MULTIPLE declarations', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({
        callee: calleeOf({
          source:
            'function f(a: number): void;\nfunction f(a: string): void;\nfunction f(a: unknown): void {}\nf(1);\n',
        }),
      });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });

    // The hermetic walk's project resolves the standard LIBRARY (§5.10), so a bare call to an ambient
    // global function (`parseInt`) is a real single-file-walk input whose declaration sits in
    // `lib.es5.d.ts` — a DIFFERENT source file from the one being walked. That is a genuine call
    // target the single-file parse cannot own, never a fabricated one: the walk parses no other
    // project file, so a declaration outside the file being walked is unresolved on principle, the
    // same as a namespace member or a method call above.
    it('VALID: {a call to an ambient global function} => unresolved, since its declaration lives OUTSIDE this file', () => {
      readCalleeLayerTransformerProxy();

      const result = readCalleeLayerTransformer({ callee: calleeOf({ source: "parseInt('1');\n" }) });

      expect(result).toStrictEqual({ target: 'unresolved' });
    });
  });
});
