import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'branch-local.ts'), 'utf8');
const relPath = 'src/happy-path/object/branch-local/branch-local.ts';
// The syntax-repository package root, so stub-realize resolves against the same layout a real run does.
// `Config` is same-file here, so no cross-file read happens; the root only anchors the (empty) overlay.
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / branch-local — an `if` on an object-member operand, DRIVEN by stub-realize', () => {
  // The per-file walk reads `config.mode` past the property access and records the operand:property fact
  // on the leaf — the root param it reads from (`config`), the `.member` chain (`['mode']`), and the
  // root's declared type-reference (`Config`) — while the property's own type reads `string` off a
  // same-file interface. The per-file blob derives no case for it (arranging an object param's property
  // is a consume-time step), so the analyze-only view still carries the branch as `cases: []`.
  it('VALID: {if (config.mode === "a")} => the leaf records the property path, root type-ref, and reads the property type', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'decide',
          scopePath: ['*module*', 'decide'],
          params: [
            {
              name: 'config',
              type: {
                kind: 'object',
                typeName: 'Config',
                properties: [{ name: 'mode', type: { kind: 'string' } }],
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
              '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'string' },
              predicate: { kind: 'eq', literal: 'a' },
            },
            startLine: 6,
            endLine: 8,
          },
        ],
        exits: [
          {
            coverageId:
              '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then',
            kind: 'return',
            guardPath: [
              {
                branchCoverageId:
                  '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a',
                arm: 'then',
              },
            ],
            line: 7,
          },
          {
            coverageId:
              '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else',
            kind: 'return',
            guardPath: [
              {
                branchCoverageId:
                  '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a',
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

  // The consume-time payoff: stub-realize arranges the `config` object param from the merged stub view,
  // so each arm becomes a driven case — `mode: 'a'` reaches the then exit, a demanded non-'a' value the
  // else. The undriven admission the per-file walk carried is dropped, and no dark spot or lint is owed,
  // so running this file comes out clean (happy-path). Values are INPUTS (derived demands), not outputs.
  it('VALID: {stub-realize over the object param} => both arms driven, undriven cleared, Config still declared', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
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
          reachesExit:
            '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then',
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'a' } }],
          salient: true,
        },
        {
          reachesExit:
            '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else',
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123' } }],
          salient: true,
        },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
      declaredTypes: [
        {
          name: 'Config',
          properties: [{ name: 'mode', type: { kind: 'string' } }],
        },
      ],
    });
  });
});
