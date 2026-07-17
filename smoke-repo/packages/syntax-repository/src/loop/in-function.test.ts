import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'in-function.ts'), 'utf8');

describe('loop / in-function — a for-of loop inside an exported function', () => {
  // No loop handler exists yet, so the loop yields no branches. That is a GAP, not a claim of
  // completeness — see the dark-spot assertion below, which is what stops the map from quietly
  // looking finished.
  it('EDGE: {for-of loop} => yields no branches (no loop handler exists yet)', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/loop/in-function.ts' });
    const branches = result.success ? result.functions.flatMap((fn) => fn.branches) : [];

    expect(branches).toStrictEqual([]);
  });

  // The whole point of the dark spot: unrecognized is not the same as invisible. The analyzer says
  // out loud that it did not follow this loop, rather than returning a map that looks complete.
  it('VALID: {for-of loop} => is reported as a DARK SPOT rather than silently dropped', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/loop/in-function.ts' });
    const analysis = analyzeFileBroker({ walked });

    expect(analysis.darkSpots).toStrictEqual([
      {
        kind: 'ForOfStatement',
        scopePath: ['*module*', 'sumAll'],
        reason: 'unhandled-syntax',
        startLine: 4,
        endLine: 6,
      },
    ]);
  });

  // Descending an unhandled node is what keeps its contents from vanishing with it.
  it('VALID: {for-of loop} => the return AFTER the loop is still found', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/loop/in-function.ts' });
    const lines = result.success ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.line) : [];

    expect(lines).toStrictEqual([8]);
  });
});
