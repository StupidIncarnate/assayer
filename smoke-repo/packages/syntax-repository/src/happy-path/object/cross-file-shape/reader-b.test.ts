import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'reader-b.ts'), 'utf8');
const relPath = 'src/happy-path/object/cross-file-shape/reader-b.ts';
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / cross-file-shape — reader-b.ts, the SECOND reader of Config, DRIVEN on a DIFFERENT property', () => {
  // The second reader of the same imported `Config` reads `config.region`, a property `cross-file-shape`
  // never touches. Its leaf captures the `['region']` property path and the `Config` type-ref; the
  // per-file walk cannot type the imported param, so it derives no case there.
  it("VALID: {if (config.region === 'us') on imported Config} => region property captured, no per-file case, no local type", () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      leaves: analysis.functions.flatMap((fn) => fn.branches.map((branch) => branch.condition)),
      cases: analysis.functions.flatMap((fn) => fn.cases),
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({
      leaves: [
        {
          kind: 'leaf',
          id: '*module*/decideB/if:BinaryExpression,PropertyAccessExpression,id:config,id:region,EqualsEqualsEqualsToken,str:us#leaf',
          operandParamName: 'config',
          operandPropertyPath: ['region'],
          operandTypeRef: 'Config',
          operandType: { kind: 'unknown', text: 'any' },
          predicate: { kind: 'eq', literal: 'us' },
        },
      ],
      cases: [],
      declaredTypes: [],
    });
  });

  // Driven cross-file exactly as cross-file-shape is: stub-realize resolves `Config` off types.ts and
  // arranges `region` per arm — `region: 'us'` reaches the then exit, a demanded non-'us' value the else,
  // with the unread `mode`/`retries` filled from their types. Undriven cleared; runs clean (happy-path).
  it("VALID: {stub-realize resolves Config from ./types} => both arms driven on region, undriven cleared", () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      cases: [
        {
          reachesExit: '*module*/decideB/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:region,EqualsEqualsEqualsToken,str:us#then',
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'us', retries: 7 } }],
          salient: true,
        },
        {
          reachesExit: '*module*/decideB/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:region,EqualsEqualsEqualsToken,str:us#else',
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
