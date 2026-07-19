import { Project, SyntaxKind } from 'ts-morph';
import type { VariableStatement } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleVariableLayerAdapter } from './handle-variable-layer-adapter';
import { handleVariableLayerAdapterProxy } from './handle-variable-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const variableOf = ({ source }: { source: string }): VariableStatement =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);

describe('handleVariableLayerAdapter', () => {
  describe('the value use it records', () => {
    it('VALID: {const bound to an imported name} => one import value use naming the specifier and imported name', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: "import { sep } from 'node:path';\nexport const separator = sep;\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([{ target: 'import', specifier: 'node:path', importedName: 'sep' }]);
    });

    it('VALID: {const bound to a same-file function} => one local value use keyed by name and start line', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'function local(): void {}\nconst g = local;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([{ target: 'local', name: 'local', startLine: 1 }]);
    });

    it('VALID: {const bound to a bare ambient global} => one global value use with no member', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'const p = process;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([{ target: 'global', name: 'process' }]);
    });

    it('VALID: {const bound to an ambient global member access} => one global value use with the member', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'const e = process.env;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([{ target: 'global', name: 'process', member: 'env' }]);
    });

    it('EMPTY: {const bound to a literal} => no value use, since a literal references no binding', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'const x = 5;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([]);
    });

    it('EMPTY: {const bound to a call} => no value use, since a call is not a value reference', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'declare function f(): number;\nconst y = f();\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.valueUses).toStrictEqual([]);
    });
  });

  describe('the exported bindings it records', () => {
    it('VALID: {export const separator = sep} => one exported binding naming the declared const', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: "import { sep } from 'node:path';\nexport const separator = sep;\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.exportedBindings).toStrictEqual(['separator']);
    });

    it('VALID: {export const a = 1, b = 2} => one exported binding per declaration', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'export const a = 1, b = 2;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.exportedBindings).toStrictEqual(['a', 'b']);
    });

    it('EMPTY: {an unexported const} => no exported binding', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'const x = 5;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.exportedBindings).toStrictEqual([]);
    });
  });

  describe('what it descends and does NOT contribute', () => {
    it('VALID: {const bound to an arrow function} => still descends its children so the inner scope is found', () => {
      handleVariableLayerAdapterProxy();

      const result = handleVariableLayerAdapter({
        node: variableOf({ source: 'const f = (n: number): number => n;\n' }),
        context: MODULE_CONTEXT,
      });

      expect({
        descents: result.descents.map((descent) => descent.node.getKindName()),
        branches: result.branches,
        exits: result.exits,
        calls: result.calls,
        valueUses: result.valueUses,
        opensScope: result.opensScope,
      }).toStrictEqual({
        descents: ['VariableDeclarationList'],
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        opensScope: undefined,
      });
    });
  });
});
