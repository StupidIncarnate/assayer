import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-literal.ts'), 'utf8');
const relPath = 'src/happy-path/array/const-literal/const-literal.ts';

describe('array / const-literal — a branchless function over a LOCAL const array literal', () => {
  // The array lives in a local `const items = [1, 2, 3]`, not in a param, so there is no array to fan
  // out over cardinality. An array PARAM derives the empty/one/many breadth (three converging cases);
  // a const literal has no input to vary, so `derive-cases` emits exactly ONE case reaching the one
  // exit, and its `arrange` is EMPTY — the function takes no arguments. The return reads as `number`
  // (`items.length`). Branchless and DRIVEN with that single case.
  it('VALID: {export function three(): number { const items = [1, 2, 3]; return items.length }} => no params, one derived case with empty arrange', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'three',
          scopePath: ['*module*', 'three'],
          params: [],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/three/return@top', kind: 'return', guardPath: [], line: 3 }],
        cases: [
          {
            reachesExit: '*module*/three/return@top',
            arrange: [],
            salient: true,
          },
        ],
      },
    ]);
  });

  // A local const array declares no OBJECT shape, and a builtin `.length` read is not one of the
  // resolver's reportable callees, so nothing is admitted: no declared types, no dark spot, no
  // undriven, no lint.
  it('VALID: {a local const array literal, a builtin `.length` read} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
