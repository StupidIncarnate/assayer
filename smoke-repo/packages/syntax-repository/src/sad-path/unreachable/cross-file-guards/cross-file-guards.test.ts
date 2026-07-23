import { readFileSync } from 'fs';
import { resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { composeCrossFilePredicatesBroker } from '@assayer/core/compose-cross-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

// The compose is a CONSUME-TIME overlay: the per-file blob never reads another file, so the caller's
// opaque `if (exceedsLimit(size))` guard is joined to its sibling definition here, exactly as a run
// does — root is the repo root the run passes, relPath the caller's path under it.
const relPath = 'packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/cross-file-guards.ts';
const root = resolve(__dirname, '../../../../../..');
const source = readFileSync(resolve(root, relPath), 'utf8');
const walked = tsMorphWalkFileAdapter({ source, relPath });
const analysis = composeCrossFilePredicatesBroker({ analysis: analyzeFileBroker({ walked }), walked, root, relPath });
const graph = moduleGraphProjectionTransformer({ walked });
const upload = analysis.functions[0];

describe('unreachable / cross-file-guards — two imported predicates guarding one value, whose thresholds contradict', () => {
  // The contradiction, stated once: `exceedsLimit` returns for everything over 50, so `size` is at most
  // 50 by the second guard, and `withinBudget`'s `> 100` can never hold. `'priority'` is dead. It is
  // dead in neither file alone — `upload` never names a threshold, and each predicate is correct by
  // itself — so only composing the two exposes it.
  it('VALID: {two imported guards} => three exits, the middle one reached only through both calls', () => {
    expect(upload.exits.map((exit) => ({ arms: exit.guardPath.map((step) => String(step.arm)), line: exit.line }))).toStrictEqual([
      { arms: ['then'], line: 6 },
      { arms: ['else', 'then'], line: 10 },
      { arms: ['else', 'else'], line: 13 },
    ]);
  });

  // The compose reaches each imported callee, reads its published predicate signature, and rebases it
  // onto the argument `upload` passed: the opaque truthy leaf over `exceedsLimit(size)` becomes `size >
  // 50`, and the one over `withinBudget(size)` becomes `size > 100`. The branch coverage ids and line
  // spans are preserved, so the exits keyed under them still join.
  it('VALID: {if (exceedsLimit(size))} => the callee threshold rebased onto size, in the caller coverage space', () => {
    expect(upload.branches).toStrictEqual([
      {
        coverageId: '*module*/upload/if:CallExpression,id:exceedsLimit,id:size',
        kind: 'if',
        condition: {
          kind: 'leaf',
          id: '*module*/upload/if:CallExpression,id:exceedsLimit,id:size#leaf',
          operandParamName: 'size',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
        startLine: 5,
        endLine: 7,
      },
      {
        coverageId: '*module*/upload/if:CallExpression,id:withinBudget,id:size',
        kind: 'if',
        condition: {
          kind: 'leaf',
          id: '*module*/upload/if:CallExpression,id:withinBudget,id:size#leaf',
          operandParamName: 'size',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 100 },
        },
        startLine: 9,
        endLine: 11,
      },
    ]);
  });

  // Enrichment is RE-DERIVED off the composed branches, not carried through from the persisted blob:
  // the opaque `truthy` call-leaves had no param operand and enriched only the `size` param line, but
  // once each leaf becomes `size > 50` / `size > 100`, both guard lines carry `size`'s range. The
  // persisted blob would show only the entry-param row; the overlay must show all three.
  it('VALID: {the composed guards} => enrichment carries the param line and both rebased guard lines', () => {
    expect(analysis.enrichment).toStrictEqual([
      { line: 4, symbol: 'size', typeText: 'number' },
      { line: 5, symbol: 'size', typeText: 'number', range: [51, 50] },
      { line: 9, symbol: 'size', typeText: 'number', range: [101, 100] },
    ]);
  });

  // With both thresholds in the model, derive-cases yields the full input-bucket set. The first exit
  // (`rejected`, line 6) is reached by TWO buckets: 101 (both guards would hold) and 100 (the off-path
  // bucket where `withinBudget` fails but `upload` has already returned before it runs) — same exit,
  // same value, so 101 is salient and 100 is the grayed breadth twin. The last exit (`queued`, line 13)
  // takes 50. The middle exit is UNREACHABLE — dead code the repo owns, so it rides the LINT channel
  // with the two guard lines that contradict. Nothing is admitted on the other channels: the guards are
  // understood perfectly, so no dark spot and no undriven entry.
  it('VALID: {the composed guards} => three cases (one grayed) and an unreachable-exit lint, no other admission', () => {
    expect({
      arranged: upload.cases,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      arranged: [
        {
          reachesExit: '*module*/upload/return@if:CallExpression,id:exceedsLimit,id:size#then',
          arrange: [{ kind: 'param', param: 'size', value: 101 }],
          salient: true,
        },
        {
          reachesExit: '*module*/upload/return@if:CallExpression,id:exceedsLimit,id:size#then',
          arrange: [{ kind: 'param', param: 'size', value: 100 }],
          salient: false,
        },
        {
          reachesExit: '*module*/upload/return@if:CallExpression,id:exceedsLimit,id:size#else/if:CallExpression,id:withinBudget,id:size#else',
          arrange: [{ kind: 'param', param: 'size', value: 50 }],
          salient: true,
        },
      ],
      darkSpots: [],
      undriven: [],
      lints: [
        {
          rule: 'unreachable-exit',
          name: 'upload',
          message:
            '`upload` can never reach the exit on line 10: the guards on lines 5, 9 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
          startLine: 10,
          endLine: 10,
        },
      ],
    });
  });

  // The module graph is what the compose reconciles against: each call sited in an `if` condition is
  // recorded as an import reference (keyed at the call site inside each guard, L5/L9), beside the two
  // import edges. That reference IS the foreign key the overlay follows to the sibling predicate.
  it('VALID: {calls inside if-conditions} => two import edges AND their two call references', () => {
    expect(graph).toStrictEqual({
      edges: [
        { kind: 'import', specifier: './exceeds-limit', bindings: [{ kind: 'named', name: 'exceedsLimit' }], line: 1, column: 1 },
        { kind: 'import', specifier: './within-budget', bindings: [{ kind: 'named', name: 'withinBudget' }], line: 2, column: 1 },
      ],
      references: [
        { specifier: './exceeds-limit', importedName: 'exceedsLimit', line: 5, column: 7 },
        { specifier: './within-budget', importedName: 'withinBudget', line: 9, column: 7 },
      ],
      globalUses: [],
      envReads: [],
    });
  });
});
