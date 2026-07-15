import { Project } from 'ts-morph';

import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleSourceFileLayerAdapter } from './handle-source-file-layer-adapter';
import { handleSourceFileLayerAdapterProxy } from './handle-source-file-layer-adapter.proxy';

const SEED = WalkContextStub({ scopePath: [], guardPath: [], params: [], exported: false });

const MODULE_SCOPE = ScopeRecordStub({
  scopePath: ['*module*'],
  name: '*module*',
  kind: 'module',
  exported: false,
  params: [],
  returnType: { kind: 'unknown', text: 'void' },
  line: 1,
});

describe('handleSourceFileLayerAdapter', () => {
  describe('the module scope it opens', () => {
    it('EMPTY: {empty file} => opens a parameterless void module scope at line 1', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', '');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.opensScope).toStrictEqual(MODULE_SCOPE);
    });

    it('EMPTY: {empty file} => its only exit is the file simply ending', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', '');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect({ branches: result.branches, exits: result.exits, nodes: result.nodes }).toStrictEqual({
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 1 }],
        nodes: [],
      });
    });

    it('VALID: {file ending in a return-covered if/else} => no completion exit of its own', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'declare const a: number;\nif (a > 1) {\n} else {\n}\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.exits).toStrictEqual([]);
    });
  });

  describe('the descents it asks for', () => {
    it('VALID: {two top-level statements} => one descent each, in source order', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'const a = 1;\nif (a > 0) {}\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'VariableStatement',
        'IfStatement',
      ]);
    });

    it('VALID: {top-level statement} => is handed the module scope path with an empty guard path', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'const a = 1;\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.descents.map((descent) => descent.context)).toStrictEqual([
        WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false }),
      ]);
    });
  });
});
