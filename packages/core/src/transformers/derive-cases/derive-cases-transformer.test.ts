import { ParamDescriptorStub, BranchNodeStub, ExitNodeStub, TypeDescriptorStub } from '@assayer/shared/contracts';

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
        { reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }] },
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
        { reachesExit: 'formatGreeting/return@if-else', arrange: [{ kind: 'param', param: 'name', value: 'a' }] },
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
        },
      ]);
    });

    // The bug this whole decomposition exists for: read as ONE opaque operand, both arms derived the
    // SAME arrange values, so the then-case and the else-case were identical and one of them claimed
    // an exit its own values cannot reach. Two DISTINCT causes, two distinct arrangements.
    it('VALID: {a && b, else} => TWO cases: a failed (b never ran), or a held and b failed', () => {
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
            { kind: 'param', param: 'bonus', value: 0 },
          ],
        },
        {
          reachesExit: 'grade/return@else',
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 1 },
          ],
        },
      ]);
    });

    it('VALID: {a || b, then} => TWO cases, since a disjunction holds two ways', () => {
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
        },
        {
          reachesExit: 'alarm/return@then',
          arrange: [
            { kind: 'param', param: 'temp', value: 50 },
            { kind: 'param', param: 'smoke', value: true },
          ],
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
        { reachesExit: 'gate/return@then', arrange: [{ kind: 'param', param: 'ready', value: false }] },
        { reachesExit: 'gate/return@else', arrange: [{ kind: 'param', param: 'ready', value: true }] },
      ]);
    });
  });

  describe('literal-union operand', () => {
    it('VALID: {eq on a 3-member union} => then binds the member, else fans out one case per other member', () => {
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
        { reachesExit: 'classify/return@if-then', arrange: [{ kind: 'param', param: 'status', value: 'a' }] },
        { reachesExit: 'classify/return@if-else', arrange: [{ kind: 'param', param: 'status', value: 'b' }] },
        { reachesExit: 'classify/return@if-else', arrange: [{ kind: 'param', param: 'status', value: 'c' }] },
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
        { reachesExit: "routeLabel/return@switch:'get'", arrange: [{ kind: 'param', param: 'method', value: 'get' }] },
        { reachesExit: "routeLabel/return@switch:'post'", arrange: [{ kind: 'param', param: 'method', value: 'post' }] },
        { reachesExit: 'routeLabel/return@switch:default', arrange: [{ kind: 'param', param: 'method', value: 'delete' }] },
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

      expect(result.cases).toStrictEqual([{ reachesExit: 'run/exit@implicit', arrange: [] }]);
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
});
