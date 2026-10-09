import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'map-conditional.ts'), 'utf8');
const relPath = 'src/happy-path/array/map-conditional/map-conditional.ts';

// The callback `(n) => { … }` is anonymous, so its scope segment is the spelling-invariant STRUCTURAL
// projection of the arrow (node kinds + leaf values) — the identity two different anonymous arrows
// differ by. Coverage IDs are cache-internal, so this string's exact shape is not load-bearing; what it
// pins is that the callback's exits attach UNDER rescale's scope path, where the logic lives — so the
// funnel's paths thread through `*module*/rescale/<CB>/…` before returning by rescale's own exit.
const CB =
  'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:n,' +
  'GreaterThanToken,num:100,Block,ReturnStatement,BinaryExpression,BinaryExpression,id:n,AsteriskToken,' +
  'num:2,MinusToken,num:1,IfStatement,BinaryExpression,id:n,LessThanToken,num:0,Block,ReturnStatement,' +
  'BinaryExpression,BinaryExpression,id:n,AsteriskToken,id:n,PlusToken,num:10,ReturnStatement,' +
  'BinaryExpression,id:n,PlusToken,num:10';
const CB_PATH = `*module*/rescale/${CB}`;
const GT100 = 'if:BinaryExpression,id:n,GreaterThanToken,num:100';
const LT0 = 'if:BinaryExpression,id:n,LessThanToken,num:0';

// The three callback exits — one per arm of `n > 100` / `n < 0` — and rescale's own single return.
const CB_THEN = `${CB_PATH}/return@${GT100}#then`;
const CB_ELSE_THEN = `${CB_PATH}/return@${GT100}#else/${LT0}#then`;
const CB_ELSE_ELSE = `${CB_PATH}/return@${GT100}#else/${LT0}#else`;
const RESCALE_EXIT = '*module*/rescale/return@top';

describe('array / map-conditional — `items.map((n) => …)` whose callback BRANCHES on the element, funnelled into rescale', () => {
  // THE capability. The callback is not called directly — nothing can call an anonymous arrow, and it
  // cannot be reached without calling `rescale`. So it is no separate entry: its steering values FUNNEL
  // into rescale's OWN case set. rescale is the only entry, and each case is an array shape that drives
  // the callback, predicting the ordered PATH the flow reaches — the callback's exit(s), then rescale's
  // return. `[]` runs the callback zero times (path is rescale's exit alone); `[101]`/`[-1]`/`[100]` each
  // take one arm (`n > 100`, `n < 0`, fall-through) then return; `[101, -1]` crosses two arms in one
  // array, firing the callback once per element. Each value is an INPUT (P4); the case asserts only the
  // reached PATH. This is the array/element twin of composition/nested-function, funnelled one rung up.
  it('VALID: {a map callback branching on n} => FUNNELLED into rescale as its single entry, array shapes driving each arm', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'map-conditional.ts') }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'rescale',
        label: undefined,
        access: { kind: 'named' },
        cases: [
          { reachesPath: [RESCALE_EXIT], arrange: [{ kind: 'array', param: 'items', value: [] }], salient: true },
          { reachesPath: [CB_THEN, RESCALE_EXIT], arrange: [{ kind: 'array', param: 'items', value: [101] }], salient: true },
          { reachesPath: [CB_ELSE_THEN, RESCALE_EXIT], arrange: [{ kind: 'array', param: 'items', value: [-1] }], salient: true },
          { reachesPath: [CB_ELSE_ELSE, RESCALE_EXIT], arrange: [{ kind: 'array', param: 'items', value: [100] }], salient: true },
          {
            reachesPath: [CB_THEN, CB_ELSE_THEN, RESCALE_EXIT],
            arrange: [{ kind: 'array', param: 'items', value: [101, -1] }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The dead-surface lint is GONE, not merely quieter: the callback is reached, so it is not dead code.
  // Nothing is admitted — the walk read every arm and each drives through rescale's funnel. A file that
  // once mis-reported "delete this callback" now reports one driven entry.
  it('VALID: {a reached, funnelled callback} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'map-conditional.ts') }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
