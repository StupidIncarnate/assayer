import { BranchNodeStub, ExitNodeStub, symbolNameContract } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { funnelCasesTransformer } from './funnel-cases-transformer';

// A callback `(n) => { if (n > 5) return 'big'; return 'small'; }` — a then-exit and an else-exit keyed
// on its own `n > 5` branch, exactly like a private function's branch.
const N_BRANCH = BranchNodeStub({
  coverageId: 'cb/if:n',
  condition: {
    kind: 'leaf',
    id: 'cb/if:n#leaf',
    operandParamName: 'n',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  },
});
const THEN_EXIT = ExitNodeStub({ coverageId: 'cb/return@then', guardPath: [{ branchCoverageId: 'cb/if:n', arm: 'then' }], line: 3 });
const ELSE_EXIT = ExitNodeStub({ coverageId: 'cb/return@else', guardPath: [{ branchCoverageId: 'cb/if:n', arm: 'else' }], line: 5 });

const CALLBACK = ScopeRecordStub({
  scopePath: ['*module*', 'run', 'cb'],
  name: 'cb',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  startLine: 2,
  endLine: 5,
  branches: [N_BRANCH],
  exits: [THEN_EXIT, ELSE_EXIT],
});

const SURFACE_EXIT = ExitNodeStub({ coverageId: 'run/return@top', guardPath: [], line: 2 });

describe('funnelCasesTransformer', () => {
  describe('a branchless surface mapping a branching callback over its array param', () => {
    const SURFACE = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [SURFACE_EXIT],
    });

    it('VALID: {items.map((n) => …)} => empty, one per distinguished element, and the arm-crossing pair, each pathing through the surface exit', () => {
      const result = funnelCasesTransformer({ surface: SURFACE, callbacks: [{ callback: CALLBACK, arrayParam: symbolNameContract.parse('items') }] });

      expect(result).toStrictEqual([
        { reachesPath: ['run/return@top'], arrange: [{ kind: 'array', param: 'items', value: [] }], salient: true },
        { reachesPath: ['cb/return@then', 'run/return@top'], arrange: [{ kind: 'array', param: 'items', value: [6] }], salient: true },
        { reachesPath: ['cb/return@else', 'run/return@top'], arrange: [{ kind: 'array', param: 'items', value: [5] }], salient: true },
        {
          reachesPath: ['cb/return@then', 'cb/return@else', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [6, 5] }],
          salient: true,
        },
      ]);
    });
  });

  describe('a surface with a sibling scalar param the callback does not steer', () => {
    const SURFACE = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [
        { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
        { name: 'factor', type: { kind: 'number' } },
      ],
      returnType: { kind: 'array', element: { kind: 'string' } },
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [SURFACE_EXIT],
    });

    it('VALID: {surface also takes factor} => factor is filled representatively in every funnel case, in surface param order', () => {
      const result = funnelCasesTransformer({ surface: SURFACE, callbacks: [{ callback: CALLBACK, arrayParam: symbolNameContract.parse('items') }] });

      expect(result).toStrictEqual([
        {
          reachesPath: ['run/return@top'],
          arrange: [
            { kind: 'array', param: 'items', value: [] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'run/return@top'],
          arrange: [
            { kind: 'array', param: 'items', value: [6] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
        {
          reachesPath: ['cb/return@else', 'run/return@top'],
          arrange: [
            { kind: 'array', param: 'items', value: [5] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'cb/return@else', 'run/return@top'],
          arrange: [
            { kind: 'array', param: 'items', value: [6, 5] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
      ]);
    });
  });

  describe('a surface with no exit to funnel through', () => {
    const SURFACE = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [],
    });

    it('EMPTY: {surface has no exits} => no funnel cases', () => {
      const result = funnelCasesTransformer({ surface: SURFACE, callbacks: [{ callback: CALLBACK, arrayParam: symbolNameContract.parse('items') }] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a surface with no callbacks to funnel', () => {
    const SURFACE = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
      startLine: 1,
      endLine: 3,
      branches: [],
      exits: [SURFACE_EXIT],
    });

    it('EMPTY: {no callbacks} => no funnel cases', () => {
      const result = funnelCasesTransformer({ surface: SURFACE, callbacks: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a surface mapping TWO branching callbacks over TWO array params', () => {
    // A second callback `(m) => m` — branchless with a single exit, mapped over a second array param
    // `others`. Its start line is AFTER the first callback, so it fires second: the cartesian's inner axis.
    const CB_B_EXIT = ExitNodeStub({ coverageId: 'cbb/return@top', guardPath: [], line: 7 });
    const CALLBACK_B = ScopeRecordStub({
      scopePath: ['*module*', 'run', 'cbb'],
      name: 'cbb',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'm', type: { kind: 'number' } }],
      returnType: { kind: 'number' },
      startLine: 6,
      endLine: 7,
      branches: [],
      exits: [CB_B_EXIT],
    });

    const SURFACE = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [
        { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
        { name: 'others', type: { kind: 'array', element: { kind: 'number' } } },
      ],
      returnType: { kind: 'array', element: { kind: 'string' } },
      startLine: 1,
      endLine: 8,
      branches: [],
      exits: [SURFACE_EXIT],
    });

    // The funnel is the CARTESIAN of each callback's per-element funnel. `items` (branching callback)
    // fans over four shapes — empty, `[6]` (then), `[5]` (else), the pair `[6, 5]`; `others` (branchless
    // callback) fans over two — empty and `[7]`. That is 4 × 2 = 8 cases, ordered by fire order (the
    // `items` callback fires first, so it is the outer axis), every case arranging BOTH arrays (never a
    // scalar), and every path threading the `items` callback's exit(s), then the `others` callback's,
    // then the surface's return.
    it('VALID: {run maps two callbacks over items and others} => the 8-case cartesian, both arrays arranged, paths in fire order', () => {
      const result = funnelCasesTransformer({
        surface: SURFACE,
        callbacks: [
          { callback: CALLBACK, arrayParam: symbolNameContract.parse('items') },
          { callback: CALLBACK_B, arrayParam: symbolNameContract.parse('others') },
        ],
      });

      expect(result).toStrictEqual([
        {
          reachesPath: ['run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [] }, { kind: 'array', param: 'others', value: [] }],
          salient: true,
        },
        {
          reachesPath: ['cbb/return@top', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [] }, { kind: 'array', param: 'others', value: [7] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [6] }, { kind: 'array', param: 'others', value: [] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'cbb/return@top', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [6] }, { kind: 'array', param: 'others', value: [7] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@else', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [5] }, { kind: 'array', param: 'others', value: [] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@else', 'cbb/return@top', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [5] }, { kind: 'array', param: 'others', value: [7] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'cb/return@else', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [6, 5] }, { kind: 'array', param: 'others', value: [] }],
          salient: true,
        },
        {
          reachesPath: ['cb/return@then', 'cb/return@else', 'cbb/return@top', 'run/return@top'],
          arrange: [{ kind: 'array', param: 'items', value: [6, 5] }, { kind: 'array', param: 'others', value: [7] }],
          salient: true,
        },
      ]);
    });
  });
});
