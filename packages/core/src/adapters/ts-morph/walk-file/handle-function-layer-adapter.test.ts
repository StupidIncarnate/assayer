import { Project, SyntaxKind } from 'ts-morph';

import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleFunctionLayerAdapter } from './handle-function-layer-adapter';
import { handleFunctionLayerAdapterProxy } from './handle-function-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('handleFunctionLayerAdapter', () => {
  describe('the scope it opens', () => {
    it('VALID: {exported function} => opens a scope carrying its signature off the type graph', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  return "big";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope).toStrictEqual(ScopeRecordStub({ scopePath: ['*module*', 'classify'] }));
    });

    it('VALID: {scope it opens} => carries NO branches or exits, since those are found by descending', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({ branches: result.opensScope?.branches, exits: result.opensScope?.exits }).toStrictEqual({
        branches: [],
        exits: [],
      });
    });
  });

  describe('the context it hands its body', () => {
    it('VALID: {function} => extends the scope path by its name', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.scopePath)).toStrictEqual([['*module*', 'classify']]);
    });

    it('VALID: {function declared inside a guarded arm} => RESETS the guard path for its body', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const guarded = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [{ branchCoverageId: '*module*/if:id:flag', arm: 'then' }],
        params: [],
        exported: false,
      });

      const result = handleFunctionLayerAdapter({ node, context: guarded });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[]]);
    });

    it('VALID: {function} => hands its body its OWN params, not the enclosing scope’s', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const outer = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [],
        params: [{ name: 'other', type: { kind: 'string' } }],
        exported: false,
      });

      const result = handleFunctionLayerAdapter({ node, context: outer });

      expect(result.descents.map((descent) => descent.context.params)).toStrictEqual([
        [{ name: 'value', type: { kind: 'number' } }],
      ]);
    });

    it('VALID: {concise arrow} => descends its expression body', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const classify = (value: number): string => "big";\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['StringLiteral']);
    });

    it('EMPTY: {overload signature with no body} => asks for no descents', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function classify(value: number): string;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents).toStrictEqual([]);
    });
  });
});
