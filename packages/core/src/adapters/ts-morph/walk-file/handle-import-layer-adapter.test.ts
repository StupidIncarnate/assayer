import { Project, SyntaxKind } from 'ts-morph';
import type { ImportDeclaration } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleImportLayerAdapter } from './handle-import-layer-adapter';
import { handleImportLayerAdapterProxy } from './handle-import-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const importOf = ({ source }: { source: string }): ImportDeclaration =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.ImportDeclaration);

describe('handleImportLayerAdapter', () => {
  describe('the module edge it records', () => {
    it('VALID: {a default plus renamed named import} => one import edge carrying every binding and its position', () => {
      handleImportLayerAdapterProxy();

      const result = handleImportLayerAdapter({
        node: importOf({ source: "import def, { foo, bar as baz } from './named';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        {
          kind: 'import',
          specifier: './named',
          bindings: [
            { kind: 'default', local: 'def' },
            { kind: 'named', name: 'foo' },
            { kind: 'named', name: 'bar', alias: 'baz' },
          ],
          line: 1,
          column: 1,
        },
      ]);
    });

    it('VALID: {a namespace import} => one import edge whose binding names the whole module', () => {
      handleImportLayerAdapterProxy();

      const result = handleImportLayerAdapter({
        node: importOf({ source: "import * as ns from './ns';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'import', specifier: './ns', bindings: [{ kind: 'namespace', local: 'ns' }], line: 1, column: 1 },
      ]);
    });

    it('EMPTY: {a side-effect import} => one import edge with no bindings', () => {
      handleImportLayerAdapterProxy();

      const result = handleImportLayerAdapter({
        node: importOf({ source: "import './side-effect';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'import', specifier: './side-effect', bindings: [], line: 1, column: 1 },
      ]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {an import} => no descents, branches, exits, calls, or scope of its own', () => {
      handleImportLayerAdapterProxy();

      const result = handleImportLayerAdapter({
        node: importOf({ source: "import { foo } from './named';\n" }),
        context: MODULE_CONTEXT,
      });

      expect({
        descents: result.descents,
        branches: result.branches,
        exits: result.exits,
        calls: result.calls,
        opensScope: result.opensScope,
      }).toStrictEqual({ descents: [], branches: [], exits: [], calls: [], opensScope: undefined });
    });
  });
});
