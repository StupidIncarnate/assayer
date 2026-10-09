import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { paramTypeResolveBroker } from '@assayer/core/param-type-resolve';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'cross-file-reader.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-reader/cross-file-reader.ts';
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / cross-file-reader — a reader that USES an imported shape and never branches on it', () => {
  // The hermetic walk types an imported parameter as `any` and records only the reference the signature
  // spelled, so the per-file blob has no shape to fill from — which is why the refusal lives here rather
  // than in the reader's code.
  it('VALID: {settings: Settings, imported} => the parameter is opaque and carries its type reference', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'cross-file-reader.ts') }), relPath });

    expect({
      params: analysis.functions.flatMap((fn) => fn.entry.params),
      cases: analysis.functions.flatMap((fn) => fn.cases),
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({
      params: [{ name: 'settings', type: { kind: 'unknown', text: 'Settings', typeRef: 'Settings' } }],
      cases: [],
      declaredTypes: [],
    });
  });

  // The whole point of this rung: NO branch reads a member, so nothing about the entry's own control flow
  // could rescue the shape. Resolution turns on the DECLARATION alone, which is why a plain reader stops
  // being invoiced for an input the file next door constructs happily.
  it('VALID: {param-type-resolve reads Settings off ./settings} => the shape is filled and no gap is owed', () => {
    const walked = walkFileTransformer({ source, relPath, absPath: join(__dirname, 'cross-file-reader.ts') });
    const analysis = paramTypeResolveBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath });

    expect({
      params: analysis.functions.flatMap((fn) => fn.entry.params),
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({
      params: [
        {
          name: 'settings',
          type: {
            kind: 'object',
            typeName: 'Settings',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'timeout', type: { kind: 'number' } },
            ],
          },
        },
      ],
      cases: [
        {
          reachesPath: ['*module*/readTimeout/return@top'],
          arrange: [{ kind: 'object', param: 'settings', value: { label: 'abc123', timeout: 7 } }],
          salient: true,
        },
      ],
      gaps: [],
      undriven: [],
      darkSpots: [],
      lints: [],
      // A sibling's shape is not a shape this file declares — letting one in would key its stub on the
      // reader rather than on the definition, and the committed correction would stop matching.
      declaredTypes: [],
    });
  });
});
