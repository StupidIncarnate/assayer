import { BranchNodeStub } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { undrivenProjectionTransformer } from './undriven-projection-transformer';

const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not ' +
  'already go: it runs at import time, and its top-level branching turns on a value the ' +
  'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
  'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
  'value, a computed expression). Read an operand from the environment instead and Assayer ' +
  'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
  'becomes a case that sets it and imports the module fresh.';

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
  describe('a module scope derive-cases could neither steer nor evaluate', () => {
    // The decision belongs to derive-cases (the single drivability owner) and is handed in as
    // `undrivenModuleNames`; this projection turns that name into a labelled, reasoned entry. An opaque
    // module operand — a call result, an import, a computed const — earns no case, so its name is here.
    it('VALID: {a *module* scope named as undriven} => admitted, naming the opaque operand as why', () => {
      expect(
        undrivenProjectionTransformer({ walked: moduleScopeWith({ branches: [BranchNodeStub()] }), undrivenModuleNames: new Set(['*module*']) }),
      ).toStrictEqual([{ name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 }]);
    });
  });

  describe('the module label the surface shows instead of *module*', () => {
    // With a relPath and no export, the label is the file basename — the reader never sees the internal
    // `*module*`, while `name` stays `*module*` to key the driven/undriven match.
    it('VALID: {an undriven module, no export, with relPath} => admitted with the file basename as its label', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModuleNames: new Set(['*module*']),
        relPath: 'src/sad-path/undriven/opaque-module/opaque-module.ts',
      });

      expect(result).toStrictEqual([{ name: '*module*', label: 'opaque-module.ts', reason: MODULE_REASON, startLine: 1, endLine: 8 }]);
    });

    // A single exported binding wins over the filename.
    it('VALID: {an undriven module with one export} => admitted with the export name as its label', () => {
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
            branches: [BranchNodeStub()],
            exportedBindings: ['config'],
          }),
        ],
      });

      const result = undrivenProjectionTransformer({ walked, undrivenModuleNames: new Set(['*module*']), relPath: 'src/opaque.ts' });

      expect(result).toStrictEqual([{ name: '*module*', label: 'config', reason: MODULE_REASON, startLine: 1, endLine: 8 }]);
    });
  });

  describe('a module scope derive-cases drives or evaluates', () => {
    // The complement, and it must stay exact: if derive-cases produced a case (env-driven or a welded
    // constant it evaluated), its name is NOT in the set, so admitting it here would have the run both
    // drive it and say it could not.
    it('VALID: {a *module* scope not in the undriven set} => NOT admitted', () => {
      expect(
        undrivenProjectionTransformer({ walked: moduleScopeWith({ branches: [BranchNodeStub()] }), undrivenModuleNames: new Set() }),
      ).toStrictEqual([]);
    });
  });

  describe('a private helper that branches', () => {
    // NOT this projection's business. Whether a private is driven, admitted undriven, or dead surface
    // is a fact about its CALL EDGES — which only `follow-calls` reads. Even named, an `unreachable`
    // scope is not `module` access, so this projection stays out of the private question entirely.
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

      expect(undrivenProjectionTransformer({ walked, undrivenModuleNames: new Set(['inner']) })).toStrictEqual([]);
    });
  });

  describe('scopes with nothing to miss', () => {
    // A module scope with no branches has no logic to be undriven about — even if named, it is skipped.
    it('VALID: {a *module* scope with no branches} => not admitted, since there is no logic to miss', () => {
      const walked = WalkFileResultStub({
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            branches: [],
          }),
        ],
      });

      expect(undrivenProjectionTransformer({ walked, undrivenModuleNames: new Set(['*module*']) })).toStrictEqual([]);
    });

    it('EMPTY: {no scopes} => nothing admitted', () => {
      expect(undrivenProjectionTransformer({ walked: WalkFileResultStub({ scopes: [] }), undrivenModuleNames: new Set(['*module*']) })).toStrictEqual([]);
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => nothing admitted, because nothing was walked to be undriven', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(undrivenProjectionTransformer({ walked, undrivenModuleNames: new Set(['*module*']) })).toStrictEqual([]);
    });
  });
});
