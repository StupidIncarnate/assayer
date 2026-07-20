import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'arg-position.ts'), 'utf8');
const relPath = 'src/sad-path/ternary/arg-position/arg-position.ts';

describe('ternary / arg-position — a ternary in a CALL ARGUMENT', () => {
  // v1 value-flow reaches only the adjacent `const x = ternary; return x` tail. A ternary consumed by a
  // call argument has no exit to split, so it stays an ADMITTED dark spot rather than a fabricated fill.
  // This is the boundary ratchet: the day the reverse-map rung lands, the split reaches here too.
  it('VALID: {`return label(n > 5 ? a : b)`} => the ternary is a DARK SPOT, not split', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = analyzeFileBroker({ walked });

    expect(analysis.darkSpots).toStrictEqual([
      {
        kind: 'ConditionalExpression',
        scopePath: ['*module*', 'pick'],
        reason: 'unhandled-syntax',
        startLine: 6,
        endLine: 6,
      },
    ]);
  });

  // The value-flow detector does NOT match argument position: `pick`'s return expression is a call, not
  // a bare declared identifier, so no branch is emitted and the single unguarded return stands. `label`
  // is a branchless private consumed by `pick`, projected as no entry of its own.
  it('VALID: {ternary in a call arg} => the one entry `pick` has no branch and an unguarded return', () => {
    const result = analyzeExtractBroker({ source, relPath });

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
          branches: [],
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
