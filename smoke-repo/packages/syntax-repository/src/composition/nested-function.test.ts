import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'nested-function.ts'), 'utf8');

describe('composition / nested-function — a function declared inside a function', () => {
  it('VALID: {nested function} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('nested-function.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

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
          },
          branches: [],
          exits: [{ coverageId: '*module*/outer/return@top', kind: 'return', guardPath: [], line: 10 }],
        },
      ],
    });
  });

  // EDGE / known gap, asserted so it cannot regress silently. `inner` IS walked (it is a real scope
  // with its own branches and exits) but is not projected as an entry, because nothing outside the
  // module can call it and driving it directly would be testing a private. Its logic is therefore
  // owed coverage THROUGH `outer` — which needs call-graph following, a separate vertical.
  it('EDGE: {nested function} => inner is not an entry of its own (its logic is owed through outer)', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/composition/nested-function.ts' });
    const names = result.success ? result.functions.map((fn) => fn.entry.name) : [];

    expect(names).toStrictEqual(['outer']);
  });
});
