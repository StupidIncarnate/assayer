import { ModuleEdgeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { moduleGraphProjectionTransformer } from './module-graph-projection-transformer';

describe('moduleGraphProjectionTransformer', () => {
  describe('edges', () => {
    it('VALID: {walked with one module edge} => surfaces it verbatim as an edge', () => {
      const walked = WalkFileResultStub({ moduleEdges: [ModuleEdgeStub()] });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({
        edges: [{ kind: 'import', specifier: './other', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 }],
        references: [],
        globalUses: [],
        envReads: [],
      });
    });
  });

  describe('global uses', () => {
    it('VALID: {walked with repeated global uses} => deduped by (name, member, called), first position kept', () => {
      const walked = WalkFileResultStub({
        globalUses: [
          { name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 2, column: 3 },
          { name: 'process', member: 'env', called: false, args: [], line: 4, column: 5 },
          { name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 6, column: 3 },
        ],
      });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({
        edges: [],
        references: [],
        globalUses: [
          { name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 2, column: 3 },
          { name: 'process', member: 'env', called: false, args: [], line: 4, column: 5 },
        ],
        envReads: [],
      });
    });
  });

  describe('env reads', () => {
    it('VALID: {walked with repeated env reads} => deduped by (property, literals), first kept', () => {
      const walked = WalkFileResultStub({
        envReads: [
          { property: 'MODE', literals: ['production'] },
          { property: 'CODE', literals: [] },
          { property: 'MODE', literals: ['production'] },
        ],
      });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({
        edges: [],
        references: [],
        globalUses: [],
        envReads: [
          { property: 'MODE', literals: ['production'] },
          { property: 'CODE', literals: [] },
        ],
      });
    });
  });

  describe('references', () => {
    it('VALID: {import calls, one repeated, one local} => one reference per (specifier, importedName), first position kept', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            calls: [
              CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'foo' }, position: { line: 5, column: 10 } }),
              CallSiteStub({ callee: { target: 'local', name: 'helper', startLine: 2 }, position: { line: 6, column: 3 } }),
              CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'foo' }, position: { line: 7, column: 3 } }),
              CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'bar' }, position: { line: 8, column: 3 } }),
            ],
          }),
        ],
      });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({
        edges: [],
        references: [
          { specifier: './y', importedName: 'foo', line: 5, column: 10 },
          { specifier: './y', importedName: 'bar', line: 8, column: 3 },
        ],
        globalUses: [],
        envReads: [],
      });
    });

    it('VALID: {the same imported name called from two scopes} => deduped across scopes, keeping the first', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            name: 'first',
            calls: [CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'foo' }, position: { line: 3, column: 3 } })],
          }),
          ScopeRecordStub({
            name: 'second',
            calls: [CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'foo' }, position: { line: 9, column: 3 } })],
          }),
        ],
      });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({
        edges: [],
        references: [{ specifier: './y', importedName: 'foo', line: 3, column: 3 }],
        globalUses: [],
        envReads: [],
      });
    });

    it('EMPTY: {only unresolved and local calls} => no references', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            calls: [
              CallSiteStub({ callee: { target: 'unresolved' }, position: { line: 2, column: 3 } }),
              CallSiteStub({ callee: { target: 'local', name: 'helper', startLine: 2 }, position: { line: 3, column: 3 } }),
            ],
          }),
        ],
      });

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({ edges: [], references: [], globalUses: [], envReads: [] });
    });
  });

  describe('a failed parse', () => {
    it('ERROR: {walked success false} => an empty module graph', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 1, column: 1, message: 'boom' },
      } as never);

      const result = moduleGraphProjectionTransformer({ walked });

      expect(result).toStrictEqual({ edges: [], references: [], globalUses: [], envReads: [] });
    });
  });

  describe('determinism', () => {
    it('VALID: {the same walked projected twice} => byte-identical module graphs', () => {
      const walked = WalkFileResultStub({
        moduleEdges: [ModuleEdgeStub()],
        scopes: [
          ScopeRecordStub({
            calls: [
              CallSiteStub({ callee: { target: 'import', specifier: './y', importedName: 'foo' }, position: { line: 5, column: 10 } }),
              CallSiteStub({ callee: { target: 'import', specifier: './z', importedName: 'bar' }, position: { line: 6, column: 3 } }),
            ],
          }),
        ],
      });

      const first = moduleGraphProjectionTransformer({ walked });
      const second = moduleGraphProjectionTransformer({ walked });

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });
  });
});
