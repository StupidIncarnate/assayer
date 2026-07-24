import { ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { crossFileMapReachesTransformer } from './cross-file-map-reaches-transformer';

const MAP_IMPORT_CALL = CallSiteStub({
  callee: { target: 'unresolved' },
  args: [{ kind: 'fn-ref', callee: { target: 'import', specifier: './band-reading', importedName: 'bandReading' } }],
  guardPath: [],
  position: { line: 2, column: 10 },
  receiver: 'items',
  method: 'map',
});

const HOST = ScopeRecordStub({
  scopePath: ['*module*', 'bandReadings'],
  name: 'bandReadings',
  access: { kind: 'named' },
  params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
  returnType: { kind: 'array', element: { kind: 'string' } },
  startLine: 1,
  endLine: 3,
  branches: [],
  exits: [ExitNodeStub({ coverageId: '*module*/bandReadings/return@top', guardPath: [], line: 2 })],
  calls: [MAP_IMPORT_CALL],
});

describe('crossFileMapReachesTransformer', () => {
  describe('a branchless surface mapping an imported function over an array param', () => {
    it('VALID: {items.map(bandReading), bandReading imported} => one reach naming the host, array param, and import link', () => {
      const result = crossFileMapReachesTransformer({ walked: WalkFileResultStub({ scopes: [HOST] }) });

      expect(
        result.map((reach) => ({
          host: String(reach.host.name),
          arrayParam: String(reach.arrayParam),
          specifier: String(reach.specifier),
          importedName: String(reach.importedName),
        })),
      ).toStrictEqual([{ host: 'bandReadings', arrayParam: 'items', specifier: './band-reading', importedName: 'bandReading' }]);
    });
  });

  describe('a map whose argument is not an imported function reference', () => {
    it('EMPTY: {an inline callback arg} => no reach, the inline callback is follow-calls` job', () => {
      const scope = ScopeRecordStub({ ...HOST, calls: [CallSiteStub({ ...MAP_IMPORT_CALL, args: [{ kind: 'callback', startLine: 2 }] })] });

      expect(crossFileMapReachesTransformer({ walked: WalkFileResultStub({ scopes: [scope] }) })).toStrictEqual([]);
    });

    it('EMPTY: {a same-file function arg} => no reach, a local fn-ref is not a cross-file fold', () => {
      const scope = ScopeRecordStub({
        ...HOST,
        calls: [CallSiteStub({ ...MAP_IMPORT_CALL, args: [{ kind: 'fn-ref', callee: { target: 'local', name: 'band', startLine: 1 } }] })],
      });

      expect(crossFileMapReachesTransformer({ walked: WalkFileResultStub({ scopes: [scope] }) })).toStrictEqual([]);
    });
  });

  describe('a map over something other than the host`s array param', () => {
    it('EMPTY: {receiver is not an array param} => no reach', () => {
      const scope = ScopeRecordStub({ ...HOST, params: [{ name: 'items', type: { kind: 'number' } }] });

      expect(crossFileMapReachesTransformer({ walked: WalkFileResultStub({ scopes: [scope] }) })).toStrictEqual([]);
    });
  });

  describe('a host that is not a branchless single-exit funnel surface', () => {
    it('EMPTY: {a host carrying a branch} => no reach, only a branchless single-exit surface funnels', () => {
      const scope = ScopeRecordStub({
        ...HOST,
        branches: [
          {
            coverageId: '*module*/bandReadings/if:x',
            kind: 'if',
            condition: { kind: 'leaf', id: '*module*/bandReadings/if:x#leaf', operandParamName: 'items', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 0 } },
            startLine: 2,
            endLine: 4,
          },
        ],
      });

      expect(crossFileMapReachesTransformer({ walked: WalkFileResultStub({ scopes: [scope] }) })).toStrictEqual([]);
    });
  });
});
