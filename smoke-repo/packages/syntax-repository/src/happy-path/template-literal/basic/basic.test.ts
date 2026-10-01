import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'basic.ts'), 'utf8');
const relPath = 'src/happy-path/template-literal/basic/basic.ts';

describe('template-literal / basic — a branchless function over a template literal type param', () => {
  // A template literal type whose substitution is not a closed set of literals (here, plain `string`)
  // reads as its own `template` fact: the literal segments in source order (`'id-'` then `''`, the
  // segment after the one substitution) and one fact per substitution. No `declaredText`, because the
  // descriptor's own rendering already matches the source's spelling exactly.
  //
  // The arrange is the payoff: `t` is filled as a plain STRING built by interpolating the substitution's
  // own representative point between the literal segments — `'id-' + 'abc123' + ''` — never a bare
  // placeholder unrelated to the declared pattern.
  it('VALID: {export function idLength(t: `id-${string}`) { return t.length }} => param typed as a template literal type, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'idLength',
          scopePath: ['*module*', 'idLength'],
          params: [
            {
              name: 't',
              type: { kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] },
            },
          ],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/idLength/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/idLength/return@top'],
            arrange: [{ kind: 'param', param: 't', value: 'id-abc123' }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // A clean run: no object shape to declare, and nothing admitted.
  it('VALID: {a template literal type param} => no declaredTypes, and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      gaps: analysis.gaps,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], gaps: [], lints: [] });
  });
});
