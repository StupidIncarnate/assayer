import { ParamDescriptorStub, BranchNodeStub, ConditionNodeStub, ExitNodeStub, TypeDescriptorStub } from '@assayer/shared/contracts';

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
        { reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }], salient: true },
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
        { reachesExit: 'formatGreeting/return@if-else', arrange: [{ kind: 'param', param: 'name', value: 'a' }], salient: true },
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
          reachesExit: 'grade/return@then',
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
          reachesExit: 'grade/return@else',
          // score fails, so bonus NEVER EVALUATES — it is unconstrained and falls to representative
          // fill rather than being pinned to a value the flow never reads.
          arrange: [
            { kind: 'param', param: 'score', value: 5 },
            { kind: 'param', param: 'bonus', value: 7 },
          ],
          salient: true,
        },
        {
          reachesExit: 'grade/return@else',
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
          reachesExit: 'alarm/return@then',
          arrange: [
            { kind: 'param', param: 'temp', value: 51 },
            { kind: 'param', param: 'smoke', value: false },
          ],
          salient: true,
        },
        {
          reachesExit: 'alarm/return@then',
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
          reachesExit: 'alarm/return@else',
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
        { reachesExit: 'gate/return@then', arrange: [{ kind: 'param', param: 'ready', value: false }], salient: true },
        { reachesExit: 'gate/return@else', arrange: [{ kind: 'param', param: 'ready', value: true }], salient: true },
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
        { reachesExit: 'classify/return@if-then', arrange: [{ kind: 'param', param: 'status', value: 'a' }], salient: true },
        { reachesExit: 'classify/return@if-else', arrange: [{ kind: 'param', param: 'status', value: 'b' }], salient: true },
        { reachesExit: 'classify/return@if-else', arrange: [{ kind: 'param', param: 'status', value: 'c' }], salient: false },
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
        { reachesExit: "routeLabel/return@switch:'get'", arrange: [{ kind: 'param', param: 'method', value: 'get' }], salient: true },
        { reachesExit: "routeLabel/return@switch:'post'", arrange: [{ kind: 'param', param: 'method', value: 'post' }], salient: true },
        { reachesExit: 'routeLabel/return@switch:default', arrange: [{ kind: 'param', param: 'method', value: 'delete' }], salient: true },
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

      expect(result.cases).toStrictEqual([{ reachesExit: 'run/exit@implicit', arrange: [], salient: true }]);
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

      expect(result).toStrictEqual({ cases: [], unreachableExits: [], undrivenBranches: [{ line: 3 }] });
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

      expect(result).toStrictEqual({ cases: [], unreachableExits: [], undrivenBranches: [{ line: 3, operand: 'u' }] });
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

      expect(result).toStrictEqual({ cases: [], unreachableExits: [], undrivenBranches: [{ line: 3, operand: 'config.mode' }] });
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
          { reachesExit: 'mod/exit@then', arrange: [{ kind: 'env', name: 'VALUE', value: '6' }], salient: true },
          { reachesExit: 'mod/exit@else', arrange: [{ kind: 'env', name: 'VALUE', value: '5' }], salient: true },
        ],
        unreachableExits: [],
        undrivenBranches: [],
      });
    });

    // The SAME branch is un-steerable when the entry is NOT env-driven — a function's captured `const`
    // is frozen by the time it is called, so setting the variable then changes nothing.
    it('VALID: {an env operand, NOT envDrivable} => un-steerable, so no case and the branch admitted undriven', () => {
      const result = deriveCasesTransformer({ params: [], branches: [ENV_BRANCH], exits: ENV_EXITS, envDrivable: false });

      expect(result).toStrictEqual({ cases: [], unreachableExits: [], undrivenBranches: [{ line: 3, operand: 'value' }] });
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
        { reachesExit: 'pred/return@top', arrange: [{ kind: 'param', param: 'size', value: 51 }], salient: true },
        { reachesExit: 'pred/return@top', arrange: [{ kind: 'param', param: 'size', value: 50 }], salient: true },
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
        cases: [{ reachesExit: 'pred/return@top', arrange: [{ kind: 'param', param: 'size', value: 7 }], salient: true }],
        unreachableExits: [],
        undrivenBranches: [],
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
        { reachesExit: 'tally/return@top', arrange: [{ kind: 'param', param: 'a', value: 6 }, { kind: 'param', param: 'b', value: 6 }], salient: true },
        { reachesExit: 'tally/return@top', arrange: [{ kind: 'param', param: 'a', value: 6 }, { kind: 'param', param: 'b', value: 5 }], salient: false },
        { reachesExit: 'tally/return@top', arrange: [{ kind: 'param', param: 'a', value: 5 }, { kind: 'param', param: 'b', value: 6 }], salient: false },
        { reachesExit: 'tally/return@top', arrange: [{ kind: 'param', param: 'a', value: 5 }, { kind: 'param', param: 'b', value: 5 }], salient: false },
      ]);
    });
  });
});
