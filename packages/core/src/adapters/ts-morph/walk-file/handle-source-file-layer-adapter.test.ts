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
  // A module scope is reached by IMPORTING it, which runs it. Whether that proves anything — does it
  // read an input? — is a separate question the projections ask, and access must not answer.
  access: { kind: 'module' },
  params: [],
  returnType: { kind: 'unknown', text: 'void' },
  startLine: 1,
  endLine: 1,
});

describe('handleSourceFileLayerAdapter', () => {
  describe('the module scope it opens', () => {
    it('EMPTY: {empty file} => opens a parameterless void module scope spanning line 1', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', '');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.opensScope).toStrictEqual(MODULE_SCOPE);
    });

    it('VALID: {four-line file} => the module scope it opens spans the whole file', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'const a = 1;\n\nif (a > 0) {\n}\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect({ startLine: result.opensScope?.startLine, endLine: result.opensScope?.endLine }).toStrictEqual({
        startLine: 1,
        endLine: 5,
      });
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

    // The exit and its probe are minted together, so an observation cannot key under an id the
    // analyzer never produced. The site is the FILE, and `complete` is what says "append the probe"
    // — the module finishing has no expression to wrap.
    it('EMPTY: {empty file} => the file-end exit carries a completion probe site keyed to its own id', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', '');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.probeSites).toStrictEqual([{ id: '*module*/exit@top', kind: 'complete', start: 0, end: 0 }]);
    });

    it('VALID: {file ending in a return-covered if/else} => no completion exit of its own', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'declare const a: number;\nif (a > 1) {\n} else {\n}\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.exits).toStrictEqual([]);
    });

    // No exit means no probe: an unowed observation would fire under an id nothing predicted.
    it('VALID: {file ending in a return-covered if/else} => no completion probe site either', () => {
      handleSourceFileLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'declare const a: number;\nif (a > 1) {\n} else {\n}\n');

      const result = handleSourceFileLayerAdapter({ node, context: SEED });

      expect(result.probeSites).toStrictEqual([]);
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
