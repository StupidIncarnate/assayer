import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { UndrivenCauseStub } from '../../contracts/undriven-cause/undriven-cause.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { undrivenProjectionTransformer } from './undriven-projection-transformer';

const MODULE_NAME = '*module*';

const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not ' +
  'already go: it runs at import time, and its top-level branching turns on a value the ' +
  'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
  'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
  'value, a computed expression). Read an operand from the environment instead and Assayer ' +
  'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
  'becomes a case that sets it and imports the module fresh.';

const MODULE_REASON_UNREAD_COMPARISON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: ' +
  'it runs at import time, and its top-level branching compares `mode` against a value Assayer could ' +
  'not read as a literal — an enum member, an imported or computed constant, or a property of another ' +
  'object — so it has no value that satisfies the comparison and none that violates it. Assayer ' +
  'understood the branch — this is not syntax it missed — but it cannot yet name the value on the ' +
  'other side of the comparison. Compare against a literal and each arm becomes a case Assayer drives.';

const MODULE_REASON_TYPEOF =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and its top-level branching turns on a `typeof` read, so no case can steer ' +
  'which arm runs. Assayer understood the branch — this is not syntax it missed — but it does not ' +
  'decompose a `typeof` comparison into the case each result names; the value `typeof` narrows may ' +
  'already be read from the environment.';

const MODULE_REASON_TYPEOF_MEMBER =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  "runs at import time, and its top-level branching reads `typeof mode`, narrowing mode's own type by " +
  'runtime tag — but on at least one side, every matching member is a shape Assayer cannot yet select ' +
  'on its own from a union with more than one member. Assayer understood the branch and read the ' +
  'comparison; only picking the union member is unbuilt.';

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
    // `undrivenModules`; this projection turns each name + cause into a labelled, reasoned entry. An
    // opaque module operand — a call result, an import, a computed const — earns no case, so its name
    // is here.
    it('VALID: {a *module* scope named as undriven, cause unarrangeable-operand} => admitted, naming the opaque operand as why', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }],
      });

      expect(result).toStrictEqual([{ name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 }]);
    });
  });

  describe('a module scope undriven by an env comparison against an unread value', () => {
    // A module-scope env read (`const mode = process.env.MODE`) compared against something Assayer
    // could not read as a literal produces `unread-comparison`, not `unarrangeable-operand` — the wrong
    // fixed sentence would tell the reader to read from the environment when they already are.
    it('VALID: {cause unread-comparison, operand mode} => the reason names the comparison, not the opaque-operand text', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModules: [{ name: MODULE_NAME, cause: 'unread-comparison', operand: 'mode' }],
      });

      expect(result).toStrictEqual([{ name: '*module*', reason: MODULE_REASON_UNREAD_COMPARISON, startLine: 1, endLine: 8 }]);
    });

    // No real producer sends `unread-comparison` without an operand, mirroring the same invariant
    // `undrivenBranchTransformer` enforces: every leaf reaching this cause already passed the
    // arrangeable check, and every arrangeable route resolves through the same identifier node.
    it('ERROR: {cause unread-comparison, no operand} => throws the invariant violation', () => {
      expect(() =>
        undrivenProjectionTransformer({
          walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
          undrivenModules: [{ name: MODULE_NAME, cause: 'unread-comparison' }],
        }),
      ).toThrow(/^unreachable: an 'unread-comparison' undriven module `\*module\*` carries no operand$/u);
    });
  });

  describe('a module scope undriven by a typeof read', () => {
    // `typeof x === 'string'` at module scope names the whole `typeof` expression as its operand, not
    // `x` — so the reason must not claim "read it from the environment" as if nothing were read yet.
    it('VALID: {cause unarrangeable-typeof} => the reason names the typeof limit, never the opaque-operand text', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModules: [{ name: MODULE_NAME, cause: 'unarrangeable-typeof' }],
      });

      expect(result).toStrictEqual([{ name: '*module*', reason: MODULE_REASON_TYPEOF, startLine: 1, endLine: 8 }]);
    });
  });

  describe('a module scope undriven by a typeof read that narrows a union with a non-scalar member', () => {
    // `unarrangeable-typeof-member` cannot reach a module scope through the real analyzer (its only
    // arrangeable operand is an environment read, always typed `number`), but the cause is handled
    // exhaustively rather than falling through to a mismatched default.
    it('VALID: {cause unarrangeable-typeof-member, operand mode} => the reason names the shape limit, never the opaque-operand text', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModules: [
          { name: MODULE_NAME, cause: 'unarrangeable-typeof-member', operand: 'mode' },
        ],
      });

      expect(result).toStrictEqual([{ name: '*module*', reason: MODULE_REASON_TYPEOF_MEMBER, startLine: 1, endLine: 8 }]);
    });

    // Same invariant as `unread-comparison`: every leaf reaching this cause already passed the
    // arrangeable check, so it always carries an operand.
    it('ERROR: {cause unarrangeable-typeof-member, no operand} => throws the invariant violation', () => {
      expect(() =>
        undrivenProjectionTransformer({
          walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
          undrivenModules: [{ name: MODULE_NAME, cause: 'unarrangeable-typeof-member' }],
        }),
      ).toThrow(/^unreachable: an 'unarrangeable-typeof-member' undriven module `\*module\*` carries no operand$/u);
    });
  });

  describe('the module label the surface shows instead of *module*', () => {
    // With a relPath and no export, the label is the file basename — the reader never sees the internal
    // `*module*`, while `name` stays `*module*` to key the driven/undriven match.
    it('VALID: {an undriven module, no export, with relPath} => admitted with the file basename as its label', () => {
      const result = undrivenProjectionTransformer({
        walked: moduleScopeWith({ branches: [BranchNodeStub()] }),
        undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }],
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

      const result = undrivenProjectionTransformer({
        walked,
        undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }],
        relPath: 'src/opaque.ts',
      });

      expect(result).toStrictEqual([{ name: '*module*', label: 'config', reason: MODULE_REASON, startLine: 1, endLine: 8 }]);
    });
  });

  describe('a module scope derive-cases drives or evaluates', () => {
    // The complement, and it must stay exact: if derive-cases produced a case (env-driven or a welded
    // constant it evaluated), its name is NOT in the list, so admitting it here would have the run both
    // drive it and say it could not.
    it('VALID: {a *module* scope not in the undriven set} => NOT admitted', () => {
      expect(
        undrivenProjectionTransformer({ walked: moduleScopeWith({ branches: [BranchNodeStub()] }), undrivenModules: [] }),
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

      const result = undrivenProjectionTransformer({
        walked,
        undrivenModules: [{ name: 'inner', cause: UndrivenCauseStub() }],
      });

      expect(result).toStrictEqual([]);
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

      const result = undrivenProjectionTransformer({ walked, undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no scopes} => nothing admitted', () => {
      const result = undrivenProjectionTransformer({
        walked: WalkFileResultStub({ scopes: [] }),
        undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => nothing admitted, because nothing was walked to be undriven', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      const result = undrivenProjectionTransformer({ walked, undrivenModules: [{ name: MODULE_NAME, cause: UndrivenCauseStub() }] });

      expect(result).toStrictEqual([]);
    });
  });
});
