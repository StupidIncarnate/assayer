import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'no-else.ts'), 'utf8');
const relPath = 'src/happy-path/if/no-else/no-else.ts';

const BRANCH = '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5';
const TOP_EXIT = '*module*/classify/exit@top';

describe('if / no-else — a tail if with no else, whose only arm falls through', () => {
  // The defect this pins: a tail `if` with no else used to mint its OWN completion exit for the
  // `then` arm on top of the enclosing scope's own unaccounted-for exit — two probes on one
  // execution, since falling off the `then` arm and falling off the missing else both continue into
  // the exact same code. `classify` has exactly ONE exit: the enclosing scope's own `exit@top`. No
  // `#then`-guarded completion exists beside it.
  it('VALID: {tail if with no else} => one entry, one if branch, exactly ONE exit (no per-arm completion)', () => {
    const result = analyzeExtractBroker({ source, relPath });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'classify',
            scopePath: ['*module*', 'classify'],
            params: [{ name: 'value', type: { kind: 'number' } }],
            returnType: { kind: 'unknown', text: 'void' },
            line: 5,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'value',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 6,
              endLine: 8,
            },
          ],
          exits: [{ coverageId: TOP_EXIT, kind: 'implicit', guardPath: [], line: 9 }],
        },
      ],
    });
  });

  // Both buckets — condition true (`then` falls through to the scope's end) and condition false
  // (the missing else) — converge on the SAME `exit@top`, exactly as any two buckets sharing an exit
  // do (§5.13). The first is the salient representative; the second is the grayed breadth twin. If a
  // per-arm completion were minted instead, this would be TWO cases with DIFFERENT `reachesPath`, and
  // the `then` one would fail a real run — pinned end to end by
  // `run-unit-broker.integration.test.ts`'s `TAIL_NO_ELSE_SPECIMEN`.
  it('VALID: {tail if with no else} => both arms converge on the one exit, second grayed', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [TOP_EXIT], arrange: [{ kind: 'param', param: 'value', value: 6 }], salient: true },
      { reachesPath: [TOP_EXIT], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: false },
    ]);
  });

  it('VALID: {tail if with no else} => nothing admitted as undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
