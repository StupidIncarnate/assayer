import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'settings.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-reader/settings.ts';

describe('object / cross-file-reader — settings.ts, the CHILD that declares the shape', () => {
  // The definition side of the rung: the shape is declared here and enumerated here, which is what the
  // reader's consume-time resolution reads. Driven on its own too, since a local object param fills.
  it('VALID: {interface Settings + a branchless reader of it} => the full shape is declared and filled', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'settings.ts') }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [
        {
          name: 'Settings',
          properties: [
            { name: 'label', type: { kind: 'string' } },
            { name: 'timeout', type: { kind: 'number' } },
          ],
        },
      ],
      cases: [
        {
          reachesPath: ['*module*/withDefaults/return@top'],
          arrange: [{ kind: 'object', param: 'settings', value: { label: 'abc123', timeout: 7 } }],
          salient: true,
        },
      ],
      gaps: [],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
