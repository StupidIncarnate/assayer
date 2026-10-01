import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'component.tsx'), 'utf8');
const relPath = 'src/happy-path/tsx/component/component.tsx';

describe('tsx / component — the .tsx FILE-EXTENSION rung, a component returning JSX from an if/else', () => {
  // Bespoke to this file: the analyzer reads a `.tsx` source exactly as a `.ts` one, deriving the sound
  // branch pair over `urgent` — the JSX each arm returns never enters analysis (P4; §5.1's descend-the-
  // expression corollary), so the returned `<strong>`/`<span>` elements do not appear anywhere below.
  it('VALID: {a .tsx component with an if/else returning JSX} => one entry, one branch, both arms driven', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'Badge',
          scopePath: ['*module*', 'Badge'],
          params: [
            { name: 'label', type: { kind: 'string' } },
            { name: 'urgent', type: { kind: 'boolean' } },
          ],
          // `JSX.Element` is not a same-file declared shape, so it reads as the checker's own rendering
          // rather than an enumerated object — the same `unknown` + `text` + `typeRef` shape any opaque
          // return annotation gets.
          returnType: { kind: 'unknown', text: 'JSX.Element', typeRef: 'JSX.Element' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: '*module*/Badge/if:id:urgent',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/Badge/if:id:urgent#leaf',
              operandParamName: 'urgent',
              operandType: { kind: 'boolean' },
              predicate: { kind: 'truthy' },
            },
            startLine: 2,
            endLine: 4,
          },
        ],
        exits: [
          {
            coverageId: '*module*/Badge/return@if:id:urgent#then',
            kind: 'return',
            guardPath: [{ branchCoverageId: '*module*/Badge/if:id:urgent', arm: 'then' }],
            line: 3,
          },
          {
            coverageId: '*module*/Badge/return@if:id:urgent#else',
            kind: 'return',
            guardPath: [{ branchCoverageId: '*module*/Badge/if:id:urgent', arm: 'else' }],
            line: 6,
          },
        ],
        cases: [
          {
            reachesPath: ['*module*/Badge/return@if:id:urgent#then'],
            arrange: [
              { kind: 'param', param: 'label', value: 'abc123' },
              { kind: 'param', param: 'urgent', value: true },
            ],
            salient: true,
          },
          {
            reachesPath: ['*module*/Badge/return@if:id:urgent#else'],
            arrange: [
              { kind: 'param', param: 'label', value: 'abc123' },
              { kind: 'param', param: 'urgent', value: false },
            ],
            salient: true,
          },
        ],
      },
    ]);
  });

  it('VALID: {a .tsx component} => nothing admitted, no declared shape', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      gaps: analysis.gaps,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], gaps: [], darkSpots: [], undriven: [], lints: [] });
  });
});
