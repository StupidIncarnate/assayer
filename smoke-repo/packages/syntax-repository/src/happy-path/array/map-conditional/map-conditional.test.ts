import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'map-conditional.ts'), 'utf8');
const relPath = 'src/happy-path/array/map-conditional/map-conditional.ts';

// The callback `(n) => { … }` is anonymous, so its scope segment is the spelling-invariant STRUCTURAL
// projection of the arrow (node kinds + leaf values) — the identity two different anonymous arrows
// differ by. Coverage IDs are cache-internal, so this string's exact shape is not load-bearing; what it
// pins is that the callback's exits attach UNDER rescale's scope path, where the logic lives.
const CB =
  'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:n,' +
  'GreaterThanToken,num:100,Block,ReturnStatement,BinaryExpression,BinaryExpression,id:n,AsteriskToken,' +
  'num:2,MinusToken,num:1,IfStatement,BinaryExpression,id:n,LessThanToken,num:0,Block,ReturnStatement,' +
  'BinaryExpression,BinaryExpression,id:n,AsteriskToken,id:n,PlusToken,num:10,ReturnStatement,' +
  'BinaryExpression,id:n,PlusToken,num:10';
const CB_PATH = `*module*/rescale/${CB}`;
const GT100 = 'if:BinaryExpression,id:n,GreaterThanToken,num:100';
const LT0 = 'if:BinaryExpression,id:n,LessThanToken,num:0';

describe('array / map-conditional — `items.map((n) => …)` whose callback BRANCHES on the element, driven through rescale', () => {
  // THE capability. The callback is not called directly — nothing can call an anonymous arrow. It is
  // REACHED through `rescale`: calling rescale([...]) runs `.map`, which runs the callback per element.
  // So its branches DRIVE by steering the array rescale receives — a one-element array whose element
  // satisfies each arm: [101] takes `n > 100`, [-1] takes `n < 0`, [100] the fall-through. The callback
  // entry keeps its own identity and exits (coverage attaches where the logic lives); only its ACCESS is
  // `through-caller`, naming rescale. This is the array/element twin of composition/nested-function,
  // where a private is driven through the caller that passes its own param straight in. Each value is an
  // INPUT (P4); the case asserts only that the flow REACHES the callback's exit.
  it('VALID: {a map callback branching on n} => DRIVEN through rescale by steering array elements', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'rescale',
        access: { kind: 'named' },
        cases: [
          { reachesExit: '*module*/rescale/return@top', arrange: [{ kind: 'array', param: 'items', value: [7] }], salient: true },
          { reachesExit: '*module*/rescale/return@top', arrange: [{ kind: 'array', param: 'items', value: [] }], salient: false },
          { reachesExit: '*module*/rescale/return@top', arrange: [{ kind: 'array', param: 'items', value: [7, 7] }], salient: false },
        ],
      },
      {
        name: CB,
        access: { kind: 'through-caller', callerName: 'rescale' },
        cases: [
          { reachesExit: `${CB_PATH}/return@${GT100}#then`, arrange: [{ kind: 'array', param: 'items', value: [101] }], salient: true },
          { reachesExit: `${CB_PATH}/return@${GT100}#else/${LT0}#then`, arrange: [{ kind: 'array', param: 'items', value: [-1] }], salient: true },
          { reachesExit: `${CB_PATH}/return@${GT100}#else/${LT0}#else`, arrange: [{ kind: 'array', param: 'items', value: [100] }], salient: true },
        ],
      },
    ]);
  });

  // The dead-surface lint is GONE, not merely quieter: the callback is reached, so it is not dead code.
  // Nothing is admitted — the walk read every arm and each drives. A file that once mis-reported "delete
  // this callback" now reports a driven entry.
  it('VALID: {a reached, driven callback} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
