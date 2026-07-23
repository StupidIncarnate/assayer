import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'local-shape.ts'), 'utf8');
const relPath = 'src/happy-path/object/local-shape/local-shape.ts';

describe('object / local-shape — a branchless function over a locally-declared interface param', () => {
  // The param types as an OBJECT enumerating the interface's full property list, sorted by name — the
  // walk reads a same-file declared shape rather than dropping it into an opaque `unknown`. Branchless,
  // so one case for the one exit, asserting only that it REACHES the exit (P4).
  it('VALID: {export function pick(cfg: Config) { return cfg.mode }} => param typed as object Config with its properties, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'pick',
          scopePath: ['*module*', 'pick'],
          params: [
            {
              name: 'cfg',
              type: {
                kind: 'object',
                typeName: 'Config',
                properties: [
                  { name: 'mode', type: { kind: 'string' } },
                  { name: 'retries', type: { kind: 'number' } },
                ],
              },
            },
          ],
          returnType: { kind: 'string' },
          line: 6,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/pick/return@top', kind: 'return', guardPath: [], line: 7 }],
        cases: [
          {
            reachesExit: '*module*/pick/return@top',
            arrange: [{ kind: 'param', param: 'cfg', value: 'abc123' }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The locally-declared `Config` shape is projected into `declaredTypes` with its FULL property list —
  // the source later phases splice per-property value demands onto. Nothing is admitted.
  it('VALID: {a locally-declared interface param} => declaredTypes carries Config, and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [
        {
          name: 'Config',
          properties: [
            { name: 'mode', type: { kind: 'string' } },
            { name: 'retries', type: { kind: 'number' } },
          ],
        },
      ],
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
