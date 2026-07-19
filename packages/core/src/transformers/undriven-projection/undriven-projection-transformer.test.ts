import { BranchNodeStub, ConditionLeafStub } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { undrivenProjectionTransformer } from './undriven-projection-transformer';

const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

// The two module-scope shapes, and the ONLY difference between them: where the operand comes from.
const WELDED_BRANCH = BranchNodeStub();
const ENV_BRANCH = BranchNodeStub({
  coverageId: '*module*/if:env',
  condition: ConditionLeafStub({
    id: '*module*/if:env#leaf',
    operandParamName: 'value',
    operandEnvVarName: 'VALUE',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  }),
});

const moduleScopeWith = ({ branches }: { branches: ReturnType<typeof BranchNodeStub>[] }): ReturnType<typeof WalkFileResultStub> =>
  WalkFileResultStub({
    scopes: [
      ScopeRecordStub({
        scopePath: ['*module*'],
        name: '*module*',
        kind: 'module',
        exported: false,
        access: { kind: 'module' },
        params: [],
        startLine: 1,
        endLine: 8,
        branches,
      }),
    ],
  });

describe('undrivenProjectionTransformer', () => {
  describe('a module scope nothing can vary', () => {
    // The red rung. Its `if` is real logic that runs at require time, and every operand it turns on
    // is welded to a literal — so the two cases it derives arrange nothing and at most one could ever
    // hold. Without this line the run reports zero cases and zero admissions, which is what a fully
    // covered file reports.
    it('VALID: {a *module* scope branching on a source literal} => admitted, naming the welded operand as why', () => {
      expect(undrivenProjectionTransformer({ walked: moduleScopeWith({ branches: [WELDED_BRANCH] }) })).toStrictEqual([
        { name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 },
      ]);
    });
  });

  describe('the module label the surface shows instead of *module*', () => {
    // With a relPath and no export, the label is the file basename — the reader never sees the internal
    // `*module*`, while `name` stays `*module*` to key the driven/undriven match.
    it('VALID: {a welded module, no export, with relPath} => admitted with the file basename as its label', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [WELDED_BRANCH] }),
        relPath: 'src/sad-path/undriven-welded-const.ts',
      });

      expect(result).toStrictEqual([
        { name: '*module*', label: 'undriven-welded-const.ts', reason: MODULE_REASON, startLine: 1, endLine: 8 },
      ]);
    });

    // A single exported binding wins over the filename.
    it('VALID: {a welded module with one export} => admitted with the export name as its label', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            startLine: 1,
            endLine: 8,
            branches: [WELDED_BRANCH],
            exportedBindings: ['config'],
          }),
        ],
      });

      const result = undrivenProjectionTransformer({ walked, relPath: 'src/welded.ts' });

      expect(result).toStrictEqual([
        { name: '*module*', label: 'config', reason: MODULE_REASON, startLine: 1, endLine: 8 },
      ]);
    });
  });

  describe('a module scope the environment drives', () => {
    // The complement, and it must stay exact: the case set drives this entry, so admitting it here
    // too would have the run both drive it and say it could not. The env read is the whole difference
    // from the scope above.
    it('VALID: {a *module* scope branching on an env read} => NOT admitted, because a case can choose its arm', () => {
      expect(undrivenProjectionTransformer({ walked: moduleScopeWith({ branches: [ENV_BRANCH] }) })).toStrictEqual([]);
    });
  });

  describe('a private helper that branches', () => {
    // NOT this projection's business. Whether a private is driven, admitted undriven, or dead surface
    // is a fact about its CALL EDGES — which only `follow-calls` reads. This projection sees the walk,
    // not who calls whom, so it stays out of the private question entirely and owns only the module
    // welded-const case above.
    it('VALID: {an unreachable helper with a branch} => NOT admitted here, since that is follow-calls` job', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({ scopePath: ['*module*', 'outer'], name: 'outer', exported: true }),
          ScopeRecordStub({
            scopePath: ['*module*', 'outer', 'inner'],
            name: 'inner',
            exported: false,
            access: { kind: 'unreachable' },
            startLine: 2,
            endLine: 8,
            branches: [BranchNodeStub()],
          }),
        ],
      });

      expect(undrivenProjectionTransformer({ walked })).toStrictEqual([]);
    });
  });

  describe('scopes with nothing to miss', () => {
    // Every file has a module scope; almost none have top-level control flow. Admitting all of them
    // would bury the admissions that mean something under one line per file.
    it('VALID: {a *module* scope with no branches} => not admitted, since there is no logic to miss', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'unreachable' },
            params: [],
            branches: [],
          }),
        ],
      });

      expect(undrivenProjectionTransformer({ walked })).toStrictEqual([]);
    });

    it('VALID: {an exported function with branches} => not admitted, since cases drive it', () => {
      const walked = WalkFileResultStub({
        scopes: [ScopeRecordStub({ branches: [BranchNodeStub()] })],
      });

      expect(undrivenProjectionTransformer({ walked })).toStrictEqual([]);
    });

    it('EMPTY: {no scopes} => nothing admitted', () => {
      expect(undrivenProjectionTransformer({ walked: WalkFileResultStub({ scopes: [] }) })).toStrictEqual([]);
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => nothing admitted, because nothing was walked to be undriven', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(undrivenProjectionTransformer({ walked })).toStrictEqual([]);
    });
  });
});
