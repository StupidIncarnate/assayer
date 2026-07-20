import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'class.ts'), 'utf8');
const relPath = 'src/happy-path/class/class.ts';

describe('class — a branchless class method with no explicit constructor', () => {
  // The method is reached through an INSTANCE, and the class declares no constructor, so the runner can
  // build one with no arguments — the method is `constructable` and therefore DRIVEN, not a gap. It is
  // branchless, so it reaches its single return and owes exactly one case for its one exit.
  it('VALID: {class Greeter { greet(name) { return `hi, ${name}` } }} => one constructable method entry, one exit, one case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'greet',
          scopePath: ['*module*', 'Greeter', 'greet'],
          params: [{ name: 'name', type: { kind: 'string' } }],
          returnType: { kind: 'string' },
          line: 2,
          access: { kind: 'method', className: 'Greeter', constructable: true },
        },
        branches: [],
        exits: [{ coverageId: '*module*/Greeter/greet/return@top', kind: 'return', guardPath: [], line: 3 }],
        cases: [
          {
            reachesExit: '*module*/Greeter/greet/return@top',
            arrange: [{ kind: 'param', param: 'name', value: 'abc123' }],
          },
        ],
      },
    ]);
  });

  // Nothing is admitted: a branchless constructable method is fully understood and fully driven.
  it('VALID: {a branchless constructable method} => no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
