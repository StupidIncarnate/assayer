import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'property-depth.ts'), 'utf8');
const relPath = 'src/happy-path/object/property-depth/property-depth.ts';
// The syntax-repository package root, so stub-realize resolves against the same layout a real run does.
// `Config` is same-file here, so no cross-file read happens; the root only anchors the (empty) overlay.
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / property-depth — `config.db.retry`, a property path more than one segment deep, DRIVEN by stub-realize', () => {
  // The per-file walk reads `config.db.retry` past BOTH property accesses and records the full path on
  // the leaf — `operandPropertyPath: ['db', 'retry']` — the same fact a one-segment `config.mode` read
  // carries, just longer. Arranging an object param's property, at any depth, is a consume-time step, so
  // the per-file blob still derives no case and the branch is still admitted undriven here.
  it('VALID: {if (config.db.retry === 3)} => the leaf records the full two-segment path and the root type-ref', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'checkDeep',
          scopePath: ['*module*', 'checkDeep'],
          params: [
            {
              name: 'config',
              type: {
                kind: 'object',
                typeName: 'Config',
                properties: [
                  {
                    name: 'db',
                    type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] },
                  },
                ],
              },
            },
          ],
          returnType: { kind: 'string' },
          line: 5,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId:
              '*module*/checkDeep/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/checkDeep/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['db', 'retry'],
              operandTypeRef: 'Config',
              operandType: { kind: 'number' },
              predicate: { kind: 'eq', literal: 3 },
            },
            startLine: 6,
            endLine: 8,
          },
        ],
        exits: [
          {
            coverageId:
              '*module*/checkDeep/return@if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3#then',
            kind: 'return',
            guardPath: [
              {
                branchCoverageId:
                  '*module*/checkDeep/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3',
                arm: 'then',
              },
            ],
            line: 7,
          },
          {
            coverageId:
              '*module*/checkDeep/return@if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3#else',
            kind: 'return',
            guardPath: [
              {
                branchCoverageId:
                  '*module*/checkDeep/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3',
                arm: 'else',
              },
            ],
            line: 10,
          },
        ],
        cases: [],
      },
    ]);
  });

  // The consume-time payoff: stub-realize recurses into `db`'s own shape and arranges its `retry`
  // property from the merged stub view, so each arm becomes a driven case with a REAL nested object —
  // `db: { retry: 3 }` reaches the then exit, `db: { retry: 7 }` the else. The undriven admission the
  // per-file walk carried is dropped, and no dark spot or lint is owed, so running this file comes out
  // clean (happy-path). Values are INPUTS (derived demands), not outputs.
  it('VALID: {stub-realize over the object param} => both arms driven, db built as a real nested object, undriven cleared', () => {
    const walked = walkFileTransformer({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({
      cases: [
        {
          reachesPath: [
            '*module*/checkDeep/return@if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3#then',
          ],
          arrange: [{ kind: 'object', param: 'config', value: { db: { retry: 3 } } }],
          salient: true,
        },
        {
          reachesPath: [
            '*module*/checkDeep/return@if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:db,id:retry,EqualsEqualsEqualsToken,num:3#else',
          ],
          arrange: [{ kind: 'object', param: 'config', value: { db: { retry: 7 } } }],
          salient: true,
        },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
      declaredTypes: [
        {
          name: 'Config',
          properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }],
        },
      ],
    });
  });
});
