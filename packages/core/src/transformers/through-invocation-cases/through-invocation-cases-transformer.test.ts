import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionNodeStub } from '@assayer/shared/contracts/condition-node/condition-node.stub';
import { ExitNodeStub } from '@assayer/shared/contracts/exit-node/exit-node.stub';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { throughInvocationCasesTransformer } from './through-invocation-cases-transformer';

// A welded IIFE arrow: `((n) => { if (n > 5) return 'big'; return 'small'; })(…)`, param `n`.
const N_BRANCH = BranchNodeStub({
  coverageId: 'arrow/if:n',
  condition: { kind: 'leaf', id: 'arrow/if:n#leaf', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
});
const N_THEN = ExitNodeStub({ coverageId: 'arrow/return@then', guardPath: [{ branchCoverageId: 'arrow/if:n', arm: 'then' }], line: 3 });
const N_ELSE = ExitNodeStub({ coverageId: 'arrow/return@else', guardPath: [{ branchCoverageId: 'arrow/if:n', arm: 'else' }], line: 6 });
const N_ARROW = ScopeRecordStub({
  scopePath: ['*module*', 'arrow'],
  name: 'arrow',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  startLine: 2,
  endLine: 7,
  branches: [N_BRANCH],
  exits: [N_THEN, N_ELSE],
});

describe('throughInvocationCasesTransformer', () => {
  describe('a welded invocation argument', () => {
    // `(…)(7)` welds `7` into `n`, so `n > 5` is always true: the then arm is a case that arranges
    // NOTHING (the runner drives it by importing, the welded value is fixed in source), and the else
    // arm is an unreachable exit. Its access is `module` — driven by importing the file.
    const ARGS = CallSiteStub({ args: [{ kind: 'literal', value: 7 }] }).args;

    it('VALID: {((n) => …)(7)} => a module-access entry with one live-arm case arranging nothing', () => {
      const result = throughInvocationCasesTransformer({ arrow: N_ARROW, args: ARGS });

      expect({ access: result.analysis.entry.access, params: result.analysis.entry.params, cases: result.analysis.cases }).toStrictEqual({
        access: { kind: 'module' },
        params: [],
        cases: [{ reachesPath: ['arrow/return@then'], arrange: [], salient: true }],
      });
    });

    it('VALID: {((n) => …)(7)} => the welded-dead else arm is returned as an unreachable exit naming the operand and value', () => {
      const result = throughInvocationCasesTransformer({ arrow: N_ARROW, args: ARGS });

      expect(result.unreachableExits).toStrictEqual([{ line: 6, guardLines: [2], welded: { line: 2, operand: 'n', value: 7 } }]);
    });
  });

  describe('an env-BODY read with no arguments', () => {
    // `(() => { const size = Number(process.env.SIZE); if (size > 5) … })()` — the arrow has no params,
    // and its operand carries the env source, so importing it with SIZE set picks the arm. Each case
    // sets the variable the inverse of the source coercion (P4), never a recorded output.
    const SIZE_BRANCH = BranchNodeStub({
      coverageId: 'arrow/if:size',
      condition: {
        kind: 'leaf',
        id: 'arrow/if:size#leaf',
        operandParamName: 'size',
        operandEnvVarName: 'SIZE',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      },
    });
    const SIZE_THEN = ExitNodeStub({ coverageId: 'arrow/return@then', guardPath: [{ branchCoverageId: 'arrow/if:size', arm: 'then' }], line: 4 });
    const SIZE_ELSE = ExitNodeStub({ coverageId: 'arrow/return@else', guardPath: [{ branchCoverageId: 'arrow/if:size', arm: 'else' }], line: 7 });
    const SIZE_ARROW = ScopeRecordStub({
      scopePath: ['*module*', 'arrow'],
      name: 'arrow',
      exported: false,
      access: { kind: 'unreachable' },
      params: [],
      returnType: { kind: 'string' },
      startLine: 1,
      endLine: 8,
      branches: [SIZE_BRANCH],
      exits: [SIZE_THEN, SIZE_ELSE],
    });

    it('VALID: {(() => { const size = Number(process.env.SIZE); if (size > 5) … })()} => one env case per arm, no dead exits', () => {
      const result = throughInvocationCasesTransformer({ arrow: SIZE_ARROW, args: [] });

      expect({ cases: result.analysis.cases, unreachableExits: result.unreachableExits }).toStrictEqual({
        cases: [
          { reachesPath: ['arrow/return@then'], arrange: [{ kind: 'env', name: 'SIZE', value: '6' }], salient: true },
          { reachesPath: ['arrow/return@else'], arrange: [{ kind: 'env', name: 'SIZE', value: '5' }], salient: true },
        ],
        unreachableExits: [],
      });
    });
  });

  describe('an argument v1 cannot propagate', () => {
    // `((n) => …)(someExpr)` — the argument is opaque, so `n` is neither welded nor env-sourced. Derived
    // over the empty module-load param list, nothing steers `n`, so no case and no unreachable exit — the
    // follower admits it undriven, exactly as a returned closure.
    const ARGS = CallSiteStub({ args: [{ kind: 'opaque' }] }).args;

    it('VALID: {((n) => …)(opaque)} => no cases and no unreachable exits', () => {
      const result = throughInvocationCasesTransformer({ arrow: N_ARROW, args: ARGS });

      expect({ cases: result.analysis.cases, unreachableExits: result.unreachableExits }).toStrictEqual({ cases: [], unreachableExits: [] });
    });
  });

  describe('a branchless arrow whose return predicate reads the environment', () => {
    // `(() => { return Number(process.env.SIZE) > 5; })()` has no `if` — the split rides the RETURN
    // comparison, not a branch — so this is the one axis neither of the two describe blocks above
    // touches: they both give arrows that never set `predicateSignature`. `params: []` is what
    // `derive-cases` is handed either way (§ the arrow's own PURPOSE comment), so only the ENV route
    // can steer a returnPredicate here — a plain-param one would find no matching param.
    const PRED_EXIT = ExitNodeStub({ coverageId: 'arrow/return@top', guardPath: [], line: 2 });
    const PREDICATE = ConditionNodeStub({
      id: 'arrow/return#leaf',
      operandParamName: 'size',
      operandEnvVarName: 'SIZE',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    });
    const PREDICATE_ARROW = ScopeRecordStub({
      scopePath: ['*module*', 'arrow'],
      name: 'arrow',
      exported: false,
      access: { kind: 'unreachable' },
      params: [],
      returnType: { kind: 'boolean' },
      startLine: 1,
      endLine: 2,
      branches: [],
      exits: [PRED_EXIT],
      predicateSignature: PREDICATE,
    });

    it('VALID: {return Number(process.env.SIZE) > 5} => the predicate signature rides onto the entry the analysis carries', () => {
      const result = throughInvocationCasesTransformer({ arrow: PREDICATE_ARROW, args: [] });

      expect(result.analysis.predicateSignature).toStrictEqual(PREDICATE);
    });

    it('VALID: {return Number(process.env.SIZE) > 5} => one env case per true/false split, no dead exits', () => {
      const result = throughInvocationCasesTransformer({ arrow: PREDICATE_ARROW, args: [] });

      expect({ cases: result.analysis.cases, unreachableExits: result.unreachableExits }).toStrictEqual({
        cases: [
          { reachesPath: ['arrow/return@top'], arrange: [{ kind: 'env', name: 'SIZE', value: '6' }], salient: true },
          { reachesPath: ['arrow/return@top'], arrange: [{ kind: 'env', name: 'SIZE', value: '5' }], salient: true },
        ],
        unreachableExits: [],
      });
    });
  });
});
