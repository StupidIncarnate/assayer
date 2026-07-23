import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'types.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-shape/types.ts';

describe('object / cross-file-shape — types.ts, the DEFINITION file whose declared Config the union splices onto', () => {
  // The definition file ENUMERATES the full `Config` shape into `declaredTypes` — the source the stub
  // stitch reads to key the cross-file stub and splice every reader's per-property demands onto. It is
  // enumerated because a same-file scope (`withDefaults`) uses it as a param; a bare interface with no
  // local use would not enumerate in the hermetic walk. The passthrough is branchless, so it derives
  // one case and admits nothing — this file is the type's definition, not one of its readers.
  it('VALID: {export interface Config + withDefaults(config: Config)} => declaredTypes carries the full Config property list, one case, nothing admitted', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      cases: analysis.functions.flatMap((fn) => fn.cases),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [
        {
          name: 'Config',
          properties: [
            { name: 'mode', type: { kind: 'string' } },
            { name: 'region', type: { kind: 'string' } },
            { name: 'retries', type: { kind: 'number' } },
          ],
        },
      ],
      cases: [
        {
          reachesExit: '*module*/withDefaults/return@top',
          arrange: [{ kind: 'param', param: 'config', value: 'abc123' }],
          salient: true,
        },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
