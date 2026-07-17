import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'nested-function.ts'), 'utf8');

describe('composition / nested-function — a function declared inside a function', () => {
  // REGRESSION GUARD. `inner`'s `if` belongs to `inner`, not to `outer`. The old scans collected
  // descendant nodes and re-derived ownership by climbing ancestors; the walk carries scope down,
  // so a nested function's branches cannot leak into its parent.
  it('VALID: {nested function} => the inner if does NOT leak into the outer entry', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/nested-function.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'outer',
            scopePath: ['*module*', 'outer'],
            params: [{ name: 'value', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [],
          exits: [{ coverageId: '*module*/outer/return@top', kind: 'return', guardPath: [], line: 10 }],
        },
      ],
    });
  });

  // EDGE, asserted so it cannot regress silently. `inner` IS walked (it is a real scope with its own
  // branches and exits) but is not projected as an entry, because nothing outside the module can call
  // it and driving it directly would be testing a private. Its logic is therefore owed coverage
  // THROUGH `outer` — which needs call-graph following, a separate vertical.
  it('EDGE: {nested function} => inner is not an entry of its own (its logic is owed through outer)', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/nested-function.ts' });
    const names = result.success ? result.functions.map((fn) => fn.entry.name) : [];

    expect(names).toStrictEqual(['outer']);
  });

  // Not an entry, but not a secret either. `inner`'s `if` and two returns are real logic no case
  // reaches, and the analysis above reports one entry with zero branches — which reads as a file
  // fully covered unless something says otherwise. This is that something.
  it('VALID: {nested function} => inner is ADMITTED as undriven rather than silently absent', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/composition/nested-function.ts' });
    const analysis = analyzeFileBroker({ walked });

    expect(analysis.undriven.map((entry) => String(entry.name))).toStrictEqual(['inner']);
  });

  // NOT a dark spot, and the distinction is the point: a dark spot means Assayer never understood the
  // syntax, and it understood `inner` perfectly — branches, exits and all. Filing it there would blame
  // the parser for what is only the runner's reach, and tell the reader nothing they can act on.
  it('VALID: {nested function} => inner is not a dark spot, since the walk read it fine', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/composition/nested-function.ts' });
    const analysis = analyzeFileBroker({ walked });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
