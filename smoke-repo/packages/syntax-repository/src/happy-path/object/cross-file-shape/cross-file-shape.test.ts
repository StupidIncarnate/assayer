import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'cross-file-shape.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-shape/cross-file-shape.ts';
// The syntax-repository package root, so stub-realize resolves `./types` to its sibling on disk exactly
// as a real run does, and reads the imported `Config` shape it cannot see in the hermetic single-file walk.
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / cross-file-shape — decideA reads config.mode off an IMPORTED Config, DRIVEN cross-file by stub-realize', () => {
  // The hermetic single-file walk cannot resolve `import { Config } from './types'`, so the param types
  // as an opaque `unknown` here — yet the leaf STILL captures the operand:property fact (root `config`,
  // path `['mode']`, type-ref `Config`) the stub view keys on. The per-file blob derives no case for it.
  it("VALID: {if (config.mode === 'a') on imported Config} => the leaf records the property path and type-ref though the param is unknown", () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'decideA',
          scopePath: ['*module*', 'decideA'],
          params: [{ name: 'config', type: { kind: 'unknown', text: 'Config' } }],
          returnType: { kind: 'string' },
          line: 3,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'unknown', text: 'any' },
              predicate: { kind: 'eq', literal: 'a' },
            },
            startLine: 4,
            endLine: 6,
          },
        ],
        exits: [
          {
            coverageId: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then',
            kind: 'return',
            guardPath: [
              { branchCoverageId: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a', arm: 'then' },
            ],
            line: 5,
          },
          {
            coverageId: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else',
            kind: 'return',
            guardPath: [
              { branchCoverageId: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a', arm: 'else' },
            ],
            line: 8,
          },
        ],
        cases: [],
      },
    ]);
  });

  // The cross-file payoff: stub-realize resolves the `Config` import, reads its full shape off types.ts,
  // and arranges the `config` object param per arm — `mode: 'a'` reaches the then exit, a demanded non-'a'
  // value the else, with the unread `region`/`retries` filled from their types. The undriven admission
  // the per-file walk carried is dropped; the `./types` import edge is still recorded, and this file
  // declares no type of its own. So running it comes out clean (happy-path).
  it("VALID: {stub-realize resolves Config from ./types} => both arms driven cross-file, undriven cleared, import edge intact", () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
      declaredTypes: analysis.declaredTypes,
      edges: moduleGraphProjectionTransformer({ walked }).edges,
    }).toStrictEqual({
      cases: [
        {
          reachesExit: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then',
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'a', region: 'abc123', retries: 7 } }],
          salient: true,
        },
        {
          reachesExit: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else',
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123', retries: 7 } }],
          salient: true,
        },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
      declaredTypes: [],
      edges: [{ kind: 'import', specifier: './types', bindings: [{ kind: 'named', name: 'Config' }], line: 1, column: 1 }],
    });
  });
});
