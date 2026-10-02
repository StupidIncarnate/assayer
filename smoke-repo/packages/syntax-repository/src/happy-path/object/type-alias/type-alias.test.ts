import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'type-alias.ts'), 'utf8');
const relPath = 'src/happy-path/object/type-alias/type-alias.ts';

describe('object / type-alias — a branchless function over a PLAIN (non-generic) local `type X = { … }`', () => {
  // Bespoke to this file: `type Config = { … }` reads exactly like `local-shape.ts`'s `interface
  // Config { … }` — a same-file OBJECT type, its `typeName` the alias's own name (never the anonymous
  // `__type` a `type` produces; §3 of the CLAUDE.md — an object's name is its ALIAS symbol's whenever
  // the object symbol itself is anonymous). The interface and alias spellings of one shape are
  // indistinguishable downstream, which is what this pins.
  it('VALID: {export function pick(cfg: Config) { return cfg.mode }} => param typed as object Config with its properties, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'type-alias.ts') }), relPath });

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
            reachesPath: ['*module*/pick/return@top'],
            arrange: [{ kind: 'object', param: 'cfg', value: { mode: 'abc123', retries: 7 } }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The plain alias projects into `declaredTypes` with its FULL property list, exactly as an interface
  // does — the source the stub stitch reads to key the cross-file stub. Nothing is admitted.
  it('VALID: {a locally-declared plain type-alias param} => declaredTypes carries Config, and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'type-alias.ts') }), relPath });

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
