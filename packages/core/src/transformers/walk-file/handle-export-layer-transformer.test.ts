import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';
import type { ExportDeclaration } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handleExportLayerTransformer } from './handle-export-layer-transformer';
import { handleExportLayerTransformerProxy } from './handle-export-layer-transformer.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const exportOf = ({ source }: { source: string }): ExportDeclaration =>
  new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.ExportDeclaration);

describe('handleExportLayerTransformer', () => {
  describe('the re-export edge it records', () => {
    it('VALID: {a renamed named re-export} => one reexport edge carrying the source name and alias', () => {
      handleExportLayerTransformerProxy();

      const result = handleExportLayerTransformer({
        node: exportOf({ source: "export { x, y as z } from './reexport';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        {
          kind: 'reexport',
          specifier: './reexport',
          bindings: [
            { kind: 'named', name: 'x' },
            { kind: 'named', name: 'y', alias: 'z' },
          ],
          line: 1,
          column: 1,
        },
      ]);
    });

    it('VALID: {a star re-export} => one reexport edge whose only binding forwards everything', () => {
      handleExportLayerTransformerProxy();

      const result = handleExportLayerTransformer({
        node: exportOf({ source: "export * from './star';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'reexport', specifier: './star', bindings: [{ kind: 'star' }], line: 1, column: 1 },
      ]);
    });
  });

  describe('a local export list with no source module', () => {
    it('VALID: {export { local } with no from} => records no edge', () => {
      handleExportLayerTransformerProxy();

      const result = handleExportLayerTransformer({
        node: exportOf({ source: 'const local = 1;\nexport { local };\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.moduleEdges).toStrictEqual([]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {a re-export} => no descents, branches, exits, calls, or scope of its own', () => {
      handleExportLayerTransformerProxy();

      const result = handleExportLayerTransformer({
        node: exportOf({ source: "export * from './star';\n" }),
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
