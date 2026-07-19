import { Project, SyntaxKind } from 'ts-morph';
import type { CallExpression } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleDynamicImportLayerAdapter } from './handle-dynamic-import-layer-adapter';
import { handleDynamicImportLayerAdapterProxy } from './handle-dynamic-import-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const dynamicImportOf = ({ source }: { source: string }): CallExpression =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

describe('handleDynamicImportLayerAdapter', () => {
  describe('the module edge it records', () => {
    it('VALID: {a dynamic import of a string literal} => an ordinary import edge carrying the literal specifier and no bindings', () => {
      handleDynamicImportLayerAdapterProxy();

      const result = handleDynamicImportLayerAdapter({
        node: dynamicImportOf({ source: "const a = import('./foo');\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'import', specifier: './foo', bindings: [], line: 1, column: 11 },
      ]);
    });

    it('VALID: {a dynamic import of a variable} => a dynamic edge with no specifier and no bindings', () => {
      handleDynamicImportLayerAdapterProxy();

      const result = handleDynamicImportLayerAdapter({
        node: dynamicImportOf({ source: 'declare const name: string;\nimport(name);\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([{ kind: 'dynamic', bindings: [], line: 2, column: 1 }]);
    });

    it('VALID: {a dynamic import of a call result} => a dynamic edge, no specifier', () => {
      handleDynamicImportLayerAdapterProxy();

      const result = handleDynamicImportLayerAdapter({
        node: dynamicImportOf({ source: 'declare const pick: () => string;\nimport(pick());\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([{ kind: 'dynamic', bindings: [], line: 2, column: 1 }]);
    });
  });

  describe('what it descends', () => {
    it('VALID: {a dynamic import} => descends its children so a scope inside the argument is still found', () => {
      handleDynamicImportLayerAdapterProxy();

      const result = handleDynamicImportLayerAdapter({
        node: dynamicImportOf({ source: 'declare const pick: () => string;\nimport(pick());\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'ImportKeyword',
        'CallExpression',
      ]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {a dynamic import} => no branches, exits, calls, or scope of its own', () => {
      handleDynamicImportLayerAdapterProxy();

      const result = handleDynamicImportLayerAdapter({
        node: dynamicImportOf({ source: "import('./foo');\n" }),
        context: MODULE_CONTEXT,
      });

      expect({
        branches: result.branches,
        exits: result.exits,
        calls: result.calls,
        opensScope: result.opensScope,
      }).toStrictEqual({ branches: [], exits: [], calls: [], opensScope: undefined });
    });
  });
});
