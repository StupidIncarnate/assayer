import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'types.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-shape/types.ts';

describe('object / cross-file-shape — types.ts, the DEFINITION file whose declared Config the union splices onto', () => {
  // The definition file ENUMERATES the full `Config` shape into `declaredTypes` — the source the stub
  // stitch reads to key the cross-file stub and splice every reader's per-property demands onto. The
  // DECLARATION is what enumerates it, so the shape is there whether or not anything in this file uses
  // it. `withDefaults` is here to give the file a runnable entry: it is branchless, so it derives one
  // case and admits nothing, which is what puts this file in happy-path. Its arrange is an OBJECT
  // binding built from that same enumerated shape, one value per declared property.
  it('VALID: {export interface Config + withDefaults(config: Config)} => declaredTypes carries the full Config property list, one case, nothing admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

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
          reachesPath: ['*module*/withDefaults/return@top'],
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123', retries: 7 } }],
          salient: true,
        },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
