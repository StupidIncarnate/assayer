import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-arrow-callee.ts'), 'utf8');
const relPath = 'src/happy-path/composition/const-arrow-callee/const-arrow-callee.ts';

describe('composition / const-arrow-callee — a private declared as a CONST-BOUND ARROW, called by name', () => {
  // The callee link resolves off the declaration's KIND, so a `const` bound to an arrow is a local link
  // exactly as a `function` declaration is. Read it as unresolvable and `classify` is reached by nothing:
  // a dead-surface LINT against a private the exported entry calls four lines below.
  it('VALID: {report calls classify} => the call resolves locally, so no dead-surface lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'const-arrow-callee.ts') }), relPath });

    expect({ lints: analysis.lints, undriven: analysis.undriven, darkSpots: analysis.darkSpots, gaps: analysis.gaps }).toStrictEqual({
      lints: [],
      undriven: [],
      darkSpots: [],
      gaps: [],
    });
  });

  // With the link resolved, the driving route runs: `report` passes its own input straight through, so
  // `classify`'s two arms funnel into the surface's case set and the surface is the only entry.
  it("VALID: {return classify(n)} => the callee's arms funnel into the surface, one case each", () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'const-arrow-callee.ts') }), relPath });

    expect({
      entries: analysis.functions.map((fn) => String(fn.entry.name)),
      cases: analysis.functions.flatMap((fn) => fn.cases),
    }).toStrictEqual({
      entries: ['report'],
      cases: [
        {
          reachesPath: [
            '*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:3#then',
            '*module*/report/return@top',
          ],
          arrange: [{ kind: 'param', param: 'n', value: 4 }],
          salient: true,
        },
        {
          reachesPath: [
            '*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:3#else',
            '*module*/report/return@top',
          ],
          arrange: [{ kind: 'param', param: 'n', value: 3 }],
          salient: true,
        },
      ],
    });
  });
});
