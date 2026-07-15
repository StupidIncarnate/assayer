import { BranchNodeStub } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { analysisProjectionTransformer } from './analysis-projection-transformer';

const MODULE_BRANCH = BranchNodeStub({ coverageId: '*module*/if:id:flag' });

describe('analysisProjectionTransformer', () => {
  describe('only EXPORTED functions become entries', () => {
    it('VALID: {an exported function} => one entry carrying its signature, branches, and exits', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ scopePath: ['classify'], name: 'classify', kind: 'function', exported: true })],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              scopePath: ['classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });

    it('VALID: {a nested private helper} => no entry, since driving it directly would be testing a private', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false })],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });

    it('VALID: {an exported function beside a private one} => only the exported one', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({ scopePath: ['classify'], name: 'classify', kind: 'function', exported: true }),
          ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              scopePath: ['classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [],
            exits: [],
          },
        ],
      });
    });
  });

  describe('the module scope appears only when it holds branch logic', () => {
    it('VALID: {module scope with a branch} => an entry, because that top-level logic is testable', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            branches: [MODULE_BRANCH],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [MODULE_BRANCH],
            exits: [],
          },
        ],
      });
    });

    it('VALID: {module scope with no branches} => no entry, since almost no file has testable top-level flow', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            branches: [],
          }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({ success: true, functions: [] });
    });

    it('VALID: {an unexported module scope with a branch} => still an entry, since the module rule ignores export', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            branches: [MODULE_BRANCH],
          }),
          ScopeRecordStub({ scopePath: ['helper'], name: 'helper', kind: 'function', exported: false }),
        ],
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [MODULE_BRANCH],
            exits: [],
          },
        ],
      });
    });
  });

  describe('a walk with nothing in it', () => {
    it('EMPTY: {no scopes} => no entries', () => {
      expect(analysisProjectionTransformer({ walked: WalkFileResultStub({ scopes: [] }) })).toStrictEqual({
        success: true,
        functions: [],
      });
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => the positioned error passes straight through', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(analysisProjectionTransformer({ walked })).toStrictEqual({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });
    });
  });
});
