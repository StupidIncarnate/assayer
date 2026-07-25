import { BranchNodeStub, ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { funnelNamedCasesTransformer } from './funnel-named-cases-transformer';

// A branching private `inner(n)` on `n > 5`, with a then-exit and an else-exit keyed on it — the shape
// a same-file private that a surface returns takes.
const N_BRANCH = BranchNodeStub({
  coverageId: 'inner/if:n',
  condition: { kind: 'leaf', id: 'inner/if:n#leaf', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
});
const INNER_THEN = ExitNodeStub({ coverageId: 'inner/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'then' }], line: 3 });
const INNER_ELSE = ExitNodeStub({ coverageId: 'inner/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'else' }], line: 6 });
const INNER = ScopeRecordStub({
  scopePath: ['*module*', 'outer', 'inner'],
  name: 'inner',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  startLine: 2,
  endLine: 7,
  branches: [N_BRANCH],
  exits: [INNER_THEN, INNER_ELSE],
});

describe('funnelNamedCasesTransformer', () => {
  describe('a branchless surface returning a branching private by passthrough', () => {
    it('VALID: {outer returns inner(value)} => inner funnels into outer, each case pathing through inner then outer', () => {
      const outer = ScopeRecordStub({
        scopePath: ['*module*', 'outer'],
        name: 'outer',
        access: { kind: 'named' },
        params: [{ name: 'value', type: { kind: 'number' } }],
        startLine: 1,
        endLine: 9,
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'outer/return@top', kind: 'return', guardPath: [], line: 9 })],
        calls: [
          CallSiteStub({
            callee: { target: 'local', name: 'inner', startLine: 2 },
            args: [{ kind: 'param-ref', paramName: 'value' }],
            guardPath: [],
            position: { line: 9, column: 10 },
          }),
        ],
      });

      const result = funnelNamedCasesTransformer({ scope: outer, scopes: [outer, INNER], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [
          { reachesPath: ['inner/return@then', 'outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 6 }], salient: true },
          { reachesPath: ['inner/return@else', 'outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: true },
        ],
        unreachable: [],
        consumed: [{ name: 'inner', startLine: 2 }],
        unfillable: [],
      });
    });
  });

  describe('a funnelled private whose own parameter the fill seam refuses', () => {
    // The private is no entry of its own once it funnels, so a parameter IT declares and nothing can
    // build has nowhere else to be said: dropped here, the surface derives nothing and admits nothing,
    // which is byte-identical to a surface with nothing to test.
    const SINK_INNER = ScopeRecordStub({
      scopePath: ['*module*', 'outer', 'inner'],
      name: 'inner',
      exported: false,
      access: { kind: 'unreachable' },
      params: [
        { name: 'n', type: { kind: 'number' } },
        { name: 'cb', type: { kind: 'callable', text: '(m: number) => void' } },
      ],
      startLine: 2,
      endLine: 7,
      branches: [N_BRANCH],
      exits: [INNER_THEN, INNER_ELSE],
    });

    it('VALID: {inner also takes a callback} => no case, and the refusal rides up tagged with the private', () => {
      const outer = ScopeRecordStub({
        scopePath: ['*module*', 'outer'],
        name: 'outer',
        access: { kind: 'named' },
        params: [{ name: 'value', type: { kind: 'number' } }],
        startLine: 1,
        endLine: 9,
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'outer/return@top', kind: 'return', guardPath: [], line: 9 })],
        calls: [
          CallSiteStub({
            callee: { target: 'local', name: 'inner', startLine: 2 },
            args: [{ kind: 'param-ref', paramName: 'value' }, { kind: 'callback', startLine: 9 }],
            guardPath: [],
            position: { line: 9, column: 10 },
          }),
        ],
      });

      const result = funnelNamedCasesTransformer({ scope: outer, scopes: [outer, SINK_INNER], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [],
        unreachable: [],
        consumed: [{ name: 'inner', startLine: 2 }],
        unfillable: [{ param: 'cb', type: '(m: number) => void', owner: 'inner' }],
      });
    });
  });

  describe('a paramless surface welding a literal into the private it returns', () => {
    it('VALID: {report returns inner(3)} => the live arm is one funnel case, the dead arm an unreachable exit naming the private', () => {
      const report = ScopeRecordStub({
        scopePath: ['*module*', 'report'],
        name: 'report',
        access: { kind: 'named' },
        params: [],
        startLine: 1,
        endLine: 9,
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'report/return@top', kind: 'return', guardPath: [], line: 9 })],
        calls: [
          CallSiteStub({
            callee: { target: 'local', name: 'inner', startLine: 2 },
            args: [{ kind: 'literal', value: 3 }],
            guardPath: [],
            position: { line: 9, column: 10 },
          }),
        ],
      });

      const result = funnelNamedCasesTransformer({ scope: report, scopes: [report, INNER], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [{ reachesPath: ['inner/return@else', 'report/return@top'], arrange: [], salient: true }],
        unreachable: [{ line: 3, guardLines: [2], welded: { line: 2, operand: 'n', value: 3 }, displayName: 'inner' }],
        consumed: [{ name: 'inner', startLine: 2 }],
        unfillable: [],
      });
    });
  });

  describe('a surface returning a private that itself returns a deeper private (transitive)', () => {
    // `middle(m)` on `m > 5` returns `inner(m)` in its then-arm and a literal in its else-arm; `inner(i)`
    // branches on `i > 10`. The two hops fold into `outer`, its three cases each carrying the full path.
    const I_BRANCH = BranchNodeStub({
      coverageId: 'middle/inner/if:i',
      startLine: 7,
      condition: { kind: 'leaf', id: 'middle/inner/if:i#leaf', operandParamName: 'i', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 10 } },
    });
    const DEEP_INNER = ScopeRecordStub({
      scopePath: ['*module*', 'middle', 'inner'],
      name: 'inner',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'i', type: { kind: 'number' } }],
      startLine: 6,
      endLine: 12,
      branches: [I_BRANCH],
      exits: [
        ExitNodeStub({ coverageId: 'middle/inner/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'middle/inner/if:i', arm: 'then' }], line: 8 }),
        ExitNodeStub({ coverageId: 'middle/inner/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'middle/inner/if:i', arm: 'else' }], line: 11 }),
      ],
    });
    const M_BRANCH = BranchNodeStub({
      coverageId: 'middle/if:m',
      startLine: 14,
      condition: { kind: 'leaf', id: 'middle/if:m#leaf', operandParamName: 'm', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
    });
    const MIDDLE = ScopeRecordStub({
      scopePath: ['*module*', 'middle'],
      name: 'middle',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'm', type: { kind: 'number' } }],
      startLine: 5,
      endLine: 19,
      branches: [M_BRANCH],
      exits: [
        ExitNodeStub({ coverageId: 'middle/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'middle/if:m', arm: 'then' }], line: 15 }),
        ExitNodeStub({ coverageId: 'middle/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'middle/if:m', arm: 'else' }], line: 18 }),
      ],
      calls: [
        CallSiteStub({
          callee: { target: 'local', name: 'inner', startLine: 6 },
          args: [{ kind: 'param-ref', paramName: 'm' }],
          guardPath: [{ branchCoverageId: 'middle/if:m', arm: 'then' }],
          position: { line: 15, column: 12 },
        }),
      ],
    });
    const OUTER = ScopeRecordStub({
      scopePath: ['*module*', 'outer'],
      name: 'outer',
      access: { kind: 'named' },
      params: [{ name: 'value', type: { kind: 'number' } }],
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [ExitNodeStub({ coverageId: 'outer/return@top', kind: 'return', guardPath: [], line: 2 })],
      calls: [
        CallSiteStub({
          callee: { target: 'local', name: 'middle', startLine: 5 },
          args: [{ kind: 'param-ref', paramName: 'value' }],
          guardPath: [],
          position: { line: 2, column: 10 },
        }),
      ],
    });

    it('VALID: {outer returns middle returns inner} => both hops funnel into outer, deepest exit innermost', () => {
      const result = funnelNamedCasesTransformer({ scope: OUTER, scopes: [OUTER, MIDDLE, DEEP_INNER], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [
          {
            reachesPath: ['middle/inner/return@then', 'middle/return@then', 'outer/return@top'],
            arrange: [{ kind: 'param', param: 'value', value: 11 }],
            salient: true,
          },
          {
            reachesPath: ['middle/inner/return@else', 'middle/return@then', 'outer/return@top'],
            arrange: [{ kind: 'param', param: 'value', value: 10 }],
            salient: true,
          },
          { reachesPath: ['middle/return@else', 'outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: true },
        ],
        unreachable: [],
        consumed: [
          { name: 'middle', startLine: 5 },
          { name: 'inner', startLine: 6 },
        ],
        unfillable: [],
      });
    });
  });

  describe('a middle hop that branches on a param the deeper call does not steer', () => {
    // `middle(flag, m)`: branches on `flag`, and only in its THEN arm returns `inner(m)` — `m` is welded
    // to a literal by `outer`, and `flag` is passed straight through unwelded. `flag` decides which of
    // middle's OWN arms this case reaches, but nothing steers it into the deeper call to `inner`, so the
    // rebased arrange must keep the value THIS scope's own derivation arranged for `flag` — not silently
    // re-fill it, which could arrange a value that does not reach the exit `reachesPath` claims (here,
    // the representative fill for a boolean is `false`, which would falsely claim the ELSE arm reaches
    // the THEN exit).
    const I_BRANCH = BranchNodeStub({
      coverageId: 'middle/inner/if:i',
      startLine: 9,
      condition: { kind: 'leaf', id: 'middle/inner/if:i#leaf', operandParamName: 'i', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 10 } },
    });
    const DEEP_INNER = ScopeRecordStub({
      scopePath: ['*module*', 'middle', 'inner'],
      name: 'inner',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'i', type: { kind: 'number' } }],
      startLine: 8,
      endLine: 12,
      branches: [I_BRANCH],
      exits: [
        ExitNodeStub({ coverageId: 'middle/inner/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'middle/inner/if:i', arm: 'then' }], line: 10 }),
        ExitNodeStub({ coverageId: 'middle/inner/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'middle/inner/if:i', arm: 'else' }], line: 11 }),
      ],
    });
    const FLAG_BRANCH = BranchNodeStub({
      coverageId: 'middle/if:flag',
      startLine: 6,
      condition: { kind: 'leaf', id: 'middle/if:flag#leaf', operandParamName: 'flag', operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } },
    });
    const MIDDLE = ScopeRecordStub({
      scopePath: ['*module*', 'middle'],
      name: 'middle',
      exported: false,
      access: { kind: 'unreachable' },
      params: [
        { name: 'flag', type: { kind: 'boolean' } },
        { name: 'm', type: { kind: 'number' } },
      ],
      startLine: 5,
      endLine: 16,
      branches: [FLAG_BRANCH],
      exits: [
        ExitNodeStub({ coverageId: 'middle/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'middle/if:flag', arm: 'then' }], line: 7 }),
        ExitNodeStub({ coverageId: 'middle/return@else', kind: 'return', guardPath: [{ branchCoverageId: 'middle/if:flag', arm: 'else' }], line: 15 }),
      ],
      calls: [
        CallSiteStub({
          callee: { target: 'local', name: 'inner', startLine: 8 },
          args: [{ kind: 'param-ref', paramName: 'm' }],
          guardPath: [{ branchCoverageId: 'middle/if:flag', arm: 'then' }],
          position: { line: 7, column: 12 },
        }),
      ],
    });
    const OUTER = ScopeRecordStub({
      scopePath: ['*module*', 'outer'],
      name: 'outer',
      access: { kind: 'named' },
      params: [{ name: 'flag', type: { kind: 'boolean' } }],
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [ExitNodeStub({ coverageId: 'outer/return@top', kind: 'return', guardPath: [], line: 2 })],
      calls: [
        CallSiteStub({
          callee: { target: 'local', name: 'middle', startLine: 5 },
          args: [{ kind: 'param-ref', paramName: 'flag' }, { kind: 'literal', value: 3 }],
          guardPath: [],
          position: { line: 2, column: 10 },
        }),
      ],
    });

    it('VALID: {outer(flag) returns middle(flag, 3)} => the funnelled-through case keeps flag TRUE, the leaf case keeps it FALSE', () => {
      const result = funnelNamedCasesTransformer({ scope: OUTER, scopes: [OUTER, MIDDLE, DEEP_INNER], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [
          {
            reachesPath: ['middle/inner/return@else', 'middle/return@then', 'outer/return@top'],
            arrange: [{ kind: 'param', param: 'flag', value: true }],
            salient: true,
          },
          {
            reachesPath: ['middle/return@else', 'outer/return@top'],
            arrange: [{ kind: 'param', param: 'flag', value: false }],
            salient: true,
          },
        ],
        unreachable: [{ line: 10, guardLines: [9], welded: { line: 9, operand: 'i', value: 3 }, displayName: 'inner' }],
        consumed: [
          { name: 'middle', startLine: 5 },
          { name: 'inner', startLine: 8 },
        ],
        unfillable: [],
      });
    });
  });

  describe('a surface that returns no same-file private', () => {
    it('EMPTY: {a surface returning a literal} => its own leaf case, nothing consumed', () => {
      const plain = ScopeRecordStub({
        scopePath: ['*module*', 'plain'],
        name: 'plain',
        access: { kind: 'named' },
        params: [],
        startLine: 1,
        endLine: 3,
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'plain/return@top', kind: 'return', guardPath: [], line: 2 })],
        calls: [],
      });

      const result = funnelNamedCasesTransformer({ scope: plain, scopes: [plain], welds: new Map() });

      expect(result).toStrictEqual({
        cases: [{ reachesPath: ['plain/return@top'], arrange: [], salient: true }],
        unreachable: [],
        consumed: [],
        unfillable: [],
      });
    });
  });
});
