import { BranchNodeStub, ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { followCallsTransformer } from './follow-calls-transformer';

const FIXED_ARG_REASON =
  'it is reached only through arguments fixed in the source, so no case can steer it to another ' +
  'branch: a caller welds a value into the call, and a branch with one possible outcome is decided ' +
  'there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

const DEAD_SURFACE_MESSAGE =
  'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only from ' +
  'its own file, and nothing here reaches it. Delete it, or consume it from a caller that passes an ' +
  'input straight through — which the follower would then drive.';

// `inner(n)` branching on `n > 5`, with a then-exit and an else-exit keyed on it — enough for the
// follower to derive cases when it drives the callee.
const N_BRANCH = BranchNodeStub({
  coverageId: 'inner/if:n',
  condition: {
    kind: 'leaf',
    id: 'inner/if:n#leaf',
    operandParamName: 'n',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  },
});
const THEN_EXIT = ExitNodeStub({ coverageId: 'inner/return@then', guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'then' }], line: 3 });
const ELSE_EXIT = ExitNodeStub({ coverageId: 'inner/return@else', guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'else' }], line: 6 });

const namedCaller = ({ name, calls }: { name: string; calls: ReturnType<typeof CallSiteStub>[] }): ReturnType<typeof ScopeRecordStub> =>
  ScopeRecordStub({ scopePath: ['*module*', name], name, access: { kind: 'named' }, params: [{ name: 'value', type: { kind: 'number' } }], calls });

const branchingPrivate = ({ name }: { name: string }): ReturnType<typeof ScopeRecordStub> =>
  ScopeRecordStub({
    scopePath: ['*module*', 'outer', name],
    name,
    exported: false,
    access: { kind: 'unreachable' },
    params: [{ name: 'n', type: { kind: 'number' } }],
    startLine: 2,
    endLine: 7,
    branches: [N_BRANCH],
    exits: [THEN_EXIT, ELSE_EXIT],
  });

describe('followCallsTransformer', () => {
  describe('a private reached by a straight passthrough', () => {
    it('VALID: {outer passes value into inner} => inner is followed as a through-caller entry, nothing undriven', () => {
      const walked = WalkFileResultStub({
        scopes: [
          namedCaller({ name: 'outer', calls: [CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 } })] }),
          branchingPrivate({ name: 'inner' }),
        ],
      });

      const result = followCallsTransformer({ walked });

      expect({
        followed: result.followedEntries.map((fn) => ({ name: fn.entry.name, access: fn.entry.access })),
        undriven: result.undriven,
      }).toStrictEqual({
        followed: [{ name: 'inner', access: { kind: 'through-caller', callerName: 'outer' } }],
        undriven: [],
      });
    });
  });

  describe('a private reached only through a fixed literal', () => {
    it('VALID: {report calls inner(3)} => not followed, admitted undriven for the fixed argument', () => {
      const walked = WalkFileResultStub({
        scopes: [
          namedCaller({
            name: 'report',
            calls: [CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, args: [{ kind: 'literal', value: 3 }] })],
          }),
          branchingPrivate({ name: 'inner' }),
        ],
      });

      const result = followCallsTransformer({ walked });

      expect({
        followed: result.followedEntries,
        undriven: result.undriven.map((entry) => ({ name: entry.name, reason: entry.reason })),
      }).toStrictEqual({ followed: [], undriven: [{ name: 'inner', reason: FIXED_ARG_REASON }] });
    });
  });

  describe('a private reached only through a guarded call', () => {
    it('VALID: {inner(value) but the call is guarded} => not followed, since a fill might route the caller around it', () => {
      const walked = WalkFileResultStub({
        scopes: [
          namedCaller({
            name: 'outer',
            calls: [CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, guardPath: [{ branchCoverageId: 'outer/if:flag', arm: 'else' }] })],
          }),
          branchingPrivate({ name: 'inner' }),
        ],
      });

      const result = followCallsTransformer({ walked });

      expect({
        followed: result.followedEntries,
        undriven: result.undriven.map((entry) => ({ name: entry.name, reason: entry.reason })),
      }).toStrictEqual({ followed: [], undriven: [{ name: 'inner', reason: FIXED_ARG_REASON }] });
    });
  });

  describe('a branching private nothing calls', () => {
    it('VALID: {inner is never called} => not followed, not undriven — a dead-surface LINT the repo owes', () => {
      const walked = WalkFileResultStub({
        scopes: [namedCaller({ name: 'main', calls: [] }), branchingPrivate({ name: 'inner' })],
      });

      const result = followCallsTransformer({ walked });

      expect({
        followed: result.followedEntries,
        undriven: result.undriven,
        lints: result.lints.map((lint) => ({ rule: lint.rule, name: lint.name, message: lint.message })),
      }).toStrictEqual({
        followed: [],
        undriven: [],
        lints: [{ rule: 'dead-surface', name: 'inner', message: DEAD_SURFACE_MESSAGE }],
      });
    });
  });

  describe('a private with no branches', () => {
    it('VALID: {a branchless helper} => nothing to drive and nothing to admit', () => {
      const walked = WalkFileResultStub({
        scopes: [
          namedCaller({ name: 'main', calls: [CallSiteStub({ callee: { target: 'local', name: 'helper', startLine: 2 } })] }),
          ScopeRecordStub({ scopePath: ['*module*', 'helper'], name: 'helper', exported: false, access: { kind: 'unreachable' }, branches: [] }),
        ],
      });

      const result = followCallsTransformer({ walked });

      expect({ followed: result.followedEntries, undriven: result.undriven }).toStrictEqual({ followed: [], undriven: [] });
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => nothing followed and nothing admitted', () => {
      const walked = WalkFileResultStub({ success: false, error: { line: 3, column: 7, message: "'}' expected." } });

      const result = followCallsTransformer({ walked });

      expect({ followed: result.followedEntries, undriven: result.undriven }).toStrictEqual({ followed: [], undriven: [] });
    });
  });
});
