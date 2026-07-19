import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'cross-file-guards.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/cross-file-guards/cross-file-guards.ts';
const walked = tsMorphWalkFileAdapter({ source, relPath });
const analysis = analyzeFileBroker({ walked });
const graph = moduleGraphProjectionTransformer({ walked });
const upload = analysis.functions[0];

describe('unreachable / cross-file-guards — two imported predicates guarding one value, whose thresholds contradict', () => {
  // The bug, stated once: `exceedsLimit` returns for everything over 50, so `size` is at most 50 by the
  // second guard, and `withinBudget`'s `> 100` can never hold. `'priority'` is dead. It is dead in
  // neither file alone — `upload` never names a threshold, and each predicate is correct by itself.
  it('VALID: {two imported guards} => three exits, the middle one reached only through both calls', () => {
    expect(upload.exits.map((exit) => ({ arms: exit.guardPath.map((step) => String(step.arm)), line: exit.line }))).toStrictEqual([
      { arms: ['then'], line: 6 },
      { arms: ['else', 'then'], line: 10 },
      { arms: ['else', 'else'], line: 13 },
    ]);
  });

  // THE RATCHET, first half: the guards are OPAQUE. A call in a condition reads as a bare truthiness
  // check on `any` — the hermetic walk cannot type an imported callee, so neither threshold reaches the
  // branch model. Whatever resolves this must put the callee's returned comparison in the caller's
  // hands; a guard path of two `truthy` leaves carries no arithmetic to do.
  it('VALID: {if (exceedsLimit(size))} => an opaque truthiness leaf, the threshold nowhere in the model', () => {
    expect(upload.branches.map((branch) => branch.condition)).toStrictEqual([
      expect.objectContaining({ kind: 'leaf', operandType: { kind: 'unknown', text: 'any' }, predicate: { kind: 'truthy' } }),
      expect.objectContaining({ kind: 'leaf', operandType: { kind: 'unknown', text: 'any' }, predicate: { kind: 'truthy' } }),
    ]);
  });

  // THE RATCHET, second half, and the more surprising one: the import EDGES are recorded but the calls
  // are not. A call sited in an `if` condition leaves no reference for the stitch to resolve, so the
  // link `upload → exceedsLimit` does not exist even as an unresolved fact. Cross-file driving cannot
  // start from a graph that never marked the call — this is the first thing the rung has to fix.
  it('VALID: {calls inside if-conditions} => two import edges and no call references at all', () => {
    expect(graph).toStrictEqual({
      edges: [
        { kind: 'import', specifier: './exceeds-limit', bindings: [{ kind: 'named', name: 'exceedsLimit' }], line: 1, column: 1 },
        { kind: 'import', specifier: './within-budget', bindings: [{ kind: 'named', name: 'withinBudget' }], line: 2, column: 1 },
      ],
      references: [],
      globalUses: [],
    });
  });

  // THE RATCHET, third half: with both guards opaque there is no domain to pick from, so all three
  // cases arrange the same 0 and two of them fail against correct code. Nothing admits the blindness —
  // no dark spot, no undriven entry — so the analysis reads as complete while understanding neither
  // guard. Flip all of this together when the callee's constraint reaches the caller.
  it('VALID: {an unseeable guard} => one value for every exit, and no channel admits the gap', () => {
    expect({
      arranged: upload.cases.map((testCase) => testCase.arrange),
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      arranged: [
        [{ kind: 'param', param: 'size', value: 0 }],
        [{ kind: 'param', param: 'size', value: 0 }],
        [{ kind: 'param', param: 'size', value: 0 }],
      ],
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
