import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'arrow.ts'), 'utf8');
const relPath = 'src/happy-path/function/arrow/arrow.ts';

describe('function / arrow — a block-bodied arrow function bound to an exported const', () => {
  // An UNNAMED arrow (`(n) => { … }`) assigned to an exported const is analysed exactly as a named
  // declaration: exporting the const makes it `access:named`, and its `if` derives the sound pair. The
  // arrow syntax changes nothing — the const binding supplies the entry name and the branch drives.
  it('VALID: {export const grade = (n) => { if (n > 5) … }} => a named, driven entry with both arms', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'grade',
        access: { kind: 'named' },
        cases: [
          {
            reachesPath: ['*module*/grade/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#then'],
            arrange: [{ kind: 'param', param: 'n', value: 6 }],
            salient: true,
          },
          {
            reachesPath: ['*module*/grade/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#else'],
            arrange: [{ kind: 'param', param: 'n', value: 5 }],
            salient: true,
          },
        ],
      },
    ]);
  });

  it('VALID: {a driven arrow function} => admits nothing', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots, lints: analysis.lints }).toStrictEqual({
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
