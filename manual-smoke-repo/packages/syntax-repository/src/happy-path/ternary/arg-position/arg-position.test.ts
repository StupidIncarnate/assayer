import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'arg-position.ts'), 'utf8');
const relPath = 'src/happy-path/ternary/arg-position/arg-position.ts';

const BRANCH = '*module*/pick/ternary:BinaryExpression,id:n,GreaterThanToken,num:5';

describe('ternary / arg-position — a ternary in a CALL ARGUMENT', () => {
  // The ternary's value flows into `label(...)`, so it is not an exit. It is a branch of `pick` whose two
  // arms meet again at the `return`, so nothing about the file is left unread.
  it('VALID: {`return label(n > 5 ? a : b)`} => no dark spot, no undriven admission and no lint', () => {
    const walked = walkFileTransformer({ source, relPath, absPath: join(__dirname, 'arg-position.ts') });
    const analysis = analyzeFileBroker({ walked });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });

  // `pick` owns one ternary branch on `n > 5` and the one unguarded return both arms reach. `label` is a
  // branchless private consumed by `pick`, so it projects as no entry of its own.
  it('VALID: {ternary in a call arg} => the one entry `pick` has the ternary branch and an unguarded return', () => {
    const result = analyzeExtractBroker({ source, relPath, absPath: join(__dirname, 'arg-position.ts') });

    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'pick',
            scopePath: ['*module*', 'pick'],
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 5,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'n',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 6,
              endLine: 6,
            },
          ],
          exits: [
            {
              coverageId: '*module*/pick/return@top',
              kind: 'return',
              guardPath: [],
              line: 6,
            },
          ],
        },
      ],
    });
  });
});
