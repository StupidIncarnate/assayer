import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uses-greeting.ts'), 'utf8');
const relPath = 'src/import-local/uses-greeting.ts';

describe('import-local / uses-greeting — a call into a function imported from a sibling file', () => {
  // The walk records the RELATIVE import as an edge and the call into it as a reference — both raw and
  // unresolved, for the stitch to resolve `./greeting` to the sibling's definition. The imported name
  // is the SOURCE name (`greeting`), never a local alias; positions are display-only.
  it('VALID: {import { greeting } from "./greeting"; greeting()} => one relative import edge and one reference', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [{ kind: 'import', specifier: './greeting', bindings: [{ kind: 'named', name: 'greeting' }], line: 1, column: 1 }],
      references: [{ specifier: './greeting', importedName: 'greeting', line: 3, column: 24 }],
      globalUses: [],
    });
  });

  // Calling an import is a CONSUMPTION site, so the module scope is a DRIVEN entry — importing the
  // module runs `greeting()` and reaches the module's single exit. Branchless, so it owes exactly one
  // happy-path case that arranges nothing (P4: the bound value is never fabricated).
  it('VALID: {export const message = greeting()} => one module entry with one structural happy-path case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: '*module*',
          scopePath: ['*module*'],
          params: [],
          returnType: { kind: 'unknown', text: 'void' },
          line: 1,
          access: { kind: 'module' },
          exportName: 'message',
        },
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
        cases: [{ reachesExit: '*module*/exit@top', arrange: [] }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
