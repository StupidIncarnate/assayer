import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-default.ts'), 'utf8');
const relPath = 'src/happy-path/export-default/const-default/const-default.ts';

describe('export-default / const-default — a const arrow exported by a LATER `export default`', () => {
  // Reach is read off the module's resolved export table, not off the keyword on the declaration.
  // Read off the keyword, this const is private, its entry vanishes, and the file's only surface is
  // reported as dead code the repo should delete — a build failing over ordinary correct code.
  it('VALID: {const decide; export default decide} => a DEFAULT-access entry, the same as `export default function`', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: 'decide', access: { kind: 'default' } },
    ]);
  });

  it('VALID: {an exported const arrow} => nothing is admitted, and its `if` drives both arms', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      gaps: analysis.gaps,
      cases: analysis.functions.flatMap((fn) => fn.cases.map((testCase) => testCase.arrange)),
    }).toStrictEqual({
      lints: [],
      undriven: [],
      gaps: [],
      cases: [
        [{ kind: 'param', param: 'size', value: 6 }],
        [{ kind: 'param', param: 'size', value: 5 }],
      ],
    });
  });
});
