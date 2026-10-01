import { ParamDescriptorStub } from '@assayer/shared/contracts/param-descriptor/param-descriptor.stub';
import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionNodeStub } from '@assayer/shared/contracts/condition-node/condition-node.stub';
import { ExitNodeStub } from '@assayer/shared/contracts/exit-node/exit-node.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { deriveCasesTransformer } from './derive-cases-transformer';

const NUMBER_PARAMS = [
  ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
  ParamDescriptorStub({ name: 'bonus', type: { kind: 'number' } }),
];

const AND_BRANCH = BranchNodeStub({
  coverageId: 'grade/if:and',
  condition: {
    kind: 'and',
    left: {
      kind: 'leaf',
      id: 'grade/if:and#leaf.0',
      operandParamName: 'score',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    },
    right: {
      kind: 'leaf',
      id: 'grade/if:and#leaf.1',
      operandParamName: 'bonus',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 1 },
    },
  },
});

const OR_BRANCH = BranchNodeStub({
  coverageId: 'alarm/if:or',
  condition: {
    kind: 'or',
    left: {
      kind: 'leaf',
      id: 'alarm/if:or#leaf.0',
      operandParamName: 'temp',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 50 },
    },
    right: {
      kind: 'leaf',
      id: 'alarm/if:or#leaf.1',
      operandParamName: 'smoke',
      operandType: { kind: 'boolean' },
      predicate: { kind: 'truthy' },
    },
  },
});

const NOT_BRANCH = BranchNodeStub({
  coverageId: 'gate/if:not',
  condition: {
    kind: 'not',
    operand: {
      kind: 'leaf',
      id: 'gate/if:not#leaf.0',
      operandParamName: 'ready',
      operandType: { kind: 'boolean' },
      predicate: { kind: 'truthy' },
    },
  },
});

describe('deriveCasesTransformer', () => {
  describe('guarded exits', () => {
    it('VALID: {if-then exit} => arranges the empty string reaching the then exit', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub()],
        branches: [BranchNodeStub()],
        exits: [ExitNodeStub()],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['formatGreeting/return@if-then'], arrange: [{ kind: 'param', param: 'name', value: '' }], salient: true },
      ]);
    });

    it('VALID: {if-else exit} => arranges a non-empty string reaching the else exit', () => {
      const elseExit = ExitNodeStub({
        coverageId: 'formatGreeting/return@if-else',
        guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'else' }],
        line: 6,
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub()],
        branches: [BranchNodeStub()],
        exits: [elseExit],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['formatGreeting/return@if-else'], arrange: [{ kind: 'param', param: 'name', value: 'a' }], salient: true },
      ]);
    });
  });

  describe('compound conditions fan out per CAUSE', () => {
    it('VALID: {a && b, then} => ONE case, since a conjunction holds exactly one way', () => {
      const result = deriveCasesTransformer({
        params: NUMBER_PARAMS,
        branches: [AND_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'grade/return@then',
            guardPath: [{ branchCoverageId: 'grade/if:and', arm: 'then' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        {
          reachesPath: ['grade/return@then'],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 2 },
          ],
          salient: true,
        },
      ]);
    });

    // The bug this whole decomposition exists for: read as ONE opaque operand, both arms derived the
    // SAME arrange values, so the then-case and the else-case were identical and one of them claimed
    // an exit its own values cannot reach. Two DISTINCT causes, two distinct arrangements — but both
    // reach the same else exit and return the same value, so the first is salient and the second grayed.
    it('VALID: {a && b, else} => TWO cases (second grayed): a failed (b never ran), or a held and b failed', () => {
      const result = deriveCasesTransformer({
        params: NUMBER_PARAMS,
        branches: [AND_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'grade/return@else',
            guardPath: [{ branchCoverageId: 'grade/if:and', arm: 'else' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        {
          reachesPath: ['grade/return@else'],
          // score fails, so bonus NEVER EVALUATES — it is unconstrained and falls to representative
          // fill rather than being pinned to a value the flow never reads.
          arrange: [
            { kind: 'param', param: 'score', value: 5 },
            { kind: 'param', param: 'bonus', value: 7 },
          ],
          salient: true,
        },
        {
          reachesPath: ['grade/return@else'],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 1 },
          ],
          salient: false,
        },
      ]);
    });

    it('VALID: {a || b, then} => TWO cases (second grayed), since a disjunction holds two ways', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'temp', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'smoke', type: { kind: 'boolean' } }),
        ],
        branches: [OR_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'alarm/return@then',
            guardPath: [{ branchCoverageId: 'alarm/if:or', arm: 'then' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        {
          reachesPath: ['alarm/return@then'],
          arrange: [
            { kind: 'param', param: 'temp', value: 51 },
            { kind: 'param', param: 'smoke', value: false },
          ],
          salient: true,
        },
        {
          reachesPath: ['alarm/return@then'],
          arrange: [
            { kind: 'param', param: 'temp', value: 50 },
            { kind: 'param', param: 'smoke', value: true },
          ],
          salient: false,
        },
      ]);
    });

    it('VALID: {a || b, else} => ONE case, since a disjunction fails only when both fail', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'temp', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'smoke', type: { kind: 'boolean' } }),
        ],
        branches: [OR_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'alarm/return@else',
            guardPath: [{ branchCoverageId: 'alarm/if:or', arm: 'else' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        {
          reachesPath: ['alarm/return@else'],
          arrange: [
            { kind: 'param', param: 'temp', value: 50 },
            { kind: 'param', param: 'smoke', value: false },
          ],
          salient: true,
        },
      ]);
    });

    it('VALID: {!ready} => the arms INVERT, so then arranges false and else arranges true', () => {
      const params = [ParamDescriptorStub({ name: 'ready', type: { kind: 'boolean' } })];

      const result = deriveCasesTransformer({
        params,
        branches: [NOT_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'gate/return@then',
            guardPath: [{ branchCoverageId: 'gate/if:not', arm: 'then' }],
          }),
          ExitNodeStub({
            coverageId: 'gate/return@else',
            guardPath: [{ branchCoverageId: 'gate/if:not', arm: 'else' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['gate/return@then'], arrange: [{ kind: 'param', param: 'ready', value: false }], salient: true },
        { reachesPath: ['gate/return@else'], arrange: [{ kind: 'param', param: 'ready', value: true }], salient: true },
      ]);
    });
  });

  describe('literal-union operand', () => {
    it('VALID: {eq on a 3-member union} => then binds the member, else fans out one case per other member (second grayed)', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'a' }),
          TypeDescriptorStub({ kind: 'literal', value: 'b' }),
          TypeDescriptorStub({ kind: 'literal', value: 'c' }),
        ],
      });
      const branch = BranchNodeStub({
        coverageId: "classify/if:status === 'a'",
        condition: {
          kind: 'leaf',
          id: "classify/if:status === 'a'#leaf",
          operandParamName: 'status',
          operandType: unionType,
          predicate: { kind: 'eq', literal: 'a' },
        },
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'status', type: unionType })],
        branches: [branch],
        exits: [
          ExitNodeStub({
            coverageId: 'classify/return@if-then',
            guardPath: [{ branchCoverageId: "classify/if:status === 'a'", arm: 'then' }],
          }),
          ExitNodeStub({
            coverageId: 'classify/return@if-else',
            guardPath: [{ branchCoverageId: "classify/if:status === 'a'", arm: 'else' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['classify/return@if-then'], arrange: [{ kind: 'param', param: 'status', value: 'a' }], salient: true },
        { reachesPath: ['classify/return@if-else'], arrange: [{ kind: 'param', param: 'status', value: 'b' }], salient: true },
        { reachesPath: ['classify/return@if-else'], arrange: [{ kind: 'param', param: 'status', value: 'c' }], salient: false },
      ]);
    });
  });

  describe('switch-desugared operand (exhaustive default)', () => {
    it('VALID: {switch over 3-member union} => each case binds its member and default binds the single uncovered member', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          TypeDescriptorStub({ kind: 'literal', value: 'post' }),
          TypeDescriptorStub({ kind: 'literal', value: 'delete' }),
        ],
      });
      const getBranch = BranchNodeStub({
        coverageId: "routeLabel/switch:method === 'get'",
        kind: 'switch',
        condition: {
          kind: 'leaf',
          id: "routeLabel/switch:method === 'get'#leaf",
          operandParamName: 'method',
          operandType: unionType,
          predicate: { kind: 'eq', literal: 'get' },
        },
      });
      const postBranch = BranchNodeStub({
        coverageId: "routeLabel/switch:method === 'post'",
        kind: 'switch',
        condition: {
          kind: 'leaf',
          id: "routeLabel/switch:method === 'post'#leaf",
          operandParamName: 'method',
          operandType: unionType,
          predicate: { kind: 'eq', literal: 'post' },
        },
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'method', type: unionType })],
        branches: [getBranch, postBranch],
        exits: [
          ExitNodeStub({
            coverageId: "routeLabel/return@switch:'get'",
            guardPath: [{ branchCoverageId: "routeLabel/switch:method === 'get'", arm: 'then' }],
            line: 4,
          }),
          ExitNodeStub({
            coverageId: "routeLabel/return@switch:'post'",
            guardPath: [{ branchCoverageId: "routeLabel/switch:method === 'post'", arm: 'then' }],
            line: 6,
          }),
          ExitNodeStub({
            coverageId: 'routeLabel/return@switch:default',
            guardPath: [
              { branchCoverageId: "routeLabel/switch:method === 'get'", arm: 'else' },
              { branchCoverageId: "routeLabel/switch:method === 'post'", arm: 'else' },
            ],
            line: 8,
          }),
        ],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ["routeLabel/return@switch:'get'"], arrange: [{ kind: 'param', param: 'method', value: 'get' }], salient: true },
        { reachesPath: ["routeLabel/return@switch:'post'"], arrange: [{ kind: 'param', param: 'method', value: 'post' }], salient: true },
        { reachesPath: ['routeLabel/return@switch:default'], arrange: [{ kind: 'param', param: 'method', value: 'delete' }], salient: true },
      ]);
    });
  });

  describe('unguarded exits', () => {
    it('EMPTY: {no params, implicit exit} => arranges nothing reaching the implicit exit', () => {
      const result = deriveCasesTransformer({
        params: [],
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'run/exit@implicit', kind: 'implicit', guardPath: [], line: 5 })],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([{ reachesPath: ['run/exit@implicit'], arrange: [], salient: true }]);
    });
  });

  describe('exits no value can reach', () => {
    // `>= 1` then `<= 1`: falling past both needs a value under 1 AND over 1. Reporting it beats
    // deriving a case, because the case's values could not come from the guards — it would reach some
    // other exit and read as an Assayer bug rather than as the dead branch it is.
    it('VALID: {guards that contradict} => no case for that exit, and the exit reported with its guards', () => {
      const lower = BranchNodeStub({
        coverageId: 'classify/if:gte',
        startLine: 2,
        condition: {
          kind: 'leaf',
          id: 'classify/if:gte#leaf',
          operandParamName: 'value',
          operandType: { kind: 'number' },
          predicate: { kind: 'gte', literal: 1 },
        },
      });
      const upper = BranchNodeStub({
        coverageId: 'classify/if:lte',
        startLine: 6,
        condition: {
          kind: 'leaf',
          id: 'classify/if:lte#leaf',
          operandParamName: 'value',
          operandType: { kind: 'number' },
          predicate: { kind: 'lte', literal: 1 },
        },
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'value', type: { kind: 'number' } })],
        branches: [lower, upper],
        exits: [
          ExitNodeStub({
            coverageId: 'classify/return@dead',
            guardPath: [
              { branchCoverageId: 'classify/if:gte', arm: 'else' },
              { branchCoverageId: 'classify/if:lte', arm: 'else' },
            ],
            line: 10,
          }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [{ line: 10, guardLines: [2, 6] }],
        undrivenBranches: [],
        unfillable: [],
      });
    });

    // An exit reachable by ANY cause is reachable — only some of its arrangements went missing. Taking
    // one dead cause as proof would report an exit that a different route reaches perfectly well.
    it('EDGE: {one cause dead, another live} => still cased, and never reported', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'temp', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'smoke', type: { kind: 'boolean' } }),
        ],
        branches: [OR_BRANCH],
        exits: [
          ExitNodeStub({
            coverageId: 'alarm/return@then',
            guardPath: [{ branchCoverageId: 'alarm/if:or', arm: 'then' }],
          }),
        ],
        envDrivable: false,
      });

      expect(result.unreachableExits).toStrictEqual([]);
    });
  });

  describe('a branch welded to a literal constant is EVALUATED, not undriven', () => {
    // `const level = 7; if (level > 10)`: the analyzer knows the single value, so the dead `then` arm is
    // reported as an unreachable-exit LINT naming what it was welded to — never a second, bogus case.
    it('VALID: {level welded to 7, guard level > 10} => the live else case, and the dead then exit names the welded value', () => {
      const weldedBranch = BranchNodeStub({
        coverageId: 'gauge/if:level',
        startLine: 3,
        condition: {
          kind: 'leaf',
          id: 'gauge/if:level#leaf',
          operandParamName: 'level',
          operandConstValue: 7,
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 10 },
        },
      });

      const result = deriveCasesTransformer({
        params: [],
        branches: [weldedBranch],
        exits: [
          ExitNodeStub({ coverageId: 'gauge/return@then', guardPath: [{ branchCoverageId: 'gauge/if:level', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'gauge/return@else', guardPath: [{ branchCoverageId: 'gauge/if:level', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [{ reachesPath: ['gauge/return@else'], arrange: [], salient: true }],
        unreachableExits: [{ line: 4, guardLines: [3], welded: { line: 3, operand: 'level', value: 7 } }],
        undrivenBranches: [],
        unfillable: [],
      });
    });

    // `const s = 'abcde'; if (s.length > 10)`: the SAME lint over the LENGTH axis instead of the value
    // axis — a distinct field on the welded fact (`length`, not `value`).
    it('VALID: {s welded to length 5, guard s.length > 10} => the live else case, and the dead then exit names the welded length', () => {
      const weldedLengthBranch = BranchNodeStub({
        coverageId: 'label/if:s',
        startLine: 3,
        condition: {
          kind: 'leaf',
          id: 'label/if:s#leaf',
          operandParamName: 's',
          operandConstLength: 5,
          operandType: { kind: 'string' },
          predicate: { kind: 'length-gt', literal: 10 },
        },
      });

      const result = deriveCasesTransformer({
        params: [],
        branches: [weldedLengthBranch],
        exits: [
          ExitNodeStub({ coverageId: 'label/return@then', guardPath: [{ branchCoverageId: 'label/if:s', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'label/return@else', guardPath: [{ branchCoverageId: 'label/if:s', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [{ reachesPath: ['label/return@else'], arrange: [], salient: true }],
        unreachableExits: [{ line: 4, guardLines: [3], welded: { line: 3, operand: 's', length: 5 } }],
        undrivenBranches: [],
        unfillable: [],
      });
    });
  });

  describe('an exit no bucket ever picks as maximal', () => {
    // A bare trailing exit (`guardPath: []`) is trivially CONSISTENT with every bucket — an empty guard
    // path is satisfied vacuously — but never MAXIMAL once both arms have their own longer, guarded
    // exit. It is dominated on every bucket, so `mapping.length` for it is zero: not a contradiction (no
    // case was ever infeasible), just an exit nothing selects. It must be neither cased nor reported as
    // an unreachable-exit lint against code that is perfectly fine.
    it('VALID: {both arms return, plus an unguarded trailing exit} => the trailing exit gets no case and no lint', () => {
      const branch = BranchNodeStub({
        coverageId: 'route/if:ok',
        startLine: 2,
        condition: { kind: 'leaf', id: 'route/if:ok#leaf', operandParamName: 'ok', operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } },
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'ok', type: { kind: 'boolean' } })],
        branches: [branch],
        exits: [
          ExitNodeStub({ coverageId: 'route/return@then', guardPath: [{ branchCoverageId: 'route/if:ok', arm: 'then' }], line: 3 }),
          ExitNodeStub({ coverageId: 'route/return@else', guardPath: [{ branchCoverageId: 'route/if:ok', arm: 'else' }], line: 5 }),
          ExitNodeStub({ coverageId: 'route/exit@complete', kind: 'implicit', guardPath: [], line: 7 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [
          { reachesPath: ['route/return@then'], arrange: [{ kind: 'param', param: 'ok', value: true }], salient: true },
          { reachesPath: ['route/return@else'], arrange: [{ kind: 'param', param: 'ok', value: false }], salient: true },
        ],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });
  });

  describe('un-steerable branches — nothing can arrange which arm runs', () => {
    // `if (g())`: the leaf is a lone `truthy` over a call, with no param and no env operand. Both arms
    // would arrange the SAME (empty) inputs, so neither exit can be told from the other — the bug this
    // gate closes. The exits derive NOTHING and the branch is admitted undriven, its line named.
    const OPAQUE_CALL_BRANCH = BranchNodeStub({
      coverageId: 'opaqueIf/if:call',
      startLine: 3,
      condition: {
        kind: 'leaf',
        id: 'opaqueIf/if:call#leaf',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      },
    });

    it('VALID: {an opaque call guard} => no case for its exits, and the branch admitted undriven with no operand', () => {
      const result = deriveCasesTransformer({
        params: [],
        branches: [OPAQUE_CALL_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'opaqueIf/return@then', guardPath: [{ branchCoverageId: 'opaqueIf/if:call', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'opaqueIf/return@else', guardPath: [{ branchCoverageId: 'opaqueIf/if:call', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand' }],
        unfillable: [],
      });
    });

    // `const u = s; if (u > 5)`: the operand IS a named binding, but `u` is not a param of the entry —
    // only `s` is — so it cannot be arranged either. The admission names the un-arrangeable operand.
    const NON_PARAM_BRANCH = BranchNodeStub({
      coverageId: 'nonParam/if:u',
      startLine: 3,
      condition: {
        kind: 'leaf',
        id: 'nonParam/if:u#leaf',
        operandParamName: 'u',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      },
    });

    it('VALID: {a non-param local operand} => no case for its exits, and the branch admitted undriven naming the operand', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 's', type: { kind: 'number' } })],
        branches: [NON_PARAM_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'nonParam/return@then', guardPath: [{ branchCoverageId: 'nonParam/if:u', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'nonParam/return@else', guardPath: [{ branchCoverageId: 'nonParam/if:u', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand', operand: 'u' }],
        unfillable: [],
      });
    });

    // `if (config.mode === 'a')`: the leaf names its ROOT param `config`, but the deciding read is the
    // property `config.mode`, which cannot be arranged — arranging an object param's property is a later
    // phase. So even though `config` IS a param, the `operandPropertyPath` keeps the branch un-steerable,
    // and the admission names the full `config.mode` read rather than the bare root.
    const OBJECT_MEMBER_BRANCH = BranchNodeStub({
      coverageId: 'decide/if:member',
      startLine: 3,
      condition: {
        kind: 'leaf',
        id: 'decide/if:member#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      },
    });

    it('VALID: {an object-member operand over a param} => un-steerable, no case, admission names the property read', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'config', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] } })],
        branches: [OBJECT_MEMBER_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'decide/return@then', guardPath: [{ branchCoverageId: 'decide/if:member', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'decide/return@else', guardPath: [{ branchCoverageId: 'decide/if:member', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand', operand: 'config.mode' }],
        unfillable: [],
      });
    });

    // `if (typeof someCall() === 'string')`: `typeof` is read past its own keyword, so the operand it
    // names is what `typeof` APPLIES TO — but that expression is a call, not an identifier, so
    // `read-condition` names no param for it. `operandIsTypeof` still marks the shape, so the cause
    // distinguishes this from a fully opaque non-`typeof` operand: the reader is told the limit is the
    // `typeof` read's own operand, not that `typeof` itself is unreadable.
    const TYPEOF_BRANCH = BranchNodeStub({
      coverageId: 'checkTypeof/if:typeof',
      startLine: 3,
      condition: {
        kind: 'leaf',
        id: 'checkTypeof/if:typeof#leaf',
        operandIsTypeof: true,
        operandType: { kind: 'string' },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      },
    });

    it('VALID: {a typeof read of an opaque operand} => un-steerable, no case, cause names the typeof limit', () => {
      const result = deriveCasesTransformer({
        params: [],
        branches: [TYPEOF_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'checkTypeof/return@then', guardPath: [{ branchCoverageId: 'checkTypeof/if:typeof', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'checkTypeof/return@else', guardPath: [{ branchCoverageId: 'checkTypeof/if:typeof', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unarrangeable-typeof' }],
        unfillable: [],
      });
    });

    // `if (typeof target === 'string')` where `target: Plain | string`: `target` IS a parameter, so the
    // operand question passes and the predicate DOES narrow — the union's `string` member matches, its
    // `object` member does not. What blocks it is realizing a value for the non-matching side: the
    // object member has no scalar point this engine can pick from a union on its own, so
    // `isPredicateConstrainingGuard` reports the leaf as not (yet) constraining and the cause names the
    // shape limit rather than either "make it a parameter" or "compare against a literal" — both false,
    // since `target` already is one and `'string'` already is one.
    const TYPEOF_MEMBER_BRANCH = BranchNodeStub({
      coverageId: 'choose/if:typeof',
      startLine: 2,
      condition: {
        kind: 'leaf',
        id: 'choose/if:typeof#leaf',
        operandParamName: 'target',
        operandIsTypeof: true,
        operandType: {
          kind: 'union',
          members: [{ kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] }, { kind: 'string' }],
        },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      },
    });

    it('VALID: {a typeof narrowing a union with a non-scalar member} => un-steerable, no case, cause names the shape limit', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({
            name: 'target',
            type: {
              kind: 'union',
              members: [{ kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] }, { kind: 'string' }],
            },
          }),
        ],
        branches: [TYPEOF_MEMBER_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'choose/return@then', guardPath: [{ branchCoverageId: 'choose/if:typeof', arm: 'then' }], line: 2 }),
          ExitNodeStub({ coverageId: 'choose/return@else', guardPath: [{ branchCoverageId: 'choose/if:typeof', arm: 'else' }], line: 2 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 2, cause: 'unarrangeable-typeof-member', operand: 'target' }],
        unfillable: [],
      });
    });

    // `if (typeof target === 'string')` where `target: string | number`: BOTH members have a scalar
    // point, so the predicate DOES realize a different value on each arm — the union member's tag is
    // the whole point of the comparison, and this is the case where Assayer can actually steer it. Two
    // cases, one per member, never an undriven admission.
    it('VALID: {a typeof narrowing a fully scalar union} => steerable, one case per member, no admission', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'target', type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] } })],
        branches: [
          BranchNodeStub({
            coverageId: 'checkTypeof/if:typeof',
            startLine: 2,
            condition: {
              kind: 'leaf',
              id: 'checkTypeof/if:typeof#leaf',
              operandParamName: 'target',
              operandIsTypeof: true,
              operandType: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] },
              predicate: { kind: 'typeof-eq', literal: 'string' },
            },
          }),
        ],
        exits: [
          ExitNodeStub({ coverageId: 'checkTypeof/return@then', guardPath: [{ branchCoverageId: 'checkTypeof/if:typeof', arm: 'then' }], line: 3 }),
          ExitNodeStub({ coverageId: 'checkTypeof/return@else', guardPath: [{ branchCoverageId: 'checkTypeof/if:typeof', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [
          {
            reachesPath: ['checkTypeof/return@then'],
            arrange: [{ kind: 'param', param: 'target', value: 'abc123' }],
            salient: true,
          },
          {
            reachesPath: ['checkTypeof/return@else'],
            arrange: [{ kind: 'param', param: 'target', value: 7 }],
            salient: true,
          },
        ],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });

    // `if (config.db.retry.backoff === 3)`: the property path is THREE segments deep. Un-steerable in
    // the per-file gate exactly like the one-segment `config.mode` case above — an object param's
    // property is not scalar-arrangeable here, whatever its depth — so it lands on the SAME
    // `unarrangeable-operand` cause: `config` already is a parameter, and this is closed later, at
    // consume time, by `stub-realize` walking the full path into the resolved type.
    const DEEP_MEMBER_BRANCH = BranchNodeStub({
      coverageId: 'checkDeep/if:member',
      startLine: 4,
      condition: {
        kind: 'leaf',
        id: 'checkDeep/if:member#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['db', 'retry', 'backoff'],
        operandTypeRef: 'Config',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 3 },
      },
    });

    it('VALID: {a property path more than one segment deep} => un-steerable, no case, same cause as a one-segment read', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({
            name: 'config',
            type: {
              kind: 'object',
              typeName: 'Config',
              properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'object', properties: [{ name: 'backoff', type: { kind: 'number' } }] } }] } }],
            },
          }),
        ],
        branches: [DEEP_MEMBER_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'checkDeep/return@then', guardPath: [{ branchCoverageId: 'checkDeep/if:member', arm: 'then' }], line: 5 }),
          ExitNodeStub({ coverageId: 'checkDeep/return@else', guardPath: [{ branchCoverageId: 'checkDeep/if:member', arm: 'else' }], line: 7 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 4, cause: 'unarrangeable-operand', operand: 'config.db.retry.backoff' }],
        unfillable: [],
      });
    });

    // `const TARGET = 'a'; if (m === TARGET)`: the operand `m` IS a param and IS arrangeable, but the
    // right-hand side is an identifier the parse cannot read as a value, so the predicate is
    // `unrecognized` and narrows NEITHER arm. Both arms would arrange `m` from its bare type, so one of
    // the two cases must predict an arm it cannot reach — a build failing over correct code. The branch
    // is admitted undriven instead, and the cause says which of the two blockers it hit.
    const UNREAD_COMPARISON_BRANCH = BranchNodeStub({
      coverageId: 'pick/if:target',
      startLine: 4,
      condition: {
        kind: 'leaf',
        id: 'pick/if:target#leaf',
        operandParamName: 'm',
        operandType: { kind: 'string' },
        predicate: { kind: 'unrecognized' },
      },
    });

    it('VALID: {a param compared against a non-literal} => un-steerable, no case, and the cause is the comparison', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'm', type: { kind: 'string' } })],
        branches: [UNREAD_COMPARISON_BRANCH],
        exits: [
          ExitNodeStub({ coverageId: 'pick/return@then', guardPath: [{ branchCoverageId: 'pick/if:target', arm: 'then' }], line: 5 }),
          ExitNodeStub({ coverageId: 'pick/return@else', guardPath: [{ branchCoverageId: 'pick/if:target', arm: 'else' }], line: 7 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 4, cause: 'unread-comparison', operand: 'm' }],
        unfillable: [],
      });
    });

    // A WELDED constant is arrangeable without an input, but weldedness only says what the operand IS —
    // it says nothing about what the comparison DEMANDS. With an unreadable right-hand side there is
    // still no arm to prefer, so the single-value domain reaches both and the branch stays undriven.
    it('VALID: {a welded const compared against a non-literal} => un-steerable, never two cases over one value', () => {
      const result = deriveCasesTransformer({
        params: [],
        branches: [
          BranchNodeStub({
            coverageId: 'weld/if:target',
            startLine: 3,
            condition: {
              kind: 'leaf',
              id: 'weld/if:target#leaf',
              operandParamName: 'level',
              operandConstValue: 7,
              operandType: { kind: 'number' },
              predicate: { kind: 'unrecognized' },
            },
          }),
        ],
        exits: [
          ExitNodeStub({ coverageId: 'weld/return@then', guardPath: [{ branchCoverageId: 'weld/if:target', arm: 'then' }], line: 4 }),
          ExitNodeStub({ coverageId: 'weld/return@else', guardPath: [{ branchCoverageId: 'weld/if:target', arm: 'else' }], line: 6 }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unread-comparison', operand: 'level' }],
        unfillable: [],
      });
    });

    // The env operand is the pivot `envDrivable` turns on: a module scope reading `VALUE` from the
    // environment IS drivable, so the branch is steerable and derives its per-arm cases.
    const ENV_BRANCH = BranchNodeStub({
      coverageId: 'mod/if:value',
      startLine: 3,
      condition: {
        kind: 'leaf',
        id: 'mod/if:value#leaf',
        operandParamName: 'value',
        operandEnvVarName: 'VALUE',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      },
    });
    const ENV_EXITS = [
      ExitNodeStub({ coverageId: 'mod/exit@then', kind: 'implicit', guardPath: [{ branchCoverageId: 'mod/if:value', arm: 'then' }], line: 4 }),
      ExitNodeStub({ coverageId: 'mod/exit@else', kind: 'implicit', guardPath: [{ branchCoverageId: 'mod/if:value', arm: 'else' }], line: 6 }),
    ];

    it('VALID: {an env operand, envDrivable} => steerable, so each arm derives a case that sets the variable', () => {
      const result = deriveCasesTransformer({ params: [], branches: [ENV_BRANCH], exits: ENV_EXITS, envDrivable: true });

      expect(result).toStrictEqual({
        cases: [
          { reachesPath: ['mod/exit@then'], arrange: [{ kind: 'env', name: 'VALUE', value: '6' }], salient: true },
          { reachesPath: ['mod/exit@else'], arrange: [{ kind: 'env', name: 'VALUE', value: '5' }], salient: true },
        ],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });

    // The SAME branch is un-steerable when the entry is NOT env-driven — a function's captured `const`
    // is frozen by the time it is called, so setting the variable then changes nothing.
    it('VALID: {an env operand, NOT envDrivable} => un-steerable, so no case and the branch admitted undriven', () => {
      const result = deriveCasesTransformer({ params: [], branches: [ENV_BRANCH], exits: ENV_EXITS, envDrivable: false });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand', operand: 'value' }],
        unfillable: [],
      });
    });
  });

  describe('branchless predicate — the true/false return split', () => {
    const PRED_EXIT = ExitNodeStub({ coverageId: 'pred/return@top', kind: 'return', guardPath: [], line: 2 });

    // A branchless boolean predicate has ONE exit for both return values, so a single representative
    // fill could never show `size > 50` distinguishing anything. The returnPredicate axis splits the
    // one exit into two cases — the satisfying side and the violating side — and both are salient,
    // because they return DIFFERENT booleans out of the same exit.
    it('VALID: {return size > 50} => two salient cases, one per side of the comparison', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'size', type: { kind: 'number' } })],
        branches: [],
        exits: [PRED_EXIT],
        envDrivable: false,
        returnPredicate: ConditionNodeStub({ id: 'pred#leaf', operandParamName: 'size', predicate: { kind: 'gt', literal: 50 } }),
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['pred/return@top'], arrange: [{ kind: 'param', param: 'size', value: 51 }], salient: true },
        { reachesPath: ['pred/return@top'], arrange: [{ kind: 'param', param: 'size', value: 50 }], salient: true },
      ]);
    });

    // An un-steerable returnPredicate (its operand is not a param of this entry) is OMITTED, not
    // admitted undriven — a branchless predicate is always callable, it just cannot distinguish its
    // two return values, so it falls back to the one representative-fill case.
    it('VALID: {a predicate over a non-param} => the axis is dropped, one fill case, nothing undriven', () => {
      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'size', type: { kind: 'number' } })],
        branches: [],
        exits: [PRED_EXIT],
        envDrivable: false,
        returnPredicate: ConditionNodeStub({ id: 'pred#leaf', operandParamName: 'other', predicate: { kind: 'gt', literal: 50 } }),
      });

      expect(result).toStrictEqual({
        cases: [{ reachesPath: ['pred/return@top'], arrange: [{ kind: 'param', param: 'size', value: 7 }], salient: true }],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });
  });

  describe('a parameter the fill seam refuses', () => {
    const REFUSED_EXIT = ExitNodeStub({ coverageId: 'audit/return@top', kind: 'return', guardPath: [], line: 2 });

    // The refusal is REPORTED rather than swallowed. Without this the entry derives nothing and says
    // nothing, which reads exactly like a file with nothing to test — the reads-as-complete lie the
    // admission channels exist to prevent.
    it('VALID: {a callable param} => no case, and the refused param named with the type the checker renders', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'size', type: { kind: 'number' } }),
          ParamDescriptorStub({
            name: 'report',
            type: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }),
          }),
        ],
        branches: [],
        exits: [REFUSED_EXIT],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [{ param: 'report', type: '(message: string) => string' }],
      });
    });

    // NOT an unreachable exit: nothing here is dead code. The guards are fine and the exit is perfectly
    // reachable — only the input cannot be built — so reporting it as a lint would tell the reader to
    // delete correct code.
    it('VALID: {a callable param behind a steerable guard} => still no lint, only the refusal', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'report', type: TypeDescriptorStub({ kind: 'callable', text: '() => void' }) }),
        ],
        branches: [
          BranchNodeStub({
            coverageId: 'audit/if',
            condition: ConditionNodeStub({ id: 'audit/if#leaf', operandParamName: 'score', predicate: { kind: 'gt', literal: 5 } }),
          }),
        ],
        exits: [
          ExitNodeStub({
            coverageId: 'audit/return@then',
            kind: 'return',
            guardPath: [{ branchCoverageId: 'audit/if', arm: 'then' }],
            line: 3,
          }),
          ExitNodeStub({
            coverageId: 'audit/return@else',
            kind: 'return',
            guardPath: [{ branchCoverageId: 'audit/if', arm: 'else' }],
            line: 5,
          }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [{ param: 'report', type: '() => void' }],
      });
    });
  });

  // The other half of the refusal: `maybe(11)` is a legal call, so invoicing the caller for `report`
  // bills a debt nobody has — the entry is driven WITHOUT it and derives its real cases.
  describe('a parameter the caller owes nothing', () => {
    const OPTIONAL_BRANCH = BranchNodeStub({
      coverageId: 'maybe/if',
      condition: ConditionNodeStub({ id: 'maybe/if#leaf', operandParamName: 'size', predicate: { kind: 'gt', literal: 10 } }),
    });
    const OPTIONAL_EXITS = [
      ExitNodeStub({ coverageId: 'maybe/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'maybe/if', arm: 'then' }], line: 3 }),
      ExitNodeStub({ coverageId: 'maybe/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'maybe/if', arm: 'else' }], line: 5 }),
    ];

    it('VALID: {an OPTIONAL callable param} => both arms are cases and nothing is invoiced', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'size', type: { kind: 'number' } }),
          ParamDescriptorStub({
            name: 'report',
            type: TypeDescriptorStub({ kind: 'callable', text: '(m: string) => void' }),
            optional: true,
          }),
        ],
        branches: [OPTIONAL_BRANCH],
        exits: OPTIONAL_EXITS,
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [
          { reachesPath: ['maybe/return@then'], arrange: [{ kind: 'param', param: 'size', value: 11 }], salient: true },
          { reachesPath: ['maybe/return@else'], arrange: [{ kind: 'param', param: 'size', value: 10 }], salient: true },
        ],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });

    it('VALID: {a REST array of callables} => both arms are cases and nothing is invoiced', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'size', type: { kind: 'number' } }),
          ParamDescriptorStub({
            name: 'sinks',
            type: TypeDescriptorStub({ kind: 'array', element: { kind: 'callable', text: '(m: string) => void' } }),
            optional: true,
            rest: true,
          }),
        ],
        branches: [OPTIONAL_BRANCH],
        exits: OPTIONAL_EXITS,
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        cases: [
          { reachesPath: ['maybe/return@then'], arrange: [{ kind: 'param', param: 'size', value: 11 }], salient: true },
          { reachesPath: ['maybe/return@else'], arrange: [{ kind: 'param', param: 'size', value: 10 }], salient: true },
        ],
        unreachableExits: [],
        undrivenBranches: [],
        unfillable: [],
      });
    });
  });

  describe('converging branches — off-path buckets on one exit', () => {
    // Two independent guards that both fall through to the SAME trailing return. The cross product is
    // four input buckets — each a distinct combination the logic can tell apart — but they all reach
    // the one exit and return the same value, so exactly ONE is salient and the other three are the
    // grayed breadth. Constraining a branch whose flow the trailing return never depends on is a SOUND
    // off-path arm.
    it('VALID: {two converging guards} => four cases on one exit, exactly one salient', () => {
      const aBranch = BranchNodeStub({
        coverageId: 'tally/if:a',
        startLine: 2,
        condition: { kind: 'leaf', id: 'tally/if:a#leaf', operandParamName: 'a', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
      });
      const bBranch = BranchNodeStub({
        coverageId: 'tally/if:b',
        startLine: 4,
        condition: { kind: 'leaf', id: 'tally/if:b#leaf', operandParamName: 'b', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
      });

      const result = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'a', type: { kind: 'number' } }), ParamDescriptorStub({ name: 'b', type: { kind: 'number' } })],
        branches: [aBranch, bBranch],
        exits: [ExitNodeStub({ coverageId: 'tally/return@top', kind: 'return', guardPath: [], line: 6 })],
        envDrivable: false,
      });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['tally/return@top'], arrange: [{ kind: 'param', param: 'a', value: 6 }, { kind: 'param', param: 'b', value: 6 }], salient: true },
        { reachesPath: ['tally/return@top'], arrange: [{ kind: 'param', param: 'a', value: 6 }, { kind: 'param', param: 'b', value: 5 }], salient: false },
        { reachesPath: ['tally/return@top'], arrange: [{ kind: 'param', param: 'a', value: 5 }, { kind: 'param', param: 'b', value: 6 }], salient: false },
        { reachesPath: ['tally/return@top'], arrange: [{ kind: 'param', param: 'a', value: 5 }, { kind: 'param', param: 'b', value: 5 }], salient: false },
      ]);
    });
  });

  describe('a harness closes the refusal the gap invoiced', () => {
    // The same derivation that reported the gap produces the cases once the value exists: the branch is
    // steered exactly as before, and the supplied parameter is the only binding that differs.
    it('VALID: {a callback param the harness declares} => the branch drives, nothing refused', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'name', type: { kind: 'string' } }),
          ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
        ],
        branches: [BranchNodeStub()],
        exits: [ExitNodeStub()],
        envDrivable: false,
        harness: { entry: 'formatGreeting', params: ['report'] },
      });

      expect({ cases: result.cases, unfillable: result.unfillable }).toStrictEqual({
        cases: [
          {
            reachesPath: ['formatGreeting/return@if-then'],
            arrange: [
              { kind: 'param', param: 'name', value: '' },
              { kind: 'harness', param: 'report', key: 'inputs.formatGreeting.report' },
            ],
            salient: true,
          },
        ],
        unfillable: [],
      });
    });

    // Without the harness the SAME entry derives nothing and reports the refusal — which is what makes
    // the pair above a closure of this debt rather than a second derivation path.
    it('VALID: {the same entry with no harness} => no case, and the callback is refused', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'name', type: { kind: 'string' } }),
          ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
        ],
        branches: [BranchNodeStub()],
        exits: [ExitNodeStub()],
        envDrivable: false,
      });

      expect({ cases: result.cases, unfillable: result.unfillable }).toStrictEqual({
        cases: [],
        unfillable: [{ param: 'report', type: '(m: string) => string' }],
      });
    });

    // The trailing-parameter shape: `sinks` is a REST param the seam refuses, so WITHOUT `harness`
    // `applied-params` truncates it before it ever reaches the fill seam — never refused, never a gap,
    // never bound. Naming it in `harness` is what keeps it in `applied` long enough for `cause-arrange`
    // to bind it.
    it('VALID: {harness names a trailing REST parameter} => kept and bound, not truncated away', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'size', type: { kind: 'number' } }),
          ParamDescriptorStub({
            name: 'sinks',
            type: { kind: 'array', element: { kind: 'callable', text: '(m: string) => void' } },
            rest: true,
          }),
        ],
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'collect/return@top', guardPath: [], line: 1 })],
        envDrivable: false,
        harness: { entry: 'collect', params: ['sinks'] },
      });

      expect({ cases: result.cases, unfillable: result.unfillable }).toStrictEqual({
        cases: [
          {
            reachesPath: ['collect/return@top'],
            arrange: [
              { kind: 'param', param: 'size', value: 7 },
              { kind: 'harness', param: 'sinks', key: 'inputs.collect.sinks', rest: true },
            ],
            salient: true,
          },
        ],
        unfillable: [],
      });
    });

    // The twin without a harness: `sinks` truncates silently, `size` alone derives the entry, and
    // nothing is ever refused — this is C3's own repro, and the pair proves the harness is what changes.
    it('VALID: {the same entry with no harness} => sinks truncates silently, no refusal at all', () => {
      const result = deriveCasesTransformer({
        params: [
          ParamDescriptorStub({ name: 'size', type: { kind: 'number' } }),
          ParamDescriptorStub({
            name: 'sinks',
            type: { kind: 'array', element: { kind: 'callable', text: '(m: string) => void' } },
            rest: true,
          }),
        ],
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'collect/return@top', guardPath: [], line: 1 })],
        envDrivable: false,
      });

      expect({ cases: result.cases, unfillable: result.unfillable }).toStrictEqual({
        cases: [{ reachesPath: ['collect/return@top'], arrange: [{ kind: 'param', param: 'size', value: 7 }], salient: true }],
        unfillable: [],
      });
    });
  });
});
