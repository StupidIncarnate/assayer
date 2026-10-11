import { readFileSync } from 'fs';
import { resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { composeCrossFileMapBroker } from '@assayer/core/compose-cross-file-map';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

// The cross-file-map fold is a CONSUME-TIME overlay: the per-file blob never reads another file, so the
// imported callee `bandReading` is resolved to its sibling on disk here, exactly as a run does — root is
// the repo root the run passes, relPath the caller's path under it.
const relPath = 'packages/syntax-repository/src/happy-path/array/cross-file-map/cross-file-map.ts';
const root = resolve(__dirname, '../../../../../..');
const source = readFileSync(resolve(root, relPath), 'utf8');
const walked = walkFileTransformer({ source, relPath, absPath: resolve(root, relPath) });
const analysis = composeCrossFileMapBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath });

// The callee's three band exits live in the SIBLING's coverage space (rooted at the sibling module scope
// and the callee name `bandReading`), NOT the caller's — the fold keeps the sibling's own ids, so the
// folded paths thread `bandReading`'s exit before `bandReadings`'s own return. Coverage ids are
// cache-internal, so these exact strings are not load-bearing; what they pin is that the sibling's arms
// funnel into `bandReadings` and reach at run time.
const HIGH = 'if:BinaryExpression,id:n,GreaterThanEqualsToken,num:80';
const LOW = 'if:BinaryExpression,id:n,LessThanToken,num:20';
const HIGH_EXIT = `*module*/bandReading/return@${HIGH}#then`;
const LOW_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#then`;
const MID_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#else`;
const READINGS_EXIT = '*module*/bandReadings/return@top';

// The sibling's two branches, and its iteration: whether the mapped function's body runs is an arm of
// bandReadings, skipped over an empty array and run over any other. The fewest runs are the skipped route,
// the route through both `else` arms, and the arm-crossing pair: the smallest set that takes all six arms.
const HIGH_BRANCH = `*module*/bandReading/${HIGH}`;
const LOW_BRANCH = `*module*/bandReading/${LOW}`;
const ITERATES = '*module*/bandReading/iterates';
const step = (branchCoverageId: string, arm: string): { branchCoverageId: string; arm: string } => ({ branchCoverageId, arm });

describe('array / cross-file-map — `items.map(bandReading)` whose IMPORTED callee branches, funnelled into bandReadings', () => {
  // THE capability. `bandReading` is imported from a sibling file and mapped over `items`; it cannot be
  // reached without calling `bandReadings`, so it is NO separate entry — its branches FUNNEL into
  // bandReadings' OWN case set, cross-file, exactly as map-conditional funnels an INLINE callback. The
  // sibling's exits keep the sibling's coverage ids, so each folded case predicts the callee's own band
  // exit then bandReadings' return. `[]` runs the callee zero times (path is bandReadings' exit alone);
  // `[80]`/`[19]`/`[79]` each take one band (`n >= 80`, `n < 20`, mid) then return; `[80, 19]` crosses
  // two bands in one array. Each element value is an INPUT the callee's real predicate distinguishes
  // (P4); the case asserts only the reached PATH. This is the CROSS-FILE twin of array/map-conditional.
  it('VALID: {a map over an imported branching function} => FUNNELLED into bandReadings, array shapes driving each band', () => {
    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'bandReadings',
        label: undefined,
        access: { kind: 'named' },
        cases: [
          { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [] }], arms: [step(ITERATES, 'skipped')], driven: true, fewestRuns: true },
          {
            reachesPath: [HIGH_EXIT, READINGS_EXIT],
            arrange: [{ kind: 'array', param: 'items', value: [80] }],
            arms: [step(ITERATES, 'runs'), step(HIGH_BRANCH, 'then')],
            driven: true,
            fewestRuns: false,
          },
          {
            reachesPath: [LOW_EXIT, READINGS_EXIT],
            arrange: [{ kind: 'array', param: 'items', value: [19] }],
            arms: [step(ITERATES, 'runs'), step(HIGH_BRANCH, 'else'), step(LOW_BRANCH, 'then')],
            driven: true,
            fewestRuns: false,
          },
          {
            reachesPath: [MID_EXIT, READINGS_EXIT],
            arrange: [{ kind: 'array', param: 'items', value: [79] }],
            arms: [step(ITERATES, 'runs'), step(HIGH_BRANCH, 'else'), step(LOW_BRANCH, 'else')],
            driven: true,
            fewestRuns: true,
          },
          {
            reachesPath: [HIGH_EXIT, LOW_EXIT, READINGS_EXIT],
            arrange: [{ kind: 'array', param: 'items', value: [80, 19] }],
            arms: [step(ITERATES, 'runs'), step(HIGH_BRANCH, 'then'), step(HIGH_BRANCH, 'else'), step(LOW_BRANCH, 'then')],
            driven: true,
            fewestRuns: true,
          },
        ],
      },
    ]);
  });

  // The host entry's OWN exit unioned with the sibling callee's three band exits its folded cases path
  // through — the cross-file twin of the funnel exit union analyze-file-broker adds for an inline
  // callback, so the interpreter can observe the sibling exit that precedes bandReadings' return.
  it('VALID: {a folded cross-file funnel} => the host entry exposes its own exit plus the sibling`s band exits', () => {
    expect(analysis.functions.map((fn) => fn.exits.map((exit) => String(exit.coverageId)))).toStrictEqual([
      [READINGS_EXIT, HIGH_EXIT, LOW_EXIT, MID_EXIT],
    ]);
  });

  // The callee is reached, so it is not dead code, and each band drives through bandReadings' funnel.
  // Nothing is admitted — the walk read every arm of the sibling and the fold drives them all through
  // the one entry — hence a clean happy-path run.
  it('VALID: {a reached, funnelled cross-file callee} => no dead-surface lint, nothing undriven or dark', () => {
    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
